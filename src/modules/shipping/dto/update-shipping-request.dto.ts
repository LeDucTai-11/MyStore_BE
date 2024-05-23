import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from 'src/core/enum/requestStatus.enum';

export class UpdateShippingrRequestStatusDto {
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
