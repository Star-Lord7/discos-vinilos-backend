import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ProductFormat } from 'src/generated/prisma/enums';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  album: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  stock: number;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(new Date().getFullYear())
  year: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ProductFormat)
  format: ProductFormat;

  @IsString()
  @IsOptional()
  @MinLength(3)
  recordLabel: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  catalogCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  artistId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  genreId: string;
}
