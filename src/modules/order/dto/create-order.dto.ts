import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from 'src/core/enum/orderRequest.enum';


export class ContactDetailDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}

export class ConfirmOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderProductStoreDto)
  productStores: OrderProductStoreDto[];

  @ApiProperty()
  @IsOptional()
  @IsInt()
  shippingFee?: number;

  @ApiProperty()
  @IsOptional()
  voucherId?: string;

  @ApiProperty({})
  @ValidateNested({ each: true })
  @Type(() => ContactDetailDto)
  contact: ContactDetailDto;

  @ApiProperty({default: PaymentMethod.CASH_ON_DELIVERY})
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class OrderProductStoreDto {
  @IsNotEmpty()
  @IsString()
  productStoreId: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
