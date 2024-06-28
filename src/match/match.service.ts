import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from '@src/match/match.model';
import { Repository } from 'typeorm';

@Injectable()
export class MatchService {
    constructor(@InjectRepository(Match) private matchRepository: Repository<Match>) {}

    async likeMovie(userId: number, roomId: string, movieId: string): Promise<Match> {
        const match = await this.matchRepository.findOne({ where: { userId, roomId } });
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        match.movieId = movieId;
        match.vote = true;
        await this.matchRepository.save(match);

        const allMatches = await this.matchRepository.find({ where: { roomId } });
        const allLikedSameMovie = allMatches.every((m) => m.vote === true && m.movieId === movieId);

        if (allLikedSameMovie) {
        }

        return match;
    }
}
