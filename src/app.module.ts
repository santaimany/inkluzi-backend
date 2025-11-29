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

@Module({
  imports: [
    MlModule,
    AuthModule,
    PrismaModule,
    ProfileModule,
    AdminModule,
    EmailModule,
  ],
  controllers: [AppController, AuthController],
  providers: [MlService, AppService],
})
export class AppModule {}
