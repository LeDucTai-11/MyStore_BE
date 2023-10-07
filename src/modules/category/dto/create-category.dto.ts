import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateCategoryDTO {
    @ApiProperty({required: true, default: 'Đồ uống - Giải khát'})
    @IsNotEmpty()
    name: string;

    @ApiProperty({default: 'Bao gồm những sản phẩm chuyên về đồ uống'})
    @IsOptional()
    description?: string;
}