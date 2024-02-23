import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Attempt } from "@src/attempt/attempt.model";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttemptTypes } from "@src/attempt/interfaces";

@Injectable()
export class AttemptService {
    constructor(@InjectRepository(Attempt) private readonly attemptRepository: Repository<Attempt>) {}

    async check(input: AttemptTypes): Promise<void> {
        const attempt = await this.checkAttempts(input);

        if (attempt && attempt.count >= 3 && attempt.exp > new Date()) {
            const timeDifferenceInSeconds = Math.floor((attempt.exp.getTime() - new Date().getTime()) / 1000);
            throw new UnauthorizedException(`Exceeded the maximum attempts. Please try again in ${timeDifferenceInSeconds}s.`);
        }

        await this.save(input);
    }

    async remove(input: AttemptTypes): Promise<any> {
        const { userId, userAgent, where } = input;
        return this.attemptRepository.delete({ userId, userAgent, where });
    }

    private async save(input: AttemptTypes): Promise<Attempt> {
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 1);

        let attempt = await this.checkAttempts(input);

        if (attempt) {
            attempt.userId = input.userId;
            attempt.userAgent = input.userAgent;
            attempt.where = input.where;
            attempt.exp = expirationDate;
            attempt.count += 1;

            return this.attemptRepository.save(attempt);
        } else {
            attempt = new Attempt();
            attempt.userId = input.userId;
            attempt.userAgent = input.userAgent;
            attempt.where = input.where;
            attempt.exp = expirationDate;

            return this.attemptRepository.save(attempt);
        }
    }

    private async checkAttempts(input: AttemptTypes): Promise<Attempt> {
        return this.attemptRepository.findOne({
            where: {
                userId: input.userId,
                userAgent: input.userAgent,
                where: input.where
            }
        });
    }
}