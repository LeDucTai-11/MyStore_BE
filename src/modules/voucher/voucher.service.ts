import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVoucherDTO } from './dto/create-voucher.dto';

@Injectable()
export class VoucherService {
  constructor(private readonly prismaService: PrismaService) {}

  async createVoucher(body: CreateVoucherDTO) {
    return this.prismaService.voucher.create({
      data: {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate)
      },
    });
  }
}
