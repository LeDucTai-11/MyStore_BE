import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateStoreDTO {
  @ApiProperty({ required: true, default: 'Đồ uống - Giải khát' })
  @IsOptional()
  address?: string;
}
