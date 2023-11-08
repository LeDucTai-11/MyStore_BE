import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CheckInOfStockStoreDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    storeId: string;
}