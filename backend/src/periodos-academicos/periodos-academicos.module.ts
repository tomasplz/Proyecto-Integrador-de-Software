import { Module } from '@nestjs/common';
import { PeriodosAcademicosController } from './periodos-academicos.controller';
import { PeriodosAcademicosService } from './periodos-academicos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PeriodosAcademicosController],
  providers: [PeriodosAcademicosService],
})
export class PeriodosAcademicosModule {}
