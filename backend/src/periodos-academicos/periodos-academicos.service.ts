import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeriodosAcademicosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.periodoAcademico.findMany({
      orderBy: { fechaInicio: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.periodoAcademico.findUnique({ where: { id: Number(id) } });
  }

  // Método para obtener el periodo académico actual/activo
  async getCurrentPeriodo() {
    const now = new Date();
    
    // Buscar un periodo que contenga la fecha actual
    let periodo = await this.prisma.periodoAcademico.findFirst({
      where: {
        fechaInicio: { lte: now },
        fechaFin: { gte: now }
      }
    });

    // Si no hay un periodo activo, crear uno por defecto
    if (!periodo) {
      const year = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11
      
      // Determinar si es primer o segundo semestre
      const isFirstSemester = currentMonth <= 6;
      const semesterNumber = isFirstSemester ? 1 : 2;
      
      const startDate = new Date(year, isFirstSemester ? 2 : 7, 1); // Marzo o Agosto
      const endDate = new Date(year, isFirstSemester ? 6 : 11, 30); // Julio o Diciembre
      
      periodo = await this.prisma.periodoAcademico.create({
        data: {
          nombre: `${semesterNumber}° Semestre ${year}`,
          fechaInicio: startDate,
          fechaFin: endDate,
          codigoBanner: `${year}-${semesterNumber}`
        }
      });
    }

    return periodo;
  }

  // Método para crear un nuevo periodo académico
  async create(data: {
    nombre: string;
    fechaInicio: Date;
    fechaFin: Date;
    codigoBanner?: string;
  }) {
    return this.prisma.periodoAcademico.create({
      data
    });
  }
}
