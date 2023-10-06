import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDTO, UpdateCategoryDTO } from './dto';
import { Pagination } from 'src/core/utils';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async findAll(name?: string,limit?: number, offset?: number) {
    const query: any = {
      where: {
        name: {
          contains: name ?? '',
        },
        deletedAt: null,
      },
      take: limit ?? undefined,
      skip: offset ?? undefined,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    };
    const [total, categories] = await Promise.all([
      this.prismaService.category.count({
        where: query.where,
      }),
      this.prismaService.category.findMany(query),
    ]);
    const results = categories.map(async(c) => {
        const stock = await this.prismaService.product.count({
            where: {
                categoryId: c.id
            }
        }) ?? 0;
        return {...c,stock};
    });
    return Pagination.of(limit, offset, total, await Promise.all(results));
  }

  async findByID(id: string) {
    const category = await this.prismaService.category.findFirst({
      where: {
        id: id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            amount: true,
            price: true,
            createdAt: true,
          },
        },
        createdAt: true,
      },
    });
    if (!category) {
      throw new NotFoundException(`Category not found with ID : ${id}`);
    }
    return category;
  }

  async findByName(name: string) {
    const category = await this.prismaService.category.findFirst({
      where: {
        name: name,
        deletedAt: null,
      }
    });
    return category;
  }

  async createCategory(createCategoryDTO: CreateCategoryDTO) {
    const category = await this.findByName(createCategoryDTO.name);
    if (category) {
      throw new BadRequestException('The name Category has already exist !');
    }
    return await this.prismaService.category.create({
      data: {
        ...createCategoryDTO,
      },
      select: {
        id: true,
        name: true,
        description: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            amount: true,
            price: true,
            createdAt: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async updateCategory(id: string, updateCategoryDTO: UpdateCategoryDTO) {
    const foundCategory = await this.findByID(id);
    if (updateCategoryDTO.name) {
      const category = await this.findByName(updateCategoryDTO.name);
      if (category && category.id !== foundCategory.id) {
        throw new BadRequestException('The name Category has already exist !');
      }
    }
    return await this.prismaService.category.update({
      where: {
        id: foundCategory.id,
      },
      data: {
        ...updateCategoryDTO,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            amount: true,
            price: true,
            createdAt: true,
          },
        },
        createdAt: true,
      },
    });
  }
}
