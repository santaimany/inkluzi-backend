import { Module } from '@nestjs/common';
import { FoodScanService } from './food-scan.service';
import { FoodScanController } from './food-scan.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';  
import { MlModule } from 'src/shared/ml/ml.module';  

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,  
    MlModule,          
  ],
  controllers: [FoodScanController],
  providers: [FoodScanService],
})
export class FoodScanModule {}