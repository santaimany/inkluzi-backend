import { Controller } from '@nestjs/common';
import { SppgMenusService } from './sppg-menus.service';

@Controller('sppg-menus')
export class SppgMenusController {
  constructor(private readonly sppgMenusService: SppgMenusService) {}
}
