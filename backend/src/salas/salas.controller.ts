import { Controller, Get, Param } from '@nestjs/common';
import { SalasService } from './salas.service';

@Controller('salas')
export class SalasController {
  constructor(private readonly salasService: SalasService) {}

  @Get()
  findAll() {
    return this.salasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salasService.findOne(id);
  }
}
