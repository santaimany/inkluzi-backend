import { Module } from '@nestjs/common';
import { SchoolReportsController } from './school-reports.controller';
import { SchoolReportsService } from './school-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [SchoolReportsController],
  providers: [SchoolReportsService],
})
export class SchoolReportsModule {}