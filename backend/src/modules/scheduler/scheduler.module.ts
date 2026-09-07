import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { DigestModule } from '../digest/digest.module';

@Module({
  imports: [DigestModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}