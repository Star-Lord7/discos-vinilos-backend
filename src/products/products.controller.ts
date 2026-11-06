import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  HttpStatus,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { mkdirSync } from 'fs';
import { join } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = join(process.cwd(), 'uploads', 'products');

          mkdirSync(uploadPath, { recursive: true });

          callback(null, uploadPath);
        },

        filename: (req, file, callback) => {
          const extension = extname(file.originalname).toLowerCase();
          const filename = `${randomUUID()}${extension}`;

          callback(null, filename);
        },
      }),

      fileFilter: (req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const extension = extname(file.originalname).toLowerCase();

        if (
          !allowedTypes.includes(file.mimetype) ||
          !allowedExtensions.includes(extension)
        ) {
          return callback(
            new UnsupportedMediaTypeException(
              'Solo se permiten imágenes JPG, PNG y WEBP',
            ),
            false,
          );
        }

        callback(null, true);
      },

      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(
    @Body() createProductDto: CreateProductDto,

    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    image: Express.Multer.File,
  ) {
    return this.productsService.create(createProductDto, image);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
