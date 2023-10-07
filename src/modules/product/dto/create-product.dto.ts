import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateProducDTO {
    @ApiProperty({required: true,default: 'Nước hương dâu thạch dừa MOGU chai 320ml'})
    @IsNotEmpty()
    name: string;

    @ApiProperty({default: 'Đây là sản phẩm của MALT Store'})
    @IsOptional()
    description?: string;

    @ApiProperty({required: true,default: 100})
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty({required: true,default: 15000})
    @IsNotEmpty()
    @IsNumber()
    price: number;

    @ApiProperty({required: true})
    @IsNotEmpty()
    categoryId: string;
}