import { Controller, Get, Param, Query } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { ApiTags } from '@nestjs/swagger';
import { FilterVoucherDto } from './dto/filter-voucher.dto';
@ApiTags('voucher')
@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  async findAll(@Query() queryData: FilterVoucherDto) {
    return this.voucherService.findAll(queryData);
  }

  @Get('/:id')
  async findByID(@Param('id') id: string) {
    return this.voucherService.findByID(id);
  }
}
