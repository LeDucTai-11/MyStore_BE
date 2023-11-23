import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllVouchersOrderByEnum } from "src/core/enum/voucher.enum";

export class FilterVoucherDto {
    @ApiPropertyOptional({
        description: 'Search by Code of Voucher',
        example: 'SALE'
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
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllVouchersOrderByEnum)}`,
        example: `${GetAllVouchersOrderByEnum.QUANTITY}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllVouchersOrderByEnum)
    order?: string;

    @ApiPropertyOptional({
        description: 'Filter by valid',
        example: true,
    })
    @IsOptional()
    valid?: boolean;
}