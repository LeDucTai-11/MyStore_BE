import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateCategoryDTO {
    @ApiProperty({required: true, default: 'Đồ uống - Giải khát'})
    @IsNotEmpty()
    name: string;

    @ApiProperty({required: false, default: 'Bao gồm những sản phẩm chuyên về đồ uống'})
    description?: string;
}