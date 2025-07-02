import { Controller, Get, Post, Body, Param, Delete, Put, Query, Patch } from '@nestjs/common';
import { AsignacionesHorarioService } from './asignaciones-horario.service';

@Controller('asignaciones-horario')
export class AsignacionesHorarioController {
  constructor(private readonly asignacionesHorarioService: AsignacionesHorarioService) {}

  @Post()
  async create(@Body() createAsignacionDto: {
    asignaturaCode: string;
    paralelo: string;
    bloqueNombre: string;
    bloqueDia: string;
    salaNombre: string;
    carreraNombre?: string;
    semestre?: number;
  }) {
    return this.asignacionesHorarioService.createByAsignatura(createAsignacionDto);
  }

  @Post('by-ids')
  async createByIds(@Body() createAsignacionDto: {
    paraleloId: number;
    salaId: number;
    bloqueHorarioId: number;
    periodoAcademicoId: number;
  }) {
    return this.asignacionesHorarioService.create(createAsignacionDto);
  }

  // Endpoint alternativo que acepta nombres en lugar de IDs
  @Post('by-names')
  async createByNames(@Body() createAsignacionDto: {
    paraleloId: number;
    salaNombre: string;
    bloqueHorarioDia: string;
    bloqueHorarioNombre: string;
    periodoAcademicoId?: number; // Opcional, usa el actual si no se proporciona
  }) {
    return this.asignacionesHorarioService.createByNames(createAsignacionDto);
  }

  @Get()
  async findAll() {
    return this.asignacionesHorarioService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.asignacionesHorarioService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAsignacionDto: {
    paraleloId?: number;
    salaId?: number;
    bloqueHorarioId?: number;
    periodoAcademicoId?: number;
  }) {
    return this.asignacionesHorarioService.update(+id, updateAsignacionDto);
  }

  // Endpoint para eliminar por paralelo, sala y bloque (útil para el drag & drop)
  @Delete('by-location')
  async removeByLocation(@Query() query: {
    paraleloId: string;
    salaNombre: string;
    bloqueHorarioDia: string;
    bloqueHorarioNombre: string;
  }) {
    console.log('🔍 removeByLocation - Query recibida:', query);
    
    const params = {
      paraleloId: +query.paraleloId,
      salaNombre: query.salaNombre,
      bloqueHorarioDia: query.bloqueHorarioDia,
      bloqueHorarioNombre: query.bloqueHorarioNombre
    };
    
    console.log('🔍 removeByLocation - Parámetros procesados:', params);
    
    return this.asignacionesHorarioService.removeByLocation(params);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.asignacionesHorarioService.remove(+id);
  }

  // Endpoint específico para obtener asignaciones por periodo académico
  @Get('periodo/:periodoId')
  async findByPeriodo(@Param('periodoId') periodoId: string) {
    return this.asignacionesHorarioService.findByPeriodo(+periodoId);
  }

  // Endpoint para obtener asignaciones de una sala específica
  @Get('sala/:salaId')
  async findBySala(@Param('salaId') salaId: string) {
    return this.asignacionesHorarioService.findBySala(+salaId);
  }

  // Endpoint para actualizar la sala de una asignación
  @Patch('update-room')
  async updateRoom(@Body() updateDto: {
    asignaturaCode: string;
    bloqueNombre: string;
    bloqueDia: string;
    oldSalaNombre: string;
    newSalaNombre: string;
  }) {
    return this.asignacionesHorarioService.updateRoom(updateDto);
  }

  // Endpoint para actualizar el profesor de una asignación
  @Patch('update-teacher')
  async updateTeacher(@Body() updateDto: {
    asignaturaCode: string;
    bloqueNombre: string;
    bloqueDia: string;
    salaNombre: string;
    teacherRut: string;
  }) {
    return this.asignacionesHorarioService.updateTeacher(updateDto);
  }

  // Endpoint para eliminar todas las asignaciones de un periodo académico
  @Delete('periodo/:periodoId/all')
  async removeAllByPeriodo(@Param('periodoId') periodoId: string) {
    return this.asignacionesHorarioService.removeAllByPeriodo(+periodoId);
  }

  // Endpoint para eliminar todas las asignaciones del periodo académico actual
  @Delete('current-period/all')
  async removeAllCurrentPeriod() {
    return this.asignacionesHorarioService.removeAllCurrentPeriod();
  }
}
