import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const newCategory = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
        },
      });
      return {
        message: 'Categoría creada correctamente',
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
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Categoria con el id ${id} no encontrada`);
    }

    return category;
  }

  async findProducts(id: string) {
    await this.findOne(id);

    return this.prisma.product.findMany({
      where: {
        categoryId: id,
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

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      const updatedCategory = await this.prisma.category.update({
        where: {
          id: id,
        },
        data: updateCategoryDto,
      });

      return {
        message: 'Categoría actualizada correctamente',
        data: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          description: updatedCategory.description,
          active: updatedCategory.active,
        },
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.category.delete({
        where: {
          id: id,
        },
      });

      return {
        message: 'Categoría eliminada correctamente',
        id,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === 'P2002')
      throw new ConflictException('La categoria ya existe en la base de datos');

    if (error.code === 'P2025') {
      throw new NotFoundException('Categoría no encontrada');
    }
    // this.logger.error(error);
    throw new InternalServerErrorException(
      'Error inesperado, revisar logs del servidor',
    );
  }
}
