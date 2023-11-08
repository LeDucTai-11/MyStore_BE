import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStoreDTO {
  @ApiProperty({ required: true, default: 'Nguyễn Lương Bằng' })
  @IsNotEmpty()
  address: string;

  @ApiProperty({ required: true, default: '0121456123' })
  @IsOptional()
  hotline: string;
}
