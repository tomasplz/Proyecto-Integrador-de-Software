import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CarrerasModule } from './carreras/carreras.module';
import { SemestresModule } from './semestres/semestres.module';
import { AsignaturasModule } from './asignaturas/asignaturas.module';
import { ParalelosModule } from './paralelos/paralelos.module';
import { ProfesoresModule } from './profesores/profesores.module';
import { SalasModule } from './salas/salas.module';
import { BloquesHorarioModule } from './bloques-horario/bloques-horario.module';
import { PeriodosAcademicosModule } from './periodos-academicos/periodos-academicos.module';
import { TiposParaleloModule } from './tipos-paralelo/tipos-paralelo.module';
import { HorarioModule } from './horario/horario.module';

@Module({
  imports: [
    CarrerasModule,
    SemestresModule,
    AsignaturasModule,
    ParalelosModule,
    ProfesoresModule,
    SalasModule,
    BloquesHorarioModule,
    PeriodosAcademicosModule,
    TiposParaleloModule,
    HorarioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
