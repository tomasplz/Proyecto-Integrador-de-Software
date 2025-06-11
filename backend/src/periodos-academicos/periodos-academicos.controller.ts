import { Controller, Get, Param } from '@nestjs/common';
import { PeriodosAcademicosService } from './periodos-academicos.service';

@Controller('periodos-academicos')
export class PeriodosAcademicosController {
  constructor(private readonly periodosAcademicosService: PeriodosAcademicosService) {}

  @Get()
  findAll() {
    return this.periodosAcademicosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodosAcademicosService.findOne(id);
  }
}
