import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllStoreOrderByEnum } from "src/core/enum/stores.enum";

export class FilterStoreDto {
    @ApiPropertyOptional({
        description: 'Search by Address of Stores',
        example: 'Nguyễn Văn Linh'
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
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllStoreOrderByEnum)}`,
        example: `${GetAllStoreOrderByEnum.ADDRESS}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllStoreOrderByEnum)
    order?: string;
}