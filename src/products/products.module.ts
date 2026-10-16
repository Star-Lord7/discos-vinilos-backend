import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesModule } from 'src/categories/categories.module';
import { ArtistsModule } from 'src/artists/artists.module';
import { GenresModule } from 'src/genres/genres.module';

@Module({
  imports: [CategoriesModule, ArtistsModule, GenresModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
