import { Module } from '@nestjs/common';
import { AsignacionesHorarioController } from './asignaciones-horario.controller';
import { AsignacionesHorarioService } from './asignaciones-horario.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AsignacionesHorarioController],
  providers: [AsignacionesHorarioService],
  exports: [AsignacionesHorarioService]
})
export class AsignacionesHorarioModule {}
