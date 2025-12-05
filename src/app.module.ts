import { MlModule } from './shared/ml/ml.module';
import { MlService } from './shared/ml/ml.service';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthController } from './modules/auth/auth.controller';
import { ProfileModule } from './modules/profile/profile.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmailModule } from './shared/email/email.module';
import { FoodScanModule } from './modules/food-scan/food-scan.module';
import { SppgSchoolsModule } from './modules/schools/sppg-schools/sppg-schools.module';
import { SppgMenusModule } from './modules/menus/sppg-menus/sppg-menus.module';
import { SppgReportsModule } from './modules/reports/sppg-reports/sppg-reports.module';
import { SchoolReportsModule } from './modules/reports/school-reports/school-reports.module';
import { SchoolMenusModule } from './modules/menus/school-menus/school-menus.module';
import { NutritionModule } from './modules/menus/nutrition/nutrition.module';
import { AdminService } from './modules/admin/admin.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';


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
    ThrottlerModule.forRoot([{
      ttl: 10000,
      limit: 15,
    }])
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AdminService, {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }],
})
export class AppModule {}
