import { Controller, Get, Param, Query } from '@nestjs/common';
import { AsignaturasService } from './asignaturas.service';

@Controller('asignaturas')
export class AsignaturasController {
  constructor(private readonly asignaturasService: AsignaturasService) {}

  @Get()
  findAll(@Query('semestreId') semestreId?: string) {
    return this.asignaturasService.findAll(semestreId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.asignaturasService.findOne(id);
  }
}
