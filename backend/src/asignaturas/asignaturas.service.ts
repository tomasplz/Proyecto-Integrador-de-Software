import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsignaturasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(semestreId?: string) {
    const whereClause = semestreId ? { semestreId: Number(semestreId) } : {};

    const asignaturas = await this.prisma.asignatura.findMany({
      where: whereClause,
      include: {
        semestre: {
          include: {
            carrera: true,
          },
        },
        paralelos: true,
      },
    });

    return asignaturas.map((asignatura) => ({
      key: `${asignatura.code}-${asignatura.semestre.carrera.code}`,
      code: asignatura.code,
      name: asignatura.name,
      semester: asignatura.semestre.numero,
      career: asignatura.semestre.carrera.code,
      demand: asignatura.demand,
      sectionsNumber: asignatura.paralelos.length,
      sectionSize:
        asignatura.paralelos.length > 0
          ? asignatura.paralelos[0].capacidadEstimada || 0
          : 0,
      suggestedRoom: asignatura.suggestedRoom,
      isLocked: asignatura.isLocked,
      isPreAssigned: asignatura.isPreAssigned,
    }));
  }

  findOne(id: string) {
    return this.prisma.asignatura.findUnique({ where: { id: Number(id) } });
  }
}
