import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllCategoryOrderByEnum } from "src/core/enum/category.enum";

export class FilterCategoryDto {
    @ApiPropertyOptional({
        description: 'Search by Name of Category',
        example: 'Đồ uống'
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
    skip?: number = 0;

    @ApiPropertyOptional({
        description: 'Number of records to take and then return the remainder',
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    take?: number = 10;

    @ApiPropertyOptional({
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllCategoryOrderByEnum)}`,
        example: `${GetAllCategoryOrderByEnum.NAME}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllCategoryOrderByEnum)
    order?: string;
}