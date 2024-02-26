import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Favorite } from "@src/favorite/favorite.model";

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorite])
  ],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}
