import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HorarioService {
  constructor(private readonly prisma: PrismaService) {}

  async getHorario(periodoId: number) {
    const paralelos = await this.prisma.paralelo.findMany({
      where: {
        asignaciones: {
          some: {
            periodoAcademicoId: periodoId,
          },
        },
      },
      include: {
        asignatura: {
          include: {
            semestre: {
              include: {
                carrera: true,
              },
            },
          },
        },
        profesor: true,
        asignaciones: {
          where: {
            periodoAcademicoId: periodoId,
          },
          include: {
            bloqueHorario: true,
            sala: true,
          },
        },
      },
    });

    const schedule: any = {};

    for (const paralelo of paralelos) {
      const carrera = paralelo.asignatura.semestre.carrera.name;
      const semestre = paralelo.asignatura.semestre.numero;
      const key = `${carrera}-${semestre}`;

      if (!schedule[key]) {
        schedule[key] = {
          career: carrera,
          semester: semestre,
          timeSlots: {},
        };
      }

      for (const asignacion of paralelo.asignaciones) {
        const time = `${asignacion.bloqueHorario.horaInicio
          .toTimeString()
          .substring(0, 5)} - ${asignacion.bloqueHorario.horaFin
          .toTimeString()
          .substring(0, 5)}`;
        const day = asignacion.bloqueHorario.dia.toLowerCase();

        if (!schedule[key].timeSlots[time]) {
          schedule[key].timeSlots[time] = { time };
        }

        schedule[key].timeSlots[time][day] = {
          id: paralelo.id,
          name: paralelo.asignatura.name,
          code: paralelo.asignatura.code,
          teacher: paralelo.profesor?.name,
          room: asignacion.sala.nombre,
        };
      }
    }

    // Convert the timeSlots map to an array
    for (const key in schedule) {
      schedule[key].timeSlots = Object.values(schedule[key].timeSlots);
    }

    return Object.values(schedule);
  }
}
