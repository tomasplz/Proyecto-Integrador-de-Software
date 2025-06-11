import { Module } from '@nestjs/common';
import { BloquesHorarioController } from './bloques-horario.controller';
import { BloquesHorarioService } from './bloques-horario.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BloquesHorarioController],
  providers: [BloquesHorarioService],
})
export class BloquesHorarioModule {}
