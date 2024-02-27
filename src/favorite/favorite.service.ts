import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Favorite } from "@src/favorite/favorite.model";
import { Repository } from "typeorm";
import { MovieService } from "@src/movie/movie.service";
import { UserService } from "@src/user/user.service";
import { User } from "@src/user/user.model";

@Injectable()
export class FavoriteService {
    constructor(
        @InjectRepository(Favorite) private favoriteRepository: Repository<Favorite>,
        private readonly movieService: MovieService,
        private readonly userService: UserService
    ) {}

    async addFavorite(movieId: string, userId: string): Promise<void> {
        const user: User = await this.userService.getUserById(userId);

        if (!user) {
            throw new NotFoundException("User is not found.")
        }

        const isFavorite = await this.isMovieInFavorites(movieId, user);

        if (isFavorite) {
            throw new ConflictException("Movie is already in favorites");
        }

        const favorite = this.favoriteRepository.create({ user, movieId });

        await this.favoriteRepository.save(favorite);
    }

    async getMyFavorite(userId: string) {
        const user: User = await this.userService.getUserById(userId);

        if (!user) {
            throw new NotFoundException("User is not found.")
        }

        const myFavorite = await this.favoriteRepository.find({ where: { user } });

        if (!myFavorite) {
            throw new NotFoundException("User's favorites not found");
        }

        try {
            const promises = myFavorite.map((item) => this.movieService.getMovieFromId(item.movieId));
            const result = await Promise.all(promises);

            return result.map((movie) => ({
                name: movie.name,
                id: movie.id,
                posterUrl: movie.poster.url
            }));
        } catch (error) {
            throw new InternalServerErrorException("Failed to fetch movie information");
        }
    }

    async deleteFromFavorite(movieId: string, userId: string): Promise<void> {
        const user: User = await this.userService.getUserById(userId);

        if (!user) {
            throw new NotFoundException("User is not found.")
        }

        const isFavorite = await this.isMovieInFavorites(movieId, user);

        if (!isFavorite) {
            throw new ConflictException("Movie has not found in favorites");
        }

        await this.favoriteRepository.delete({ movieId, user });
    }

    private async isMovieInFavorites(movieId: string, user: User): Promise<boolean> {
        const favorite = await this.favoriteRepository.findOne({ where: { movieId, user } });
        return !!favorite;
    }
}