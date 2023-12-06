import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllBillOrderByEnum } from "src/core/enum/bill.enum";

export class FilterBillDto {
    @ApiPropertyOptional({
        description: 'Search by Name of Customer',
        example: 'David'
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
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllBillOrderByEnum)}`,
        example: `${GetAllBillOrderByEnum.CREATED_AT}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllBillOrderByEnum)
    order?: string;

    @ApiPropertyOptional({
        description: 'Filter by Created by',
        example: '',
    })
    @IsOptional()
    createdBy?: string;
}