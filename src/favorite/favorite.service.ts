import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Favorite } from "@src/favorite/favorite.model";
import { Repository } from "typeorm";

@Injectable()
export class FavoriteService {
    constructor(@InjectRepository(Favorite) private favoriteRepository: Repository<Favorite>) {}

    async addFavorite(movieId: string, userId: string): Promise<void> {
        const isFavorite = await this.isMovieInFavorites(movieId, userId);

        if (isFavorite) {
            throw new ConflictException("Movie is already in favorites");
        }

        const favorite = this.favoriteRepository.create({ userId, movieId });

        await this.favoriteRepository.save(favorite);
    }

    async getMyFavorite(userId: string): Promise<Favorite[]> {
        const myFavorite = await this.favoriteRepository.find({ where: { userId } });

        if (!myFavorite || myFavorite.length === 0) {
            throw new NotFoundException("User's favorites not found");
        }

        return myFavorite;
    }

    async deleteFromFavorite(movieId: string, userId: string): Promise<void> {
        const isFavorite = await this.isMovieInFavorites(movieId, userId);

        if (isFavorite) {
            throw new ConflictException("Movie has not found in favorites");
        }

        await this.favoriteRepository.delete({ movieId, userId });
    }

    private async isMovieInFavorites(movieId: string, userId: string): Promise<boolean> {
        const favorite = await this.favoriteRepository.findOne({ where: { movieId, userId } });
        return !!favorite;
    }
}
