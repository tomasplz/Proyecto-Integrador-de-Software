import { Injectable } from '@nestjs/common';

@Injectable()
export class HorarioService {
  findByPeriodo(periodoAcademicoId: string) {
    // Lógica para obtener el horario de un periodo académico
    return `Horario para periodo académico ${periodoAcademicoId}`;
  }
}
