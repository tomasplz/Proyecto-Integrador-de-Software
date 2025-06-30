import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { HorarioService } from './horario.service';

@Controller('horario')
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  @Get(':periodoId')
  getHorario(@Param('periodoId', ParseIntPipe) periodoId: number) {
    return this.horarioService.getHorario(periodoId);
  }
}
