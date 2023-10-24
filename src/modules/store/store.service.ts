import { Injectable } from '@nestjs/common';
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
    return await this.prismaService.store.update({
        where: {
            id,
        },
        data: {
            ...body,
        }
    });
  }

  async findAll() {
    return await this.prismaService.store.findMany();
  }
}
