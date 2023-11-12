import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllImportOrderByEnum } from "src/core/enum/import-orders.enum";

export class FilterImportOderDto {
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
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllImportOrderByEnum)}`,
        example: `${GetAllImportOrderByEnum.TOTAL_PRICE}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllImportOrderByEnum)
    order?: string;

    @ApiPropertyOptional({
        description: 'Filter by store',
        example: 'storeId',
    })
    @IsOptional()
    storeId?: string;
}