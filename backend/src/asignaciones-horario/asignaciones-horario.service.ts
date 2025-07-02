import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsignacionesHorarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAsignacionDto: {
    paraleloId: number;
    salaId: number;
    bloqueHorarioId: number;
    periodoAcademicoId: number;
  }) {
    try {
      // Verificar que todos los IDs existan
      const [paralelo, sala, bloqueHorario, periodoAcademico] = await Promise.all([
        this.prisma.paralelo.findUnique({ where: { id: createAsignacionDto.paraleloId } }),
        this.prisma.sala.findUnique({ where: { id: createAsignacionDto.salaId } }),
        this.prisma.bloqueHorario.findUnique({ where: { id: createAsignacionDto.bloqueHorarioId } }),
        this.prisma.periodoAcademico.findUnique({ where: { id: createAsignacionDto.periodoAcademicoId } })
      ]);

      if (!paralelo) {
        throw new BadRequestException(`Paralelo con ID ${createAsignacionDto.paraleloId} no encontrado`);
      }
      if (!sala) {
        throw new BadRequestException(`Sala con ID ${createAsignacionDto.salaId} no encontrada`);
      }
      if (!bloqueHorario) {
        throw new BadRequestException(`Bloque horario con ID ${createAsignacionDto.bloqueHorarioId} no encontrado`);
      }
      if (!periodoAcademico) {
        throw new BadRequestException(`Periodo académico con ID ${createAsignacionDto.periodoAcademicoId} no encontrado`);
      }

      // Verificar que no exista conflicto (misma sala, mismo bloque, mismo periodo)
      const existingAsignacion = await this.prisma.asignacionHorario.findFirst({
        where: {
          salaId: createAsignacionDto.salaId,
          bloqueHorarioId: createAsignacionDto.bloqueHorarioId,
          periodoAcademicoId: createAsignacionDto.periodoAcademicoId
        }
      });

      if (existingAsignacion) {
        throw new BadRequestException('Ya existe una asignación en esa sala, bloque horario y periodo académico');
      }

      // Crear la asignación
      const asignacion = await this.prisma.asignacionHorario.create({
        data: createAsignacionDto,
        include: {
          paralelo: {
            include: {
              asignatura: {
                include: {
                  semestre: {
                    include: {
                      carrera: true
                    }
                  }
                }
              },
              tipoParalelo: true,
              profesor: true
            }
          },
          sala: true,
          bloqueHorario: true,
          periodoAcademico: true
        }
      });

      return asignacion;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la asignación de horario');
    }
  }

  async findAll() {
    return this.prisma.asignacionHorario.findMany({
      include: {
        paralelo: {
          include: {
            asignatura: {
              include: {
                semestre: {
                  include: {
                    carrera: true
                  }
                }
              }
            },
            tipoParalelo: true,
            profesor: true
          }
        },
        sala: true,
        bloqueHorario: true,
        periodoAcademico: true
      }
    });
  }

  async findOne(id: number) {
    const asignacion = await this.prisma.asignacionHorario.findUnique({
      where: { id },
      include: {
        paralelo: {
          include: {
            asignatura: {
              include: {
                semestre: {
                  include: {
                    carrera: true
                  }
                }
              }
            },
            tipoParalelo: true,
            profesor: true
          }
        },
        sala: true,
        bloqueHorario: true,
        periodoAcademico: true
      }
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return asignacion;
  }

  async update(id: number, updateAsignacionDto: {
    paraleloId?: number;
    salaId?: number;
    bloqueHorarioId?: number;
    periodoAcademicoId?: number;
  }) {
    const existingAsignacion = await this.prisma.asignacionHorario.findUnique({
      where: { id }
    });

    if (!existingAsignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return this.prisma.asignacionHorario.update({
      where: { id },
      data: updateAsignacionDto,
      include: {
        paralelo: {
          include: {
            asignatura: {
              include: {
                semestre: {
                  include: {
                    carrera: true
                  }
                }
              }
            },
            tipoParalelo: true,
            profesor: true
          }
        },
        sala: true,
        bloqueHorario: true,
        periodoAcademico: true
      }
    });
  }

  async remove(id: number) {
    const existingAsignacion = await this.prisma.asignacionHorario.findUnique({
      where: { id }
    });

    if (!existingAsignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return this.prisma.asignacionHorario.delete({
      where: { id }
    });
  }

  async findByPeriodo(periodoId: number) {
    return this.prisma.asignacionHorario.findMany({
      where: { periodoAcademicoId: periodoId },
      include: {
        paralelo: {
          include: {
            asignatura: {
              include: {
                semestre: {
                  include: {
                    carrera: true
                  }
                }
              }
            },
            tipoParalelo: true,
            profesor: true
          }
        },
        sala: true,
        bloqueHorario: true,
        periodoAcademico: true
      }
    });
  }

  async findBySala(salaId: number) {
    return this.prisma.asignacionHorario.findMany({
      where: { salaId },
      include: {
        paralelo: {
          include: {
            asignatura: {
              include: {
                semestre: {
                  include: {
                    carrera: true
                  }
                }
              }
            },
            tipoParalelo: true,
            profesor: true
          }
        },
        sala: true,
        bloqueHorario: true,
        periodoAcademico: true
      }
    });
  }

  // Método para crear asignación usando nombres en lugar de IDs
  async createByNames(createAsignacionDto: {
    paraleloId: number;
    salaNombre: string;
    bloqueHorarioDia: string;
    bloqueHorarioNombre: string;
    periodoAcademicoId?: number;
  }) {
    try {
      // Buscar la sala por nombre
      const sala = await this.prisma.sala.findUnique({
        where: { nombre: createAsignacionDto.salaNombre }
      });

      if (!sala) {
        throw new BadRequestException(`Sala '${createAsignacionDto.salaNombre}' no encontrada`);
      }

      // Buscar el bloque horario por día y nombre
      const bloqueHorario = await this.prisma.bloqueHorario.findUnique({
        where: {
          dia_nombre: {
            dia: createAsignacionDto.bloqueHorarioDia,
            nombre: createAsignacionDto.bloqueHorarioNombre
          }
        }
      });

      if (!bloqueHorario) {
        throw new BadRequestException(`Bloque horario '${createAsignacionDto.bloqueHorarioNombre}' del día '${createAsignacionDto.bloqueHorarioDia}' no encontrado`);
      }

      // Obtener o crear periodo académico
      let periodoAcademicoId = createAsignacionDto.periodoAcademicoId;
      if (!periodoAcademicoId) {
        // Importar el servicio de periodos académicos para obtener el periodo actual
        const currentPeriodo = await this.getCurrentPeriodo();
        periodoAcademicoId = currentPeriodo.id;
      }

      // Crear la asignación usando los IDs encontrados
      return this.create({
        paraleloId: createAsignacionDto.paraleloId,
        salaId: sala.id,
        bloqueHorarioId: bloqueHorario.id,
        periodoAcademicoId: periodoAcademicoId
      });

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la asignación de horario');
    }
  }

  // Método para eliminar asignación por ubicación (útil para drag & drop)
  async removeByLocation(params: {
    paraleloId: number;
    salaNombre: string;
    bloqueHorarioDia: string;
    bloqueHorarioNombre: string;
  }) {
    try {
      console.log('🚀 removeByLocation - Iniciando con parámetros:', params);

      // Buscar la sala por nombre
      const sala = await this.prisma.sala.findUnique({
        where: { nombre: params.salaNombre }
      });

      console.log('🏢 removeByLocation - Sala encontrada:', sala);

      if (!sala) {
        throw new BadRequestException(`Sala '${params.salaNombre}' no encontrada`);
      }

      // Buscar el bloque horario por día y nombre
      console.log('🔍 removeByLocation - Buscando bloque horario con:', {
        dia: params.bloqueHorarioDia,
        nombre: params.bloqueHorarioNombre
      });

      const bloqueHorario = await this.prisma.bloqueHorario.findUnique({
        where: {
          dia_nombre: {
            dia: params.bloqueHorarioDia,
            nombre: params.bloqueHorarioNombre
          }
        }
      });

      console.log('⏰ removeByLocation - Bloque horario encontrado:', bloqueHorario);

      if (!bloqueHorario) {
        throw new BadRequestException(`Bloque horario '${params.bloqueHorarioNombre}' del día '${params.bloqueHorarioDia}' no encontrado`);
      }

      // Buscar y eliminar la asignación
      console.log('🔍 removeByLocation - Buscando asignación con:', {
        paraleloId: params.paraleloId,
        salaId: sala.id,
        bloqueHorarioId: bloqueHorario.id
      });

      const asignacion = await this.prisma.asignacionHorario.findFirst({
        where: {
          paraleloId: params.paraleloId,
          salaId: sala.id,
          bloqueHorarioId: bloqueHorario.id
        }
      });

      console.log('📝 removeByLocation - Asignación encontrada:', asignacion);

      if (!asignacion) {
        throw new NotFoundException('Asignación no encontrada');
      }

      console.log('🗑️ removeByLocation - Eliminando asignación con ID:', asignacion.id);

      const result = await this.prisma.asignacionHorario.delete({
        where: { id: asignacion.id }
      });

      console.log('✅ removeByLocation - Asignación eliminada exitosamente:', result);

      return result;

    } catch (error) {
      console.error('❌ removeByLocation - Error:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al eliminar la asignación de horario');
    }
  }

  // Método helper para obtener el periodo académico actual
  private async getCurrentPeriodo() {
    const now = new Date();
    
    // Buscar un periodo que contenga la fecha actual
    let periodo = await this.prisma.periodoAcademico.findFirst({
      where: {
        fechaInicio: { lte: now },
        fechaFin: { gte: now }
      }
    });

    // Si no hay un periodo activo, crear uno por defecto
    if (!periodo) {
      const year = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const isFirstSemester = currentMonth <= 6;
      const semesterNumber = isFirstSemester ? 1 : 2;
      
      const startDate = new Date(year, isFirstSemester ? 2 : 7, 1);
      const endDate = new Date(year, isFirstSemester ? 6 : 11, 30);
      
      periodo = await this.prisma.periodoAcademico.create({
        data: {
          nombre: `${semesterNumber}° Semestre ${year}`,
          fechaInicio: startDate,
          fechaFin: endDate,
          codigoBanner: `${year}-${semesterNumber}`
        }
      });
    }

    return periodo;
  }

  // Método para crear asignación por código de asignatura (usado por el frontend)
  async createByAsignatura(createDto: {
    asignaturaCode: string;
    paralelo: string;
    bloqueNombre: string;
    bloqueDia: string;
    salaNombre: string;
    carreraNombre?: string;
    semestre?: number;
  }) {
    try {
      console.log('🔄 Creando asignación por código de asignatura:', createDto);

      // 1. Encontrar la asignatura usando código, carrera y semestre
      let asignatura;
      
      if (createDto.carreraNombre && createDto.semestre) {
        // Buscar con información completa
        asignatura = await this.prisma.asignatura.findFirst({
          where: { 
            code: createDto.asignaturaCode,
            semestre: {
              numero: createDto.semestre,
              carrera: {
                name: createDto.carreraNombre
              }
            }
          },
          include: {
            semestre: {
              include: {
                carrera: true
              }
            }
          }
        });
      } else {
        // Fallback: buscar solo por código (puede devolver múltiples resultados)
        asignatura = await this.prisma.asignatura.findFirst({
          where: { code: createDto.asignaturaCode },
          include: {
            semestre: {
              include: {
                carrera: true
              }
            }
          }
        });
      }

      if (!asignatura) {
        throw new BadRequestException(`Asignatura con código ${createDto.asignaturaCode} no encontrada`);
      }

      console.log('✅ Asignatura encontrada:', asignatura.name);

      // 2. Obtener o crear paralelo para esta asignatura
      let paralelo = await this.prisma.paralelo.findFirst({
        where: {
          asignaturaId: asignatura.id,
          nombre: createDto.paralelo // Usar el paralelo enviado desde el frontend
        }
      });

      if (!paralelo) {
        console.log(`📝 Creando paralelo ${createDto.paralelo} para la asignatura`);
        paralelo = await this.prisma.paralelo.create({
          data: {
            nombre: createDto.paralelo,
            asignaturaId: asignatura.id,
            tipoParaleloId: 1, // Asumiendo que existe un tipo de paralelo con ID 1
            capacidadEstimada: 30 // Valor por defecto
          }
        });
      }

      console.log('✅ Paralelo obtenido/creado:', paralelo.nombre);

      // 3. Encontrar la sala
      const sala = await this.prisma.sala.findFirst({
        where: { nombre: createDto.salaNombre }
      });

      if (!sala) {
        throw new BadRequestException(`Sala con nombre ${createDto.salaNombre} no encontrada`);
      }

      console.log('✅ Sala encontrada:', sala.nombre);

      // 4. Encontrar el bloque horario
      const bloqueHorario = await this.prisma.bloqueHorario.findFirst({
        where: {
          nombre: createDto.bloqueNombre,
          dia: createDto.bloqueDia
        }
      });

      if (!bloqueHorario) {
        throw new BadRequestException(`Bloque horario ${createDto.bloqueNombre} en ${createDto.bloqueDia} no encontrado`);
      }

      console.log('✅ Bloque horario encontrado:', `${bloqueHorario.nombre} - ${bloqueHorario.dia}`);

      // 5. Obtener periodo académico actual
      const periodo = await this.getCurrentPeriodo();
      console.log('✅ Periodo académico:', periodo.nombre);

      // 6. Verificar conflictos
      const existingAsignacion = await this.prisma.asignacionHorario.findFirst({
        where: {
          salaId: sala.id,
          bloqueHorarioId: bloqueHorario.id,
          periodoAcademicoId: periodo.id
        }
      });

      if (existingAsignacion) {
        throw new BadRequestException(`Ya existe una asignación en la sala ${sala.nombre} para el bloque ${bloqueHorario.nombre} ${bloqueHorario.dia}`);
      }

      // 7. Crear la asignación
      const asignacion = await this.prisma.asignacionHorario.create({
        data: {
          paraleloId: paralelo.id,
          salaId: sala.id,
          bloqueHorarioId: bloqueHorario.id,
          periodoAcademicoId: periodo.id
        },
        include: {
          paralelo: {
            include: {
              asignatura: {
                include: {
                  semestre: {
                    include: {
                      carrera: true
                    }
                  }
                }
              }
            }
          },
          sala: true,
          bloqueHorario: true,
          periodoAcademico: true
        }
      });

      console.log('✅ Asignación de horario creada exitosamente');
      return asignacion;

    } catch (error) {
      console.error('❌ Error al crear asignación de horario:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la asignación de horario');
    }
  }

  // Método para actualizar la sala de una asignación
  async updateRoom(updateDto: {
    asignaturaCode: string;
    bloqueNombre: string;
    bloqueDia: string;
    oldSalaNombre: string;
    newSalaNombre: string;
  }) {
    try {
      console.log('🔄 Actualizando sala de asignación:', updateDto);

      // 1. Encontrar la asignación actual
      const asignacion = await this.findAsignacionByDetails(
        updateDto.asignaturaCode,
        updateDto.bloqueNombre,
        updateDto.bloqueDia,
        updateDto.oldSalaNombre
      );

      // 2. Encontrar la nueva sala
      const newSala = await this.prisma.sala.findFirst({
        where: { nombre: updateDto.newSalaNombre }
      });

      if (!newSala) {
        throw new BadRequestException(`Sala ${updateDto.newSalaNombre} no encontrada`);
      }

      // 3. Verificar que la nueva sala no esté ocupada en ese bloque
      const conflict = await this.prisma.asignacionHorario.findFirst({
        where: {
          salaId: newSala.id,
          bloqueHorarioId: asignacion.bloqueHorarioId,
          periodoAcademicoId: asignacion.periodoAcademicoId,
          id: { not: asignacion.id }
        }
      });

      if (conflict) {
        throw new BadRequestException(`La sala ${updateDto.newSalaNombre} ya está ocupada en ese horario`);
      }

      // 4. Actualizar la asignación
      const updatedAsignacion = await this.prisma.asignacionHorario.update({
        where: { id: asignacion.id },
        data: { salaId: newSala.id },
        include: {
          paralelo: {
            include: {
              asignatura: true
            }
          },
          sala: true,
          bloqueHorario: true
        }
      });

      console.log('✅ Sala actualizada exitosamente');
      return updatedAsignacion;

    } catch (error) {
      console.error('❌ Error al actualizar sala:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la sala');
    }
  }

  // Método para actualizar el profesor de una asignación
  async updateTeacher(updateDto: {
    asignaturaCode: string;
    bloqueNombre: string;
    bloqueDia: string;
    salaNombre: string;
    teacherRut: string;
  }) {
    try {
      console.log('🔄 Actualizando profesor de asignación:', updateDto);

      // 1. Encontrar la asignación
      const asignacion = await this.findAsignacionByDetails(
        updateDto.asignaturaCode,
        updateDto.bloqueNombre,
        updateDto.bloqueDia,
        updateDto.salaNombre
      );

      // 2. Encontrar el profesor
      const profesor = await this.prisma.profesor.findUnique({
        where: { rut: updateDto.teacherRut }
      });

      if (!profesor) {
        throw new BadRequestException(`Profesor con RUT ${updateDto.teacherRut} no encontrado`);
      }

      // 3. Actualizar el paralelo para asignar el profesor
      const updatedParalelo = await this.prisma.paralelo.update({
        where: { id: asignacion.paraleloId },
        data: { profesorId: profesor.id },
        include: {
          profesor: true,
          asignatura: true
        }
      });

      console.log('✅ Profesor actualizado exitosamente');
      return updatedParalelo;

    } catch (error) {
      console.error('❌ Error al actualizar profesor:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar el profesor');
    }
  }

  // Método helper para encontrar una asignación por detalles
  private async findAsignacionByDetails(
    asignaturaCode: string,
    bloqueNombre: string,
    bloqueDia: string,
    salaNombre: string
  ) {
    console.log('🔍 Buscando asignación con parámetros:', {
      asignaturaCode,
      bloqueNombre,
      bloqueDia,
      salaNombre
    });

    // Primero, busquemos todas las asignaciones para debug
    const todasAsignaciones = await this.prisma.asignacionHorario.findMany({
      include: {
        paralelo: {
          include: {
            asignatura: true
          }
        },
        sala: true,
        bloqueHorario: true
      }
    });

    console.log('📋 Total de asignaciones en BD:', todasAsignaciones.length);
    console.log('📋 Primeras 3 asignaciones para debug:', todasAsignaciones.slice(0, 3).map(a => ({
      id: a.id,
      asignaturaCode: a.paralelo.asignatura.code,
      asignaturaNombre: a.paralelo.asignatura.name,
      salaNombre: a.sala.nombre,
      bloqueNombre: a.bloqueHorario.nombre,
      bloqueDia: a.bloqueHorario.dia
    })));

    // Buscar por partes para mejor debugging
    // 1. Buscar asignatura
    const asignaturas = await this.prisma.asignatura.findMany({
      where: { code: asignaturaCode }
    });
    console.log('🎯 Asignaturas encontradas con code', asignaturaCode, ':', asignaturas.length);

    // 2. Buscar bloque horario
    const bloques = await this.prisma.bloqueHorario.findMany({
      where: {
        nombre: bloqueNombre,
        dia: bloqueDia
      }
    });
    console.log('🕐 Bloques horarios encontrados:', bloques.length);
    if (bloques.length === 0) {
      // Buscar bloques similares
      const bloquesSimilares = await this.prisma.bloqueHorario.findMany({
        where: {
          OR: [
            { nombre: bloqueNombre },
            { dia: bloqueDia }
          ]
        }
      });
      console.log('🕐 Bloques similares:', bloquesSimilares.map(b => ({ nombre: b.nombre, dia: b.dia })));
    }

    // 3. Buscar sala
    const salas = await this.prisma.sala.findMany({
      where: { nombre: salaNombre }
    });
    console.log('🏠 Salas encontradas:', salas.length);

    const asignacion = await this.prisma.asignacionHorario.findFirst({
      where: {
        paralelo: {
          asignatura: {
            code: asignaturaCode
          }
        },
        bloqueHorario: {
          nombre: bloqueNombre,
          dia: bloqueDia
        },
        sala: {
          nombre: salaNombre
        }
      },
      include: {
        paralelo: {
          include: {
            asignatura: true
          }
        },
        sala: true,
        bloqueHorario: true
      }
    });

    if (!asignacion) {
      console.error('❌ No se encontró asignación. Verificando condiciones:');
      console.error('- Asignatura code:', asignaturaCode, '- Encontradas:', asignaturas.length);
      console.error('- Bloque nombre:', bloqueNombre, 'dia:', bloqueDia, '- Encontrados:', bloques.length);
      console.error('- Sala nombre:', salaNombre, '- Encontradas:', salas.length);
      
      throw new NotFoundException(`No se encontró asignación para ${asignaturaCode} en ${salaNombre} durante ${bloqueNombre} ${bloqueDia}`);
    }

    console.log('✅ Asignación encontrada:', {
      id: asignacion.id,
      asignatura: asignacion.paralelo.asignatura.code,
      sala: asignacion.sala.nombre,
      bloque: `${asignacion.bloqueHorario.dia} ${asignacion.bloqueHorario.nombre}`
    });

    return asignacion;
  }

  // Eliminar todas las asignaciones de un periodo académico específico
  async removeAllByPeriodo(periodoId: number) {
    try {
      console.log(`🗑️ Eliminando todas las asignaciones del periodo académico ${periodoId}...`);
      
      // Verificar que el periodo académico existe
      const periodo = await this.prisma.periodoAcademico.findUnique({
        where: { id: periodoId }
      });

      if (!periodo) {
        throw new NotFoundException(`Periodo académico con ID ${periodoId} no encontrado`);
      }

      // Contar las asignaciones antes de eliminar
      const count = await this.prisma.asignacionHorario.count({
        where: { periodoAcademicoId: periodoId }
      });

      // Eliminar todas las asignaciones del periodo
      const result = await this.prisma.asignacionHorario.deleteMany({
        where: { periodoAcademicoId: periodoId }
      });

      console.log(`✅ Eliminadas ${result.count} asignaciones del periodo ${periodo.nombre}`);
      
      return {
        message: `Se eliminaron ${result.count} asignaciones del periodo ${periodo.nombre}`,
        deletedCount: result.count,
        periodo: periodo.nombre
      };
    } catch (error) {
      console.error('❌ Error al eliminar asignaciones por periodo:', error);
      throw error;
    }
  }

  // Eliminar todas las asignaciones del periodo académico actual
  async removeAllCurrentPeriod() {
    try {
      console.log('🗑️ Eliminando todas las asignaciones del periodo académico actual...');
      
      // Obtener el periodo académico actual
      const currentPeriod = await this.prisma.periodoAcademico.findFirst({
        where: {
          fechaInicio: { lte: new Date() },
          fechaFin: { gte: new Date() }
        },
        orderBy: { fechaInicio: 'desc' }
      });

      if (!currentPeriod) {
        throw new NotFoundException('No se encontró un periodo académico actual activo');
      }

      console.log(`📅 Periodo académico actual: ${currentPeriod.nombre} (${currentPeriod.id})`);
      
      // Eliminar todas las asignaciones del periodo actual
      return this.removeAllByPeriodo(currentPeriod.id);
    } catch (error) {
      console.error('❌ Error al eliminar asignaciones del periodo actual:', error);
      throw error;
    }
  }
}
