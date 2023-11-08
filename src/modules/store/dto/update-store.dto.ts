import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateStoreDTO {
  @ApiProperty({ required: true, default: 'Nguyễn Lương Bằng' })
  @IsOptional()
  address?: string;

  @ApiProperty({ required: true, default: '0121456123' })
  @IsOptional()
  hotline?: string;
}
