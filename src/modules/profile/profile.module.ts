import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';

@Module({
    imports: [
    PrismaModule,
    CloudinaryModule, 
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
