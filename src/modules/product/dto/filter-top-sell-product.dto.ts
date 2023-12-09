import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class FilterTopSellProductDto {
  @ApiPropertyOptional({
    description: 'Filter by store',
    example: 'storeId',
  })
  @IsOptional()
  storeId?: string;
}
