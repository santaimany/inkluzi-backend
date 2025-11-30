import { Controller } from '@nestjs/common';
import { SppgSchoolsService } from './sppg-schools.service';

@Controller('sppg-schools')
export class SppgSchoolsController {
  constructor(private readonly sppgSchoolsService: SppgSchoolsService) {}
}
