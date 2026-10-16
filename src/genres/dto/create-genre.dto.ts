import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  description?: string;
}
