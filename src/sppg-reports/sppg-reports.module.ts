import { Module } from '@nestjs/common';
import { SppgReportsController } from './sppg-reports.controller';
import { SppgReportsService } from './sppg-reports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SppgReportsController],
  providers: [SppgReportsService],
})
export class SppgReportsModule {}