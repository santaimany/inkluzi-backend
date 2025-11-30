import { MlModule } from './ml/ml.module';
import { MlService } from './ml/ml.service';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthController } from './auth/auth.controller';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { FoodScanModule } from './food-scan/food-scan.module';
import { SppgSchoolsModule } from './sppg-schools/sppg-schools.module';
import { SppgMenusModule } from './sppg-menus/sppg-menus.module';

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
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
