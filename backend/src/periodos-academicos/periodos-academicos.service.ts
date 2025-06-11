import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeriodosAcademicosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.periodoAcademico.findMany();
  }

  findOne(id: string) {
    return this.prisma.periodoAcademico.findUnique({ where: { id: Number(id) } });
  }
}
