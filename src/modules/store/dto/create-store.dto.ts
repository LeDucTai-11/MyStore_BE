import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateStoreDTO {
  @ApiProperty({ required: true, default: 'Đồ uống - Giải khát' })
  @IsNotEmpty()
  address: string;
}
