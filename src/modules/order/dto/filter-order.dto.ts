import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllOrderRequestOrderByEnum, OrderStatus, PaymentMethod } from "src/core/enum/orderRequest.enum";

export class FilterOrderDto {
    @ApiPropertyOptional({
        description: 'Search by Customer Name',
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
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllOrderRequestOrderByEnum)}`,
        example: `${GetAllOrderRequestOrderByEnum.CREATED_AT}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllOrderRequestOrderByEnum)
    order?: string;

    @ApiPropertyOptional({
        description: 'Filter by Order Status',
        example: 1,
    })
    @IsOptional()
    orderStatusId?: number;

    @ApiPropertyOptional({
        description: 'Filter by Payment Methods',
        example: PaymentMethod.CASH_ON_DELIVERY,
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;
}