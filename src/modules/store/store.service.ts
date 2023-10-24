import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDTO } from './dto/create-store.dto';
import { UpdateStoreDTO } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}

  async createStore(body: CreateStoreDTO) {
    return await this.prismaService.store.create({
      data: body,
    });
  }

  async updateStore(id: string, body: UpdateStoreDTO) {
    if (await this.findByID(id)) {
      return await this.prismaService.store.update({
        where: {
          id,
        },
        data: {
          ...body,
          updatedAt: new Date(),
        },
      });
    }
  }

  async findAll() {
    return await this.prismaService.store.findMany();
  }

  async findByID(id: string) {
    const foundedStore = await this.prismaService.store.findFirst({
      where: {
        id,
      },
    });
    if (!foundedStore) {
      throw new NotFoundException(`Store with ID: ${id} not found`);
    }
    return foundedStore;
  }
}
