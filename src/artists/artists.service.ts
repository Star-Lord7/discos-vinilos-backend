import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createArtistDto: CreateArtistDto) {
    try {
      const newArtist = await this.prisma.artist.create({
        data: {
          name: createArtistDto.name,
          country: createArtistDto.country,
          photo: createArtistDto.photo,
        },
      });
      return {
        message: 'Artista creado correctamente',
        data: {
          id: newArtist.id,
          name: newArtist.name,
          country: newArtist.country,
          photo: newArtist.photo,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll() {
    return this.prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        photo: true,
        active: true,
      },
    });
  }

  async findOne(id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        country: true,
        photo: true,
        active: true,
      },
    });
    if (!artist) {
      throw new NotFoundException(`Artista con el id ${id} no encontrado`);
    }
    return artist;
  }

  async findProducts(id: string) {
    await this.findOne(id);

    return this.prisma.product.findMany({
      where: {
        artistId: id,
      },
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
      },
    });
  }

  async update(id: string, updateArtistDto: UpdateArtistDto) {
    try {
      const updatedArtist = await this.prisma.artist.update({
        where: { id },
        data: updateArtistDto,
      });
      return {
        message: 'Artista actualizado correctamente',
        data: {
          id: updatedArtist.id,
          name: updatedArtist.name,
          country: updatedArtist.country,
          photo: updatedArtist.photo,
          active: updatedArtist.active,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.artist.delete({
        where: { id },
      });

      return {
        message: 'Artista eliminado correctamente',
        id,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === 'P2002')
      throw new ConflictException('El artista ya existe en la base de datos');

    if (error.code === 'P2025') {
      throw new NotFoundException('Artista no encontrado');
    }
    // this.logger.error(error);
    throw new InternalServerErrorException(
      'Error inesperado, revisar logs del servidor',
    );
  }
}
