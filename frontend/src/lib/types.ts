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

export interface TimeSlotData {
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

export type HorarioInsert = Omit<Horario, "id"> & { id?: number }
export type HorarioUpdate = Partial<Horario>