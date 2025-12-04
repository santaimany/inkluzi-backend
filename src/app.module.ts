import { MlModule } from './shared/ml/ml.module';
import { MlService } from './shared/ml/ml.service';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './features/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthController } from './features/auth/auth.controller';
import { ProfileModule } from './features/profile/profile.module';
import { AdminModule } from './features/admin/admin.module';
import { EmailModule } from './shared/email/email.module';
import { FoodScanModule } from './features/food-scan/food-scan.module';
import { SppgSchoolsModule } from './features/schools/sppg-schools/sppg-schools.module';
import { SppgMenusModule } from './features/menus/sppg-menus/sppg-menus.module';
import { SppgReportsModule } from './features/reports/sppg-reports/sppg-reports.module';
import { SchoolReportsModule } from './features/reports/school-reports/school-reports.module';
import { SchoolMenusModule } from './features/menus/school-menus/school-menus.module';
import { NutritionModule } from './features/menus/nutrition/nutrition.module';

@Module({
  imports: [
    MlModule,
    AuthModule,
    PrismaModule,
    ProfileModule,
    AdminModule,
    EmailModule,
    FoodScanModule,
    SppgSchoolsModule,
    SppgMenusModule,
    SppgReportsModule,
    SchoolReportsModule,
    SchoolMenusModule,
    NutritionModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
