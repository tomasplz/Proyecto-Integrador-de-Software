import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParalelosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(semestreId?: string) {
    const include = {
      asignatura: {
        include: {
          semestre: {
            include: {
              carrera: true
            }
          }
        }
      },
      tipoParalelo: true,
      profesor: true
    };

    if (semestreId) {
      return this.prisma.paralelo.findMany({
        where: {
          asignatura: {
            semestreId: Number(semestreId),
          },
        },
        include
      });
    }
    return this.prisma.paralelo.findMany({ include });
  }

  findOne(id: string) {
    return this.prisma.paralelo.findUnique({ 
      where: { id: Number(id) },
      include: {
        asignatura: {
          include: {
            semestre: {
              include: {
                carrera: true
              }
            }
          }
        },
        tipoParalelo: true,
        profesor: true
      }
    });
  }
}
