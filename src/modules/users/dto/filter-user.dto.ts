import { ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { IsOrderQueryParam } from "src/core/decorators/order.decorators";
import { GetAllUsersOrderByEnum } from "src/core/enum/users.enum";

export class FilterUserDto {
    @ApiPropertyOptional({
        description: 'Search by FirstName, LastName, Email',
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
        description: `Order by keyword. \n\n Available values: ${Object.values(GetAllUsersOrderByEnum)}`,
        example: `${GetAllUsersOrderByEnum.FIRSTNAME}:${Prisma.SortOrder.asc}`
    })
    @IsOptional()
    @IsString()
    @IsOrderQueryParam('order', GetAllUsersOrderByEnum)
    order?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: true,
    })
    @IsOptional()
    active?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by roles',
        example: [1, 2, 3, 4],
    })
    @IsOptional()
    roles?: number[];

    @ApiPropertyOptional({
        description: 'Filter by store',
        example: 'storeId',
    })
    @IsOptional()
    storeId?: string;
}