import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { TimeStatisticType } from 'src/core/enum/statistic.enum';

export class GetStatisticRevenueDto {
  @ApiPropertyOptional({
    description: `Get by keyword. \n\n Available values: ${Object.values(
      TimeStatisticType,
    )}`,
    example: `${TimeStatisticType.WEEEKLY}`,
  })
  @IsEnum(TimeStatisticType)
  timeStatisticType?: TimeStatisticType;
}
