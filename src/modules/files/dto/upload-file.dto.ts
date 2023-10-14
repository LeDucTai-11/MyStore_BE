import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UploadFileEnum } from 'src/core/enum/uploadFileEnum';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiProperty({
    description: `Upload by keyword. \n\n Available values: ${Object.values(
        UploadFileEnum,
    )}`,
    example: `${UploadFileEnum.PRODUCT}:id`,
  })
  @IsOptional()
  @IsString()
  object?: string;
}
