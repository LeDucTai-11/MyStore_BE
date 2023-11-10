import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ExportType } from "src/core/enum/exportType.enum";

export class ExportProductStoreDTO {
    @ApiProperty({required: true, default: ExportType.CSV})
    @IsEnum(ExportType)
    exportType: ExportType
}