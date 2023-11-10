import { Module } from '@nestjs/common';
import { ExportFileService } from './export-file.service';

@Module({
  providers: [ExportFileService]
})
export class ExportFileModule {}
