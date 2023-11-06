import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class AddProductCartDTO {
    @ApiProperty()
    @IsNotEmpty()
    productId: string;

    @ApiProperty()
    @IsNotEmpty()
    storeId: string;

    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}