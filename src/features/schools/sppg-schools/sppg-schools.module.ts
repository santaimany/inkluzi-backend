import { Module } from '@nestjs/common';
import { SppgSchoolsService } from './sppg-schools.service';
import { SppgSchoolsController } from './sppg-schools.controller';

@Module({
  controllers: [SppgSchoolsController],
  providers: [SppgSchoolsService],
})
export class SppgSchoolsModule {}
