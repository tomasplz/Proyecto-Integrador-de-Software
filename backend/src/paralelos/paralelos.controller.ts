import { Controller, Get, Param, Query } from '@nestjs/common';
import { ParalelosService } from './paralelos.service';

@Controller('paralelos')
export class ParalelosController {
  constructor(private readonly paralelosService: ParalelosService) {}

  @Get()
  findAll(@Query('semestreId') semestreId?: string) {
    return this.paralelosService.findAll(semestreId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paralelosService.findOne(id);
  }
}
