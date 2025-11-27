import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthController } from './auth/auth.controller';


@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
