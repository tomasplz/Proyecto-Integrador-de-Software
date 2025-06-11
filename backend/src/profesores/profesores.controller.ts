import { Controller, Get, Param } from '@nestjs/common';
import { ProfesoresService } from './profesores.service';

@Controller('profesores')
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  @Get()
  findAll() {
    return this.profesoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profesoresService.findOne(id);
  }
}
