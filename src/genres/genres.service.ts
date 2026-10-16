import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGenreDto: CreateGenreDto) {
    try {
      const newCategory = await this.prisma.genre.create({
        data: {
          name: createGenreDto.name,
          description: createGenreDto.description,
        },
      });
      return {
        message: 'Género creado correctamente',
        data: {
          id: newCategory.id,
          name: newCategory.name,
          description: newCategory.description,
          active: newCategory.active,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll() {
    return this.prisma.genre.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
      },
    });
  }

  async findOne(id: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
      },
    });

    if (!genre) {
      throw new NotFoundException(`Género con el id ${id} no encontrado`);
    }

    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    try {
      const updatedGenre = await this.prisma.genre.update({
        where: { id },
        data: updateGenreDto,
      });

      return {
        message: 'Género actualizado correctamente',
        data: {
          id: updatedGenre.id,
          name: updatedGenre.name,
          description: updatedGenre.description,
          active: updatedGenre.active,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.genre.delete({
        where: { id },
      });

      return {
        message: 'Género eliminado correctamente',
        id,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === 'P2002')
      throw new ConflictException('El género ya existe en la base de datos');

    if (error.code === 'P2025') {
      throw new NotFoundException('Género no encontrado');
    }
    // this.logger.error(error);
    throw new InternalServerErrorException(
      'Error inesperado, revisar logs del servidor',
    );
  }
}
