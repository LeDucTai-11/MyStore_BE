import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderRequesType } from 'src/core/enum/orderRequest.enum';
import { RequestStatus } from 'src/core/enum/requestStatus.enum';

export class UpdateOrderRequestStatusDto {
  @IsEnum(RequestStatus)
  @ApiProperty({
    default: RequestStatus.Approved,
    enum: RequestStatus,
  })
  @IsNotEmpty({
    message: 'requestStatusId:ShouldNotBeEmpty',
  })
  requestStatusId: RequestStatus;
}

export class CreateModifyOrderRequestDto {
  @ApiProperty({ default: '' })
  @IsNotEmpty({
    message: 'orderId:ShouldNotBeEmpty',
  })
  orderId: string;

  @IsEnum(OrderRequesType)
  @ApiProperty({ default: OrderRequesType.CANCEL, enum: OrderRequesType })
  @IsNotEmpty({
    message: 'requestType:ShouldNotBeEmpty',
  })
  requestType: OrderRequesType;
}
