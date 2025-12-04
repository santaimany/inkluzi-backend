import { Controller } from '@nestjs/common';
import { SppgReportsService } from './sppg-reports.service';

@Controller('sppg-reports')
export class SppgReportsController {
  constructor(private readonly sppgReportsService: SppgReportsService) {}
}
