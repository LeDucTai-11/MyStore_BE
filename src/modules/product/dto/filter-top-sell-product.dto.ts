import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class FilterTopSellProductDto {
  @ApiPropertyOptional({
    description: 'Filter by store',
    example: 'storeId',
  })
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({
    description: '',
    example: new Date().toISOString().slice(0, 10),
  })
  @IsOptional()
  startDate?: Date;


  @ApiPropertyOptional({
    description: '',
    example: new Date().toISOString().slice(0, 10),
  })
  @IsOptional()
  endDate?: Date;
}
