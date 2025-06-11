import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiposParaleloService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tipoParalelo.findMany();
  }

  findOne(id: string) {
    return this.prisma.tipoParalelo.findUnique({ where: { id: Number(id) } });
  }
}
