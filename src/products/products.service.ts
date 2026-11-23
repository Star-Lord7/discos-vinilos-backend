import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/database/prisma.service';
import { GenresService } from 'src/genres/genres.service';
import { ArtistsService } from 'src/artists/artists.service';
import { CategoriesService } from 'src/categories/categories.service';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ProductsService {
  private readonly supabase: SupabaseClient;
  private readonly bucket = 'portadas';

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly artistsService: ArtistsService,
    private readonly genresService: GenresService,
  ) {
    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
      throw new Error('Falta SUPABASE_URL o SUPABASE_SECRET_KEY en el backend');
    }

    this.supabase = createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async create(createProductDto: CreateProductDto, image: Express.Multer.File) {
    let uploadedPath: string | undefined;
    try {
      // Verificar que las relaciones existan
      await this.categoriesService.findOne(createProductDto.categoryId);
      await this.artistsService.findOne(createProductDto.artistId);
      await this.genresService.findOne(createProductDto.genreId);

      // Verificar que el género pertenezca a la categoría
      const genre = await this.prisma.genre.findUnique({
        where: {
          id: createProductDto.genreId,
        },
        select: {
          categoryId: true,
        },
      });

      if (genre?.categoryId !== createProductDto.categoryId) {
        throw new BadRequestException(
          'El género seleccionado no pertenece a la categoría indicada',
        );
      }

      // Generar la URL de la imagen
      const cover = await this.uploadCover(image);
      uploadedPath = cover.path;
      const imageUrl = cover.url;

      // Crear producto e imagen en una sola operación
      const newProduct = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          album: createProductDto.album,
          description: createProductDto.description,
          price: createProductDto.price,
          stock: createProductDto.stock,
          year: createProductDto.year,
          format: createProductDto.format,
          recordLabel: createProductDto.recordLabel,
          catalogCode: createProductDto.catalogCode,
          categoryId: createProductDto.categoryId,
          artistId: createProductDto.artistId,
          genreId: createProductDto.genreId,

          images: {
            create: {
              url: imageUrl,
              isPrimary: true,
              order: 0,
            },
          },
        },

        include: {
          images: true,
        },
      });

      uploadedPath = undefined;

      return {
        message: 'Producto creado correctamente',
        data: {
          id: newProduct.id,
          name: newProduct.name,
          album: newProduct.album,
          description: newProduct.description,
          price: newProduct.price,
          stock: newProduct.stock,
          year: newProduct.year,
          format: newProduct.format,
          recordLabel: newProduct.recordLabel,
          catalogCode: newProduct.catalogCode,
          categoryId: newProduct.categoryId,
          artistId: newProduct.artistId,
          genreId: newProduct.genreId,
          images: newProduct.images,
        },
      };
    } catch (error) {
      if (uploadedPath) {
        try {
          const { error: cleanupError } = await this.supabase.storage
            .from(this.bucket)
            .remove([uploadedPath]);

          if (cleanupError) {
            console.error(
              'No se pudo limpiar la portada:',
              uploadedPath,
              cleanupError.message,
            );
          }
        } catch (cleanupError) {
          console.error(
            'Falló la limpieza de la portada:',
            uploadedPath,
            cleanupError,
          );
        }
      }

      this.handleDBExceptions(error);
    }
  }

  private async uploadCover(image: Express.Multer.File) {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const extension = extensions[image.mimetype];

    if (!extension || !image.buffer?.length) {
      throw new BadRequestException('Envía una portada JPG, PNG o WebP válida');
    }

    const path = `products/${randomUUID()}.${extension}`;
    const bucket = this.supabase.storage.from(this.bucket);

    const { error } = await bucket.upload(path, image.buffer, {
      contentType: image.mimetype,
      upsert: false,
    });

    if (error) {
      console.error('Error al subir la portada:', error.message);
      throw new InternalServerErrorException('No se pudo subir la portada');
    }

    const { data } = bucket.getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  async findAll() {
    return await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        album: true,
        description: true,
        price: true,
        stock: true,
        year: true,
        format: true,
        recordLabel: true,
        catalogCode: true,
        active: true,
        images: {
          select: {
            id: true,
            url: true,
            isPrimary: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        artist: {
          select: {
            id: true,
            name: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        album: true,
        description: true,
        price: true,
        stock: true,
        year: true,
        format: true,
        recordLabel: true,
        catalogCode: true,
        active: true,
        images: {
          select: {
            id: true,
            url: true,
            isPrimary: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        artist: {
          select: {
            name: true,
          },
        },
        genre: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con el id ${id} no encontrado`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });

      return {
        message: 'Producto actualizado correctamente',
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          album: updatedProduct.album,
          description: updatedProduct.description,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          year: updatedProduct.year,
          format: updatedProduct.format,
          recordLabel: updatedProduct.recordLabel,
          catalogCode: updatedProduct.catalogCode,
          active: updatedProduct.active,
          categoryId: updatedProduct.categoryId,
          artistId: updatedProduct.artistId,
          genreId: updatedProduct.genreId,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({
        where: { id },
      });

      return {
        message: 'Producto eliminado correctamente',
        id,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error.code === 'P2002') {
      throw new ConflictException('El producto ya existe en la base de datos');
    }

    if (error.code === 'P2025') {
      throw new NotFoundException('Producto no encontrado');
    }

    console.error(error);

    throw new InternalServerErrorException(
      'Error inesperado, revisar logs del servidor',
    );
  }
}
