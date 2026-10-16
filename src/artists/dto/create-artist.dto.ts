import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateArtistDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  country?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  photo?: string;
}
