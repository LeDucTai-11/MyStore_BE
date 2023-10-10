import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class UpdateProductDTO {
    @ApiProperty({required: false})
    @IsOptional()
    name?: string;

    @ApiProperty({required: false})
    @IsOptional()
    description?: string;

    @ApiProperty({required: false})
    @IsOptional()
    @IsNumber()
    price?: number;
}