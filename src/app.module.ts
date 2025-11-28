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
  imports: [AuthModule, PrismaModule, ProfileModule, AdminModule, EmailModule],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
