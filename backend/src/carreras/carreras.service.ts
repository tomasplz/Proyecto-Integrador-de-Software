import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarrerasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.carrera.findMany();
  }

  findOne(id: string) {
    return this.prisma.carrera.findUnique({ where: { id: Number(id) } });
  }
}
