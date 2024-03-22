import {
    BadRequestException,
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OAuth2Client } from 'google-auth-library';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { SendGridService } from '@anchan828/nest-sendgrid';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { BearerToken, SuccessMessage } from '@src/auth/auth.response.types';
import { ClientType, User } from '@src/user/user.model';
import { UserService } from '@src/user/user.service';
import { AttemptService } from '@src/attempt/attempt.service';
import { AttemptType } from '@src/attempt/attempt.model';
import { LoginDto } from './dto/login-dto';
import { RegisterUserDto } from './dto/register-dto';
import { IVerificationRepository } from './auth.interfaces';
import { VerifyCode } from './auth.model';
import 'dotenv/config';

@Injectable()
export class AuthService {
    private googleClientId = process.env.GOOGLE_CLIENT_ID;
    private oAuth2Client = new OAuth2Client(this.googleClientId);

    constructor(
        @InjectRepository(VerifyCode) private verificationCodeRepository: Repository<IVerificationRepository>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly attemptService: AttemptService,
        private readonly sendGrid: SendGridService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async deleteExpiredRecords() {
        const expiryDate = new Date(Date.now() - 60 * 1000);
        await this.verificationCodeRepository.delete({
            expiryDate: LessThan(expiryDate),
        });
    }

    async registration(dto: RegisterUserDto): Promise<SuccessMessage> {
        const user = await this.userService.getUserByEmail(dto.email);

        if (user) {
            throw new ConflictException('User with this email already exists');
        }

        const newUser = await this.userService.createUser(dto);

        if (!newUser) {
            throw new BadRequestException('Something went wrong.');
        }

        return { message: 'User successfully registered.' };
    }

    async login(dto: LoginDto, agent: string): Promise<BearerToken> {
        const user = await this.userService.getUserByEmail(dto.email);

        if (user) {
            const attemptCheck = {
                userId: String(user.id),
                where: AttemptType.LOGIN,
                userAgent: agent,
            };

            await this.attemptService.check(attemptCheck);

            if (user.client !== 'NONE' || !compareSync(dto.password, user.password)) {
                throw new UnauthorizedException('Incorrect email or password.');
            }

            await this.attemptService.remove(attemptCheck);
            return this.generateToken(user);
        } else {
            throw new UnauthorizedException('Incorrect email or password.');
        }
    }

    private async generateToken(user: User): Promise<BearerToken> {
        const accessToken = this.jwtService.sign({
            id: user.id,
            email: user.email,
        });

        return { token: accessToken };
    }

    async googleAuthorization(idToken: string): Promise<BearerToken> {
        const email = await this.verifyIdToken(idToken);

        if (!email) {
            throw new NotFoundException('invalid google token.');
        }

        const { GOOGLE } = ClientType;

        const user = await this.userService.getUserByEmail(email);

        if (user) {
            if (user.client !== GOOGLE) {
                throw new ConflictException('User with this email already exists without google provider.');
            }

            return this.generateToken(user);
        }

        const now = new Date();

        const newGoogleUser = {
            email,
            username: `user${now.getTime()}`,
            client: GOOGLE,
        };

        const newUser = await this.userService.createUser(newGoogleUser);

        if (!newUser) {
            throw new BadRequestException('Something went wrong.');
        }

        return this.generateToken(newUser);
    }

    private async verifyIdToken(idToken: string): Promise<string> {
        try {
            const ticket = await this.oAuth2Client.verifyIdToken({
                idToken,
                audience: this.googleClientId,
            });

            const payload = ticket.getPayload();

            return payload.email;
        } catch (error) {
            throw new UnauthorizedException('Invalid ID Token');
        }
    }

    async sendCode(email: string, res: any): Promise<any> {
        const user = await this.userService.getUserByEmail(email);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'Error' });
        }

        const existingCode = await this.verificationCodeRepository.findOne({
            where: { email: email },
            order: {
                expiryDate: 'DESC',
            },
        });

        const now = new Date();

        if (existingCode) {
            const timeDiff = now.getTime() - existingCode.expiryDate.getTime();

            if (timeDiff < 60 * 1000) {
                throw new BadRequestException('The code has already been sent. Please wait.');
            } else {
                await this.verificationCodeRepository.delete({ email: email });
            }
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const hashedCode = await hashSync(code, genSaltSync(10));

        const expiryDate = new Date(Date.now() + 60 * 1000);

        await this.verificationCodeRepository.save({ email: user.email, code: hashedCode, expiryDate });

        await this.sendGrid.send({
            to: email,
            from: process.env.FROM_EMAIL,
            subject: 'Move Match Application',
            text: 'and easy to do anywhere, even with Node.js',
            html: `<span>${code}</span>`,
        });

        return res.status(HttpStatus.OK).json({ message: 'Code sent' });
    }

    async verifyCode(email: string, code: string, res: any) {
        const user = await this.userService.getUserByEmail(email);

        if (!user) {
            throw new NotFoundException('Error');
        }

        const verificationRecord = await this.verificationCodeRepository.findOne({
            where: { email: email },
            order: { expiryDate: 'DESC' },
        });

        if (!verificationRecord) {
            throw new BadRequestException('Verification code not found');
        }

        const now = new Date();
        if (verificationRecord.expiryDate.getTime() < now.getTime()) {
            throw new BadRequestException('Verification code has expired');
        }

        const isCodeMatch = await compareSync(code, verificationRecord.code);

        if (!isCodeMatch) {
            throw new BadRequestException('Invalid verification code');
        }

        return res.status(HttpStatus.OK).json({ message: 'Verification successful' });
    }

    async changePassword(email: string, code: string, newPassword: string, res: any): Promise<any> {
        const user = await this.userService.getUserByEmail(email);
        if (!user) {
            throw new NotFoundException('Error');
        }

        const verificationRecord = await this.verificationCodeRepository.findOne({
            where: { email: email },
            order: { expiryDate: 'DESC' },
        });

        if (!verificationRecord) {
            throw new BadRequestException('Verification code not found');
        }

        const now = new Date();
        if (verificationRecord.expiryDate.getTime() < now.getTime()) {
            throw new BadRequestException('Verification code has expired');
        }

        const isCodeMatch = await compareSync(code, verificationRecord.code);

        if (!isCodeMatch) {
            throw new BadRequestException('Invalid verification code');
        }

        await this.userService.updateUserPassword(user.id, newPassword);

        return res.status(HttpStatus.OK).json({ message: 'Password successfully changed' });
    }
}
