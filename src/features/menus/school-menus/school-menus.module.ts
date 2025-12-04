import { Module } from '@nestjs/common';
import { SchoolMenusController } from './school-menus.controller';
import { SchoolMenusService } from './school-menus.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolMenusController],
  providers: [SchoolMenusService],
})
export class SchoolMenusModule {}