import { Controller, Get, Param } from '@nestjs/common';
import { TiposParaleloService } from './tipos-paralelo.service';

@Controller('tipos-paralelo')
export class TiposParaleloController {
  constructor(private readonly tiposParaleloService: TiposParaleloService) {}

  @Get()
  findAll() {
    return this.tiposParaleloService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposParaleloService.findOne(id);
  }
}
