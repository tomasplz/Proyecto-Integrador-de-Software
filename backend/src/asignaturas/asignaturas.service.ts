import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsignaturasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(semestreId?: string) {
    if (semestreId) {
      return this.prisma.asignatura.findMany({ where: { semestreId: Number(semestreId) } });
    }
    return this.prisma.asignatura.findMany();
  }

  findOne(id: string) {
    return this.prisma.asignatura.findUnique({ where: { id: Number(id) } });
  }
}
