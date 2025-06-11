import { Controller, Get, Param, Query } from '@nestjs/common';
import { SemestresService } from './semestres.service';

@Controller('semestres')
export class SemestresController {
  constructor(private readonly semestresService: SemestresService) {}

  @Get()
  findAll(@Query('carreraId') carreraId?: string) {
    return this.semestresService.findAll(carreraId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semestresService.findOne(id);
  }
}
