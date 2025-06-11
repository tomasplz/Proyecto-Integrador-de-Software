import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.sala.findMany(); // Si el modelo es 'Sala' en singular, usa 'sala'
  }

  findOne(id: string) {
    return this.prisma.sala.findUnique({ where: { id: Number(id) } });
  }
}
// Si el modelo es 'Sala', asegúrate de que el cliente de Prisma esté generado y actualizado.
