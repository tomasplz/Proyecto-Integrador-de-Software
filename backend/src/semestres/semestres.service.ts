import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SemestresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(carreraId?: string) {
    if (carreraId) {
      return this.prisma.semestre.findMany({ where: { carreraId: Number(carreraId) } });
    }
    return this.prisma.semestre.findMany();
  }

  findOne(id: string) {
    return this.prisma.semestre.findUnique({ where: { id: Number(id) } });
  }
}
