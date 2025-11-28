import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { EmailModule } from 'src/email/email.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [EmailModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
