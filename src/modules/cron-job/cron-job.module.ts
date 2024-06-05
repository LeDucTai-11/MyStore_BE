import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';

@Module({
  providers: [CronJobService]
})
export class CronJobModule {}
