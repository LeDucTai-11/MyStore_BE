import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { VoucherType } from 'src/core/enum/voucher.enum';

export class CreateVoucherDTO {
  @ApiProperty({ required: true, default: 'SALE01' })
  @IsNotEmpty()
  code: string;

  @ApiProperty({ required: true, default: 'Đây là voucher của MALT STORE' })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: true, default: 200 })
  @IsNotEmpty()
  minValueOrder: number;

  @ApiProperty({ required: true, default: VoucherType.FIXED })
  @IsEnum(VoucherType)
  type: VoucherType;

  @ApiProperty({ required: true, default: 20 })
  @IsNotEmpty()
  discountValue: number;

  @ApiProperty({ required: true, default: 10 })
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ required: true, default: '2023-11-01' })
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ required: true, default: '2023-12-30' })
  @IsNotEmpty()
  endDate: Date;
}
