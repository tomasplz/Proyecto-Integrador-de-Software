import { Controller, Get, Param } from '@nestjs/common';
import { BloquesHorarioService } from './bloques-horario.service';

@Controller('bloques-horario')
export class BloquesHorarioController {
  constructor(private readonly bloquesHorarioService: BloquesHorarioService) {}

  @Get()
  findAll() {
    return this.bloquesHorarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bloquesHorarioService.findOne(id);
  }
}
