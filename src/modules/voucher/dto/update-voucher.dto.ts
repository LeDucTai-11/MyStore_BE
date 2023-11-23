import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { VoucherType } from 'src/core/enum/voucher.enum';

export class UpdateVoucherDTO {
  @ApiProperty({ required: true, default: 'SALE01' })
  @IsOptional()
  code: string;

  @ApiProperty({ required: true, default: 'Đây là voucher của MALT STORE' })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: true, default: 200 })
  @IsOptional()
  minValueOrder: number;

  @ApiProperty({ required: true, default: VoucherType.FIXED })
  @IsOptional()
  @IsEnum(VoucherType)
  type: VoucherType;

  @ApiProperty({ required: true, default: 20 })
  @IsOptional()
  discountValue: number;

  @ApiProperty({ required: true, default: 10 })
  @IsOptional()
  quantity: number;

  @ApiProperty({ required: true, default: '2023-11-01' })
  @IsOptional()
  startDate: Date;

  @ApiProperty({ required: true, default: '2023-12-30' })
  @IsOptional()
  endDate: Date;
}
