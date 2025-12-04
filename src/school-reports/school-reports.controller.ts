import { Controller } from '@nestjs/common';
import { SchoolReportsService } from './school-reports.service';

@Controller('school-reports')
export class SchoolReportsController {
  constructor(private readonly schoolReportsService: SchoolReportsService) {}
}
