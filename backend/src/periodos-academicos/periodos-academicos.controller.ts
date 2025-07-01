import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { PeriodosAcademicosService } from './periodos-academicos.service';

@Controller('periodos-academicos')
export class PeriodosAcademicosController {
  constructor(private readonly periodosAcademicosService: PeriodosAcademicosService) {}

  @Get()
  findAll() {
    return this.periodosAcademicosService.findAll();
  }

  @Get('current')
  getCurrentPeriodo() {
    return this.periodosAcademicosService.getCurrentPeriodo();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodosAcademicosService.findOne(id);
  }

  @Post()
  create(@Body() createPeriodoDto: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    codigoBanner?: string;
  }) {
    return this.periodosAcademicosService.create({
      ...createPeriodoDto,
      fechaInicio: new Date(createPeriodoDto.fechaInicio),
      fechaFin: new Date(createPeriodoDto.fechaFin)
    });
  }
}
