import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllProductOrderByEnum } from "src/core/enum/products.enum";

export class FilterProductDto {
    @ApiPropertyOptional({
        description: 'Search by Name of Products',
        example: 'Nước'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Number of records to skip and then return the remainder',
        example: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number;

    @ApiPropertyOptional({
        description: 'Number of records to take and then return the remainder',
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    take?: number;

    @ApiPropertyOptional({
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllProductOrderByEnum)}`,
        example: `${GetAllProductOrderByEnum.NAME}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllProductOrderByEnum)
    order?: string;

    @ApiPropertyOptional({
        description: 'Filter by categories',
        example: ['a'],
    })
    @IsOptional()
    categories?: string[];
}