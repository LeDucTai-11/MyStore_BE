import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Min, ValidateNested } from "class-validator";

export class CreateImportOrderDTO {
    @ApiProperty()
    @IsNotEmpty()
    @ValidateNested({each: true})
    @Type(() => ImportProductStoreDTO)
    importOrderDetails: ImportProductStoreDTO[];
}

export class ImportProductStoreDTO {
    @IsString()
    @IsNotEmpty()
    productStoreId: string;

    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    amount: number;
}