import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BloquesHorarioService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.bloqueHorario.findMany();
  }

  findOne(id: string) {
    return this.prisma.bloqueHorario.findUnique({ where: { id: Number(id) } });
  }
}
