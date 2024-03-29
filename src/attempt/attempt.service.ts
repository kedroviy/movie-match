import { ForbiddenException, Injectable } from '@nestjs/common';
import { Attempt } from '@src/attempt/attempt.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttemptTypes } from '@src/attempt/attempt.interfaces';

@Injectable()
export class AttemptService {
    constructor(@InjectRepository(Attempt) private readonly attemptRepository: Repository<Attempt>) {}

    async check(input: AttemptTypes): Promise<void> {
        const attempt = await this.checkAttempts(input);

        if (attempt && attempt.count >= 3 && attempt.exp > new Date()) {
            const timeDifferenceInSeconds = Math.floor((attempt.exp.getTime() - new Date().getTime()) / 1000);
            throw new ForbiddenException(
                `Exceeded the maximum attempts. Please try again in ${timeDifferenceInSeconds}s.`,
            );
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
        const { userId, userAgent, where } = input;

        if (attempt) {
            attempt.userId = userId;
            attempt.userAgent = userAgent;
            attempt.where = where;
            attempt.exp = expirationDate;
            attempt.count += 1;

            return this.attemptRepository.save(attempt);
        } else {
            attempt = new Attempt();
            attempt.userId = userId;
            attempt.userAgent = userAgent;
            attempt.where = where;
            attempt.exp = expirationDate;

            return this.attemptRepository.save(attempt);
        }
    }

    private async checkAttempts(input: AttemptTypes): Promise<Attempt> {
        const { userId, userAgent, where } = input;
        return this.attemptRepository.findOne({
            where: { userId, userAgent, where },
        });
    }
}
