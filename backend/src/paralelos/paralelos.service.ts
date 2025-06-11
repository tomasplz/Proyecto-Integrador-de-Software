import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParalelosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(semestreId?: string) {
    if (semestreId) {
      return this.prisma.paralelo.findMany({
        where: {
          asignatura: {
            semestreId: Number(semestreId),
          },
        },
      });
    }
    return this.prisma.paralelo.findMany();
  }

  findOne(id: string) {
    return this.prisma.paralelo.findUnique({ where: { id: Number(id) } });
  }
}
