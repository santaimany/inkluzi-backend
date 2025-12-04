import { Controller } from '@nestjs/common';
import { SchoolMenusService } from './school-menus.service';

@Controller('school-menus')
export class SchoolMenusController {
  constructor(private readonly schoolMenusService: SchoolMenusService) {}
}
