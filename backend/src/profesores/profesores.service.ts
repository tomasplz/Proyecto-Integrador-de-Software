import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfesoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const profesores = await this.prisma.profesor.findMany({
      include: {
        bloquesDisponibles: {
          include: {
            bloqueHorario: true,
          },
        },
      },
    });
    return profesores.map((prof) => ({
      ...prof,
      availability: prof.bloquesDisponibles.map((b) => `${b.bloqueHorario.dia}-${b.bloqueHorario.nombre}`),
    }));
  }

  async findOne(id: string) {
    const prof = await this.prisma.profesor.findUnique({
      where: { id: Number(id) },
      include: {
        bloquesDisponibles: {
          include: {
            bloqueHorario: true,
          },
        },
      },
    });
    if (!prof) return null;
    return {
      ...prof,
      availability: prof.bloquesDisponibles.map((b) => `${b.bloqueHorario.dia}-${b.bloqueHorario.nombre}`),
    };
  }
}
