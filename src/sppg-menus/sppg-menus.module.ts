import { Module } from '@nestjs/common';
import { SppgMenusService } from './sppg-menus.service';
import { SppgMenusController } from './sppg-menus.controller';

@Module({
  controllers: [SppgMenusController],
  providers: [SppgMenusService],
})
export class SppgMenusModule {}
