// src/sppg-menus/sppg-menus.module.ts
import { Module } from '@nestjs/common';
import { SppgMenusService } from './sppg-menus.service';
import { SppgMenusController } from './sppg-menus.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MlModule } from '../ml/ml.module';

@Module({
  imports: [PrismaModule, MlModule],
  controllers: [SppgMenusController],
  providers: [SppgMenusService],
  exports: [SppgMenusService],
})
export class SppgMenusModule {}