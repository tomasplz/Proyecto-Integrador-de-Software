// Tipos para los datos JSON
export interface Teacher {
  schedule: { time: string; room: string }[];
  rut: string
  name: string
  courseOffer: string[]
  isAvailable: boolean
  maxSectionsPerWeek: number
  availability: any[]
}

export interface Course {
  key: string
  period: string
  career: string
  demand: number
  isLocked: boolean
  isPreAssigned: boolean
  lastUpdate: string
  sectionSize: number
  sectionsNumber: number
  semester: number
  suggestedRoom: string
  code: string
  name: string
  paralelo?: string // Nuevo campo para el paralelo (C1, C2, C3, etc.)
}

// Interfaz para un curso colocado en el horario con información adicional
export interface ScheduledCourse extends Course {
  selectedRoom?: string
  selectedTeacher?: string
}

export interface Classroom {
  nombre: string
  capacidad: number | null
  sede: string
}

export interface TimeSlot {
  nombre: string
  horario: string | null
  minuto_inicio: number | null
  minuto_termino: number | null
}

export interface Horario {
  id: number
  curso_id: string
  programa_id: string
  semestre_id: string
  profesor_id: number | null
  aula_id: number | null
  dia: string
  hora: string
}

export interface HorarioItem {
  dia: string;
  hora: string;
  sala: string | null;
  profesor: string | null;
}

export interface AsignaturaSchedule {
  nombre: string;
  codigo: string;
  horarios: HorarioItem[];
}

export interface SemestreSchedule {
  semestre: number;
  asignaturas: AsignaturaSchedule[];
}

export interface Schedule {
  carrera: string;
  semestres: SemestreSchedule[];
}

export interface FlatScheduleItem extends HorarioItem {
  asignatura: string;
  codigo: string;
}

export type HorarioInsert = Omit<Horario, "id"> & { id?: number }
export type HorarioUpdate = Partial<Horario>