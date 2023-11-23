import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVoucherDTO } from './dto/create-voucher.dto';
import { Pagination, getOrderBy } from 'src/core/utils';
import { UpdateVoucherDTO } from './dto/update-voucher.dto';

@Injectable()
export class VoucherService {
  constructor(private readonly prismaService: PrismaService) {}

  async createVoucher(body: CreateVoucherDTO) {
    if(new Date(body.startDate) > new Date(body.endDate)) {
      throw new BadRequestException('The startDate greater than endDate');
    }
    const foundVoucher = await this.findByCode(body.code);
    if (foundVoucher) {
      throw new BadRequestException('The Voucher Code has already existed');
    }
    return this.prismaService.voucher.create({
      data: {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      },
    });
  }

  async findByCode(code: string) {
    return this.prismaService.voucher.findFirst({
      where: {
        code,
      },
    });
  }

  async findAll(queryData: any) {
    const { search, take, skip, order, valid } = queryData;
    const query: any = {
      where: {
        code: {
          contains: search ?? '',
        },
        ...(valid !== undefined
          ? valid == 'true'
            ? {
                startDate: {
                  lte: new Date(),
                },
                endDate: {
                  gte: new Date(),
                },
              }
            : {
              OR: [
                {
                  startDate: {
                    gt: new Date(),
                  },
                },
                {
                  endDate: {
                    lt: new Date(),
                  },
                }
              ]
            }
          : {}),
        deletedAt: null,
      },
      take,
      skip,
      orderBy: order ? getOrderBy(order) : undefined,
    };
    const [total, vouchers] = await Promise.all([
      this.prismaService.voucher.count({
        where: query.where,
      }),
      this.prismaService.voucher.findMany(query),
    ]);
    return Pagination.of(take, skip, total, vouchers);
  }

  async findByID(id: string) {
    const foundVoucher = await this.prismaService.voucher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!foundVoucher) {
      throw new NotFoundException('The voucher not found');
    }
    return foundVoucher;
  }

  async updateVoucher(id: string, body: UpdateVoucherDTO) {
    await this.findByID(id);
    if (body.code) {
      const voucher = await this.findByCode(body.code);
      if (voucher && voucher.id !== id) {
        throw new BadRequestException('The voucher code has already exist !');
      }
    }
    return this.prismaService.voucher.update({
      where: {
        id: id,
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });
  }

  async deleteVoucher(id: string) {
    const foundVoucher = await this.findByID(id);
    return this.prismaService.voucher.update({
      where: {
        id: foundVoucher.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
