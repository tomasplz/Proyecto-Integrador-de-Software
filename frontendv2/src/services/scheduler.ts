
/**
 * Represents a Carrera.
 */
export interface Carrera {
  id: string;
  name: string;
}

/**
 * Represents a Periodo Academico.
 */
export interface PeriodoAcademico {
  id: string;
  name: string;
}

/**
 * Represents a Semestre.
 */
export interface Semestre {
  id: string;
  name: string;
}

/**
 * Represents a Paralelo.
 */
export interface Paralelo {
  id: string;
  asignatura: string; // e.g., "CÁLCULO I C1"
  nrc: string; // Will default to "NA"
  professor: string | null;
  carreraId: string;
  semestreId: string;
  periodoAcademicoId: string;
}

/**
 * Represents a Bloque Horario.
 */
export interface BloqueHorario {
  id: string; // e.g., "A", "B"
  time: string; // e.g., "A (08:10 - 09:40)"
}

/**
 * Represents a Sala.
 */
export interface Sala {
  id: string;
  name: string;
}

/**
 * Represents an Asignacion Horario.
 */
export interface AsignacionHorario {
  id: string; // Unique ID for the assignment itself
  paraleloId: string;
  bloqueHorarioId: string;
  periodoAcademicoId: string;
  salaId: string;
  day: string; // e.g., "Lunes", "Martes"
}


export interface AssignmentResult {
  success: boolean;
  assignment?: AsignacionHorario;
  warnings?: string[];
  conflicts?: string[];
}

export interface DeletionResult {
  success: boolean;
  error?: string;
}

// Default period for new/unspecified paralelos if not assigned
const DEFAULT_PERIODO_ID = '1'; // "2024 Semestre I"

// Mock data store for assignments to make simulation stateful
let mockAsignaciones: AsignacionHorario[] = [
   { id: 'initial-1', paraleloId: '1', bloqueHorarioId: 'A', periodoAcademicoId: '1', salaId: '1', day: 'Lunes'},
];


/**
 * Asynchronously retrieves a list of Carreras.
 */
export async function getCarreras(): Promise<Carrera[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [
    { id: '1', name: 'Ingeniería Civil en Computación e Informática' },
    { id: '4', name: 'Ingeniería Civil Industrial' },
    { id: '5', name: 'Ingeniería en Tecnologías de la Información' },
  ];
}

/**
 * Asynchronously retrieves a list of Periodos Academicos.
 */
export async function getPeriodosAcademicos(): Promise<PeriodoAcademico[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [
    { id: '1', name: '2024 Semestre I' },
    { id: '2', name: '2024 Semestre II' },
    { id: '3', name: '2025 Semestre I' },
  ];
}

/**
 * Asynchronously retrieves a list of Semestres.
 */
export async function getSemestres(): Promise<Semestre[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return Array.from({ length: 10 }, (_, i) => ({
    id: (i + 1).toString(),
    name: `Semestre ${i + 1}`,
  }));
}


let allParalelosPool: Paralelo[] = [
  // ICI Sem 1 - Carrera ID 1
  { id: '1', asignatura: 'CÁLCULO I C1', nrc: 'NA', professor: 'Dr. Newton', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ALG1', asignatura: 'ÁLGEBRA I C1', nrc: 'NA', professor: 'Prof. Euler', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: '2', asignatura: 'INTRODUCCIÓN A LA FÍSICA C1', nrc: 'NA', professor: 'Dr. Einstein', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_PII', asignatura: 'PR. INTRO. A LA INGENIERÍA C1', nrc: 'NA', professor: 'Prof. Hopper', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_CE1', asignatura: 'COMUNICACIÓN EFECTIVA I C1', nrc: 'NA', professor: 'Prof. Cicero', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ING1', asignatura: 'INGLÉS 1 C1', nrc: 'NA', professor: 'Prof. Shakespeare', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_IUE', asignatura: 'IDENTIDAD, UNIV. Y EQ C1', nrc: 'NA', professor: 'Prof. Platon', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },

  // ICI Sem 2 - Carrera ID 1
  { id: 'ICI_MEC', asignatura: 'MECÁNICA C1', nrc: 'NA', professor: 'Prof. Galileo', carreraId: '1', semestreId: '2', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_CAL2', asignatura: 'CÁLCULO II C1', nrc: 'NA', professor: 'Prof. Leibniz', carreraId: '1', semestreId: '2', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ALG2', asignatura: 'ÁLGEBRA II C1', nrc: 'NA', professor: 'Prof. Noether', carreraId: '1', semestreId: '2', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_PROG', asignatura: 'PROGRAMACIÓN C1', nrc: 'NA', professor: 'Prof. Knuth', carreraId: '1', semestreId: '2', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ING2', asignatura: 'INGLÉS 2 C1', nrc: 'NA', professor: 'Prof. Austen', carreraId: '1', semestreId: '2', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_DFC', asignatura: 'DIÁLOGO, FE Y CULTURA C1', nrc: 'NA', professor: 'Prof. Aquinas', carreraId: '1', semestreId: '2', periodoAcademicoId: DEFAULT_PERIODO_ID },

  // ICI Sem 3 - Carrera ID 1
  { id: 'ICI_QG', asignatura: 'QUÍMICA GENERAL C1', nrc: 'NA', professor: 'Prof. Lavoisier', carreraId: '1', semestreId: '3', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ED', asignatura: 'ECUACIONES DIFERENCIALES C1', nrc: 'NA', professor: 'Prof. Poincare', carreraId: '1', semestreId: '3', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_CAL3', asignatura: 'CÁLCULO III C1', nrc: 'NA', professor: 'Prof. Gauss', carreraId: '1', semestreId: '3', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_POO', asignatura: 'PROGRAMACIÓN ORIENTADA A OBJETOS C1', nrc: 'NA', professor: 'Prof. Kay', carreraId: '1', semestreId: '3', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_TMPA', asignatura: 'TÉC. Y MET. DE PROG. AVANZADA C1', nrc: 'NA', professor: 'Prof. Liskov', carreraId: '1', semestreId: '3', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_CE2', asignatura: 'COMUNICACIÓN EFECTIVA II C1', nrc: 'NA', professor: 'Prof. Orwell', carreraId: '1', semestreId: '3', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ELEC3', asignatura: 'ELECTIVO DISCIPLINAR III C1', nrc: 'NA', professor: 'Varios', carreraId: '1', semestreId: '3', periodoAcademicoId: DEFAULT_PERIODO_ID },

  // ICI Sem 4 - Carrera ID 1
  { id: 'ICI_PROEST', asignatura: 'PROBABILIDAD Y ESTADÍSTICA C1', nrc: 'NA', professor: 'Prof. Bayes', carreraId: '1', semestreId: '4', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_FISMOD', asignatura: 'FÍSICA MODERNA C1', nrc: 'NA', professor: 'Prof. Bohr', carreraId: '1', semestreId: '4', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ESTDAT', asignatura: 'ESTRUCTURAS DE DATOS C1', nrc: 'NA', professor: 'Prof. Wirth', carreraId: '1', semestreId: '4', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ARQCOMP', asignatura: 'ARQUITECTURA DE COMPUTADORES C1', nrc: 'NA', professor: 'Prof. Von Neumann', carreraId: '1', semestreId: '4', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_TERMOD', asignatura: 'TERMODINÁMICA C1', nrc: 'NA', professor: 'Prof. Carnot', carreraId: '1', semestreId: '4', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_ELEC4', asignatura: 'ELECTIVO DISCIPLINAR IV C1', nrc: 'NA', professor: 'Varios', carreraId: '1', semestreId: '4', periodoAcademicoId: DEFAULT_PERIODO_ID },

  // ICI Sem 5 - Carrera ID 1
  { id: 'ICI_METNUM', asignatura: 'MÉTODOS NUMÉRICOS C1', nrc: 'NA', professor: 'Prof. Runge', carreraId: '1', semestreId: '5', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_SISOP', asignatura: 'SISTEMAS OPERATIVOS C1', nrc: 'NA', professor: 'Prof. Tanenbaum', carreraId: '1', semestreId: '5', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_BD', asignatura: 'BASES DE DATOS C1', nrc: 'NA', professor: 'Dr. Codd', carreraId: '1', semestreId: '5', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_INGSOF1', asignatura: 'INGENIERÍA DE SOFTWARE I C1', nrc: 'NA', professor: 'Prof. Brooks', carreraId: '1', semestreId: '5', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_REDES', asignatura: 'REDES DE COMPUTADORES C1', nrc: 'NA', professor: 'Prof. Cerf', carreraId: '1', semestreId: '5', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'ICI_FORMEMP', asignatura: 'FORMACIÓN EMPRENDEDORA C1', nrc: 'NA', professor: 'Prof. Schumpeter', carreraId: '1', semestreId: '5', periodoAcademicoId: DEFAULT_PERIODO_ID },

  { id: 'PARALELO_CONFLICT_ID', asignatura: 'Materia Conflictiva C1', nrc: 'NA', professor: 'Prof. Caos', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'PARALELO_WARN_ID', asignatura: 'Materia con Advertencia C1', nrc: 'NA', professor: 'Prof. Cautela', carreraId: '1', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },

  { id: 'GEN_CAL1_IND', asignatura: 'CÁLCULO I (Industrial) C1', nrc: 'NA', professor: 'Dr. Newton', carreraId: '4', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
  { id: 'GEN_ALG_ITI', asignatura: 'ÁLGEBRA (Info Tech) C1', nrc: 'NA', professor: 'Prof. Euler', carreraId: '5', semestreId: '1', periodoAcademicoId: DEFAULT_PERIODO_ID },
];


export async function getParalelos(
  carreraId: string,
  semestreId: string,
  periodoAcademicoId: string
): Promise<Paralelo[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return allParalelosPool.filter(p =>
    p.carreraId === carreraId &&
    p.semestreId === semestreId &&
    p.periodoAcademicoId === periodoAcademicoId
  );
}

export interface CreateParaleloData {
  asignatura: string; // This will be the full name like "CÁLCULO I C2"
  professor: string | null;
  nrc: string;
  carreraId: string;
  semestreId: string;
  periodoAcademicoId: string;
}

export async function createParalelo(data: CreateParaleloData): Promise<{ success: boolean; paralelo?: Paralelo; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  try {
    // Check for duplicate NRC within the same periodoAcademicoId if NRC is not 'NA'
    if (data.nrc && data.nrc !== 'NA') {
        const existingNrc = allParalelosPool.find(p => p.nrc === data.nrc && p.periodoAcademicoId === data.periodoAcademicoId);
        if (existingNrc) {
            return { success: false, error: `El NRC '${data.nrc}' ya existe para la asignatura '${existingNrc.asignatura}' en este período académico.` };
        }
    }
    // Check for duplicate asignatura (name + section) within the same carrera, semestre, and periodo
    const existingAsignatura = allParalelosPool.find(p =>
        p.asignatura.trim().toLowerCase() === data.asignatura.trim().toLowerCase() &&
        p.carreraId === data.carreraId &&
        p.semestreId === data.semestreId &&
        p.periodoAcademicoId === data.periodoAcademicoId
    );
    if (existingAsignatura) {
        return { success: false, error: `La asignatura '${data.asignatura}' ya existe para esta carrera, semestre y período.`};
    }


    const newParalelo: Paralelo = {
      id: `paralelo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      asignatura: data.asignatura,
      professor: data.professor, // Already handles null
      nrc: data.nrc || 'NA',
      carreraId: data.carreraId,
      semestreId: data.semestreId,
      periodoAcademicoId: data.periodoAcademicoId,
    };
    allParalelosPool.push(newParalelo);
    return { success: true, paralelo: newParalelo };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido al crear paralelo' };
  }
}

/**
 * Asynchronously retrieves a list of Bloques Horario.
 */
export async function getBloquesHorario(): Promise<BloqueHorario[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return [
    { id: 'A', time: 'A (08:10 - 09:40)' },
    { id: 'B', time: 'B (09:55 - 11:25)' },
    { id: 'C', time: 'C (11:40 - 13:10)' },
    { id: 'D', time: 'D (14:30 - 16:00)' },
    { id: 'E', time: 'E (16:15 - 17:45)' },
    { id: 'F', time: 'F (18:00 - 19:30)' },
  ];
}

/**
 * Asynchronously retrieves a list of Salas.
 */
export async function getSalas(): Promise<Sala[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return [
    { id: '1', name: 'Sala A101' },
    { id: '2', name: 'Sala B203' },
    { id: '3', name: 'Laboratorio C01' },
    { id: '4', name: 'Auditorio Magno' },
  ];
}

/**
 * Asynchronously retrieves a list of Asignaciones Horario for a specific Periodo Academico.
 */
export async function getAsignacionesHorario(periodoAcademicoId: string): Promise<AsignacionHorario[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockAsignaciones.filter(a => a.periodoAcademicoId === periodoAcademicoId);
}


export async function assignParaleloToBloqueHorario(
  paraleloId: string,
  bloqueHorarioId: string,
  periodoAcademicoId: string,
  salaId: string,
  day: string
): Promise<AssignmentResult> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const currentParalelo = await getParaleloById(paraleloId); 

  if (!currentParalelo) {
     return { success: false, conflicts: ['Paralelo no encontrado.'] };
  }

  if (paraleloId === 'PARALELO_CONFLICT_ID') {
    return {
      success: false,
      conflicts: ['Profesor ya tiene clase asignada en este bloque.', 'Sala ocupada.'],
    };
  }

  const existingAssignmentInCell = mockAsignaciones.find(
    (a) =>
      a.periodoAcademicoId === periodoAcademicoId &&
      a.bloqueHorarioId === bloqueHorarioId &&
      a.day === day &&
      a.salaId === salaId
  );

  if (existingAssignmentInCell) {
     const sala = await getSalaById(salaId);
     const bloque = (await getBloquesHorario()).find(b => b.id === bloqueHorarioId);
     const existingParalelo = await getParaleloById(existingAssignmentInCell.paraleloId);
     return {
      success: false,
      conflicts: [`Conflicto de Sala: La sala ${sala?.name || salaId} ya está ocupada por ${existingParalelo?.asignatura || 'Asignatura desconocida'} (NRC ${existingParalelo?.nrc || 'NA'}) en ${day} ${bloque?.time || bloqueHorarioId}`],
    };
  }

  if (currentParalelo?.professor && currentParalelo.professor !== 'N/A' && currentParalelo.professor !== 'Varios') {
    const professorAssignmentsInPeriod = await Promise.all(mockAsignaciones
      .filter(a =>
        a.periodoAcademicoId === periodoAcademicoId &&
        a.day === day &&
        a.bloqueHorarioId === bloqueHorarioId &&
        a.paraleloId !== paraleloId
      )
      .map(async a => ({ ...a, paraleloDetails: await getParaleloById(a.paraleloId) }))
    );

    const professorConflict = professorAssignmentsInPeriod.find(
        a => a.paraleloDetails?.professor === currentParalelo.professor
    );

    if (professorConflict) {
      const bloque = (await getBloquesHorario()).find(b => b.id === bloqueHorarioId);
      return {
        success: false,
        conflicts: [`Conflicto de Profesor: ${currentParalelo.professor} ya tiene la asignatura ${professorConflict.paraleloDetails?.asignatura} (NRC ${professorConflict.paraleloDetails?.nrc || 'NA'}) asignada en ${day} ${bloque?.time || bloqueHorarioId}.`],
      };
    }
  }

  let warnings: string[] | undefined = undefined;
  if (paraleloId === 'PARALELO_WARN_ID') {
    warnings = ['Este paralelo excede el número recomendado de estudiantes para esta sala.', 'Profesor cerca de su límite de horas semanales.'];
  }

  const newAssignmentId = `asgn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const newAssignment: AsignacionHorario = {
    id: newAssignmentId,
    paraleloId,
    bloqueHorarioId,
    periodoAcademicoId,
    salaId,
    day,
  };
  mockAsignaciones.push(newAssignment);

  return {
    success: true,
    assignment: newAssignment,
    warnings: warnings,
  };
}

export async function deleteAsignacionHorario(id: string): Promise<DeletionResult> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockAsignaciones.findIndex((a) => a.id === id);
  if (index > -1) {
    mockAsignaciones.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: 'Asignación no encontrada.' };
}

export async function getParaleloById(id: string): Promise<Paralelo | undefined> {
    return allParalelosPool.find(p => p.id === id);
}

export async function getSalaById(id: string): Promise<Sala | undefined> {
    const salas = await getSalas();
    return salas.find(s => s.id === id);
}

export async function deleteParalelo(paraleloId: string): Promise<{success: boolean}> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const initialPoolSize = allParalelosPool.length;
  allParalelosPool = allParalelosPool.filter(p => p.id !== paraleloId);

  mockAsignaciones = mockAsignaciones.filter(a => a.paraleloId !== paraleloId);

  return { success: allParalelosPool.length < initialPoolSize };
}


export async function getBaseSubjects(carreraId: string, semestreId: string): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const baseSubjectSet = new Set<string>();
  allParalelosPool.forEach(p => {
    if (p.carreraId === carreraId && p.semestreId === semestreId) {
        const match = p.asignatura.match(/^(.*?)\sC\d+$/); // Extracts "Subject Name" from "Subject Name C1"
        if (match && match[1]) {
            baseSubjectSet.add(match[1]);
        } else {
            // If it doesn't match " C_number", it might be a subject like "Electivo"
            baseSubjectSet.add(p.asignatura);
        }
    }
  });
  return Array.from(baseSubjectSet).sort();
}

export async function getAllProfessors(): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const professorSet = new Set<string>();
  allParalelosPool.forEach(p => {
    if (p.professor && p.professor !== 'N/A' && p.professor !== 'Varios') {
      professorSet.add(p.professor);
    }
  });
  return Array.from(professorSet).sort();
}
