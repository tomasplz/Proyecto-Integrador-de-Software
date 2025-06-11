import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfesoresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.profesor.findMany();
  }

  findOne(id: string) {
    return this.prisma.profesor.findUnique({ where: { id: Number(id) } });
  }
}
