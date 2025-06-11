import { Module } from '@nestjs/common';
import { ParalelosController } from './paralelos.controller';
import { ParalelosService } from './paralelos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParalelosController],
  providers: [ParalelosService],
  exports: [ParalelosService],
})
export class ParalelosModule {}
