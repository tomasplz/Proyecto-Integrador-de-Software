import { Controller, Get, Param } from '@nestjs/common';
import { HorarioService } from './horario.service';

@Controller('horario')
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  @Get(':periodoAcademicoId')
  findByPeriodo(@Param('periodoAcademicoId') periodoAcademicoId: string) {
    return this.horarioService.findByPeriodo(periodoAcademicoId);
  }
}
