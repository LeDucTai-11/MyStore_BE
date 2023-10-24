import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateStoreDTO {
  @ApiProperty({ required: true, default: 'Nguyễn Lương Bằng' })
  @IsNotEmpty()
  address: string;
}
