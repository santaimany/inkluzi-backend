import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
    imports: [
    PrismaModule,
    CloudinaryModule, 
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
