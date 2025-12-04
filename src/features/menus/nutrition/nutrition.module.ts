import { Module } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { MlModule } from '../../../shared/ml/ml.module';

@Module({
  imports: [PrismaModule, MlModule],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService],
})
export class NutritionModule {}