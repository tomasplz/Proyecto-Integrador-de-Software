      
import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

const dataInputDir = __dirname;

interface BloqueData {
    nombre: string;
    horario: string | null;
    minuto_inicio: number | null;
    minuto_termino: number | null;
}

async function seedBloqueHorario() {
    console.log('Seeding BloqueHorario...');
    try {
        const filePath = path.join(dataInputDir, 'bloques_data.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const bloquesData: BloqueData[] = JSON.parse(fileContent);
        const diasSemana = [
            'LUNES',
            'MARTES',
            'MIERCOLES',
            'JUEVES',
            'VIERNES',
            'SABADO'
        ];

        for (const dia of diasSemana) {
            for (const bloque of bloquesData) {
                if (!bloque.horario || bloque.nombre === 'SB') {
                    continue;
                }
                const [horaInicioStr, horaFinStr] = bloque.horario.split(' - ');
                if (!horaInicioStr || !horaFinStr) {
                    console.warn(`Could not parse horario string: "${bloque.horario}" for block ${bloque.nombre}. Skipping.`);
                    continue;
                }
                const [inicioH, inicioM] = horaInicioStr.split(':').map(Number);
                const [finH, finM] = horaFinStr.split(':').map(Number);

                if (isNaN(inicioH) || isNaN(inicioM) || isNaN(finH) || isNaN(finM)) {
                    console.warn(`Invalid time format in horario: "${bloque.horario}" for block ${bloque.nombre}. Skipping.`);
                    continue;
                }

                const fechaBase = new Date('2025-01-01T00:00:00.000Z');
                const horaInicioDate = new Date(fechaBase);
                horaInicioDate.setUTCHours(inicioH, inicioM, 0, 0);
                const horaFinDate = new Date(fechaBase);
                horaFinDate.setUTCHours(finH, finM, 0, 0);

                if (horaFinDate <= horaInicioDate) {
                    console.warn(`Hora de fin no es posterior a inicio para ${dia} - ${bloque.nombre}. Skipping.`);
                    continue;
                }

                try {
                    await prisma.bloqueHorario.upsert({
                        where: { dia_nombre: { dia: dia, nombre: bloque.nombre.toUpperCase() } },
                        update: { horaInicio: horaInicioDate, horaFin: horaFinDate },
                        create: {
                            dia: dia,
                            nombre: bloque.nombre.toUpperCase(),
                            horaInicio: horaInicioDate,
                            horaFin: horaFinDate,
                        },
                    });
                } catch (e: any) {
                    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') { // Correcto
                       console.log(`BloqueHorario: ${dia} - ${bloque.nombre.toUpperCase()} already exists. Skipping creation.`);
                   } else {
                       console.error(`Error upserting BloqueHorario ${dia} - ${bloque.nombre.toUpperCase()}:`, e);
                   }
               }
            }
        }
        console.log('BloqueHorario seeding finished.');
    } catch (error) {
        console.error('Error seeding BloqueHorario:', error);
        throw error;
    }
}

interface PeriodoAcademicoData {
    nombre: string;
    primer_lunes: string;
    ultimo_domingo: string;
    ultimo_dia_clases: string;
    semestre_banner: string;
}
async function seedPeriodoAcademico() {
    console.log('Seeding PeriodoAcademico...');
    const filePath = path.join(dataInputDir, 'semestres_data.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const periodosData: PeriodoAcademicoData[] = JSON.parse(fileContent);

    for (const periodo of periodosData) {
        try {
            const fechaInicio = new Date(periodo.primer_lunes + "T00:00:00.000Z"); // Asegurar que se interprete como UTC si la fecha no tiene hora
            const fechaFin = new Date(periodo.ultimo_domingo + "T23:59:59.999Z"); // Fin del día UTC

            if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
                console.warn(`Fechas inválidas para PeriodoAcademico '${periodo.nombre}'. Skipping.`);
                continue;
            }
            if (fechaFin < fechaInicio) {
                console.warn(`Para PeriodoAcademico '${periodo.nombre}', fechaFin es anterior a fechaInicio. Skipping.`);
                continue;
            }

            await prisma.periodoAcademico.upsert({
                where: { nombre: periodo.nombre }, // Asume que 'nombre' es único
                update: {
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    codigoBanner: periodo.semestre_banner,
                },
                create: {
                    nombre: periodo.nombre,
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    codigoBanner: periodo.semestre_banner
                },
            });
            // console.log(`Upserted PeriodoAcademico: ${periodo.nombre}`);
        } catch (e: any) {
            console.error(`Error procesando PeriodoAcademico ${periodo.nombre}:`, e.message);
        }
    }
    console.log('PeriodoAcademico seeding finished.');
}


async function seedTipoParalelo() {
    console.log('Seeding TipoParalelo...');
    const tipos = [
        { nombre: 'Catedra' },
        { nombre: 'Ayudantía' },
        { nombre: 'Laboratorio' },
        { nombre: 'Taller' }
    ];
    for (const tipo of tipos) {
        await prisma.tipoParalelo.upsert({
            where: { nombre: tipo.nombre },
            update: {},
            create: { nombre: tipo.nombre },
        });
    }
    console.log('TipoParalelo seeding finished.');
}


interface SalaData {
    nombre: string;
    capacidad?: number | null;
    sede: string;
}
async function seedSalas() {
    try {
        const filePath = path.join(dataInputDir, 'salas_data.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const salasData: SalaData[] = JSON.parse(fileContent);
            for (const sala of salasData) {
                await prisma.sala.upsert({
                    where: { nombre: sala.nombre },
                    update: { capacidad: sala.capacidad, sede: sala.sede },
                    create: { nombre: sala.nombre, capacidad: sala.capacidad, sede: sala.sede },
                });
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn("salas_data.json no encontrado. Saltando seed de Salas.");
            } else {
                console.error('Error seeding Salas:', error);
                throw error;
            }
        }
    console.log('Salas seeding skipped or finished.');
}

interface ProfesorData {
    rut: string;
    courseOffer: string[];
    name: string;
    institutionalEmail?: string;
    phone?: string;
    isAvailable: boolean;
    maxSectionsPerWeek: number;
    availability: string[];
}
async function seedProfesoresYDisponibilidad() {
    console.log('Seeding Profesores y su Disponibilidad...');
    const filePath = path.join(dataInputDir, 'profesores_data.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const profesoresData: ProfesorData[] = JSON.parse(fileContent);

    for (const profData of profesoresData) {
        if (!profData.rut || profData.rut.trim() === "") {
            console.warn(`Profesor con nombre "${profData.name}" no tiene RUT. Saltando...`);
            continue;
        }
        try {
            const profesor = await prisma.profesor.upsert({
                where: { rut: profData.rut },
                update: {
                },
                create: {
                    rut: profData.rut,
                    nombre: profData.name,
                },
            });

            if (profData.availability && profData.availability.length > 0) {
                for (const disponibilidadStr of profData.availability) {
                    console.log("Procesando disponibilidad de profesor:", profesor.nombre, "->", disponibilidadStr);
                    const parts = disponibilidadStr.split('-');
                    if (parts.length < 2) continue;
                    const dia = parts[0].trim().toUpperCase();
                    const nombreBloque = parts.slice(1).join('-').trim().toUpperCase();
                    const bloqueHorario = await prisma.bloqueHorario.findUnique({
                        where: { dia_nombre: { dia: dia, nombre: nombreBloque } },
                    });

                    if (bloqueHorario) {
                        await prisma.profesorBloqueDisponible.upsert({
                            where: { profesorId_bloqueHorarioId: { profesorId: profesor.id, bloqueHorarioId: bloqueHorario.id } },
                            update: {},
                            create: { profesorId: profesor.id, bloqueHorarioId: bloqueHorario.id }
                        });
                    } else {
                        console.warn(`BloqueHorario no encontrado para disponibilidad: ${dia} - ${nombreBloque} (Profesor ${profesor.nombre})`);
                    }
                }
            }
        } catch (e: any) {
             console.error(`Error procesando profesor con RUT ${profData.rut} (Nombre: ${profData.name}):`, e.message);
        }
    }
    console.log('Profesores y Disponibilidad seeding finished.');
}


interface DemandaData {
    key: string;
    period: string;
    career: string;
    demand: number;
    isLocked: boolean;
    isPreAssigned: boolean;
    lastUpdate: string;
    sectionSize: number;
    sectionsNumber: number;
    semester: number;
    suggestedRoom: string | null;
    code: string;
    name: string;
}

async function seedEntidadesDesdeDemanda() {
    console.log('Iniciando seed de Entidades desde Demanda (Carrera, Semestre, Asignatura, Paralelo)...');
    let itemsProcesadosConExito = 0;
    let itemsConFallo = 0;
    const itemsFallidosDetalles: { demandaKey: string; asignaturaCode: string; motivo: string; error?: any }[] = [];

    const filePath = path.join(dataInputDir, 'demanda_data.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const demandasData: DemandaData[] = JSON.parse(fileContent);

    // Mapeo de nombres de TipoParalelo a su prefijo para el nombre del Paralelo
    // Asegúrate que los nombres aquí ("Catedra", "Laboratorio", etc.) coincidan EXACTAMENTE
    // con los nombres en tu tabla TipoParalelo (sensible a mayúsculas/minúsculas).
    const tipoParaleloPrefijos: { [key: string]: string } = {
        "Catedra": "C",
        "Laboratorio": "L",
        "Ayudantía": "A",
        "Taller": "T",
    };

    const tipoParaleloDefectoNombre = "Catedra"; // Todos los paralelos de la demanda serán de este tipo
    const tipoParaleloDefecto = await prisma.tipoParalelo.findUnique({
        where: { nombre: tipoParaleloDefectoNombre }
    });

    if (!tipoParaleloDefecto) {
        const errorMsg = `TipoParalelo por defecto ('${tipoParaleloDefectoNombre}') no encontrado. Asegúrate de sembrarlo primero.`;
        console.error(errorMsg);
        itemsFallidosDetalles.push({ demandaKey: "N/A", asignaturaCode: "N/A", motivo: errorMsg });
        itemsConFallo++;
        console.log(`Finalizado seed de Entidades desde Demanda. Éxitos: ${itemsProcesadosConExito}, Fallos: ${itemsConFallo}`);
        if (itemsFallidosDetalles.length > 0) {
            console.log("\n--- Detalles de Items de Demanda Fallidos ---");
            itemsFallidosDetalles.forEach(fallo => {
                console.error(`Demanda Key: ${fallo.demandaKey}, Asignatura Code: ${fallo.asignaturaCode}, Motivo: ${fallo.motivo}`);
                if (fallo.error) console.error("  Error Detallado:", fallo.error);
            });
        }
        return;
    }

    const prefijoParaParalelosDeDemanda = tipoParaleloPrefijos[tipoParaleloDefecto.nombre];
    if (!prefijoParaParalelosDeDemanda) {
        const errorMsg = `Prefijo no definido para el TipoParalelo por defecto: '${tipoParaleloDefecto.nombre}'. Verifica el mapeo tipoParaleloPrefijos.`;
        console.error(errorMsg);
        itemsFallidosDetalles.push({ demandaKey: "N/A", asignaturaCode: "N/A", motivo: errorMsg });
        itemsConFallo++;
        console.log(`Finalizado seed de Entidades desde Demanda. Éxitos: ${itemsProcesadosConExito}, Fallos: ${itemsConFallo}`);
        if (itemsFallidosDetalles.length > 0) { /* ...código de impresión de errores... */ }
        return; // No podemos continuar si no podemos nombrar los paralelos.
    }

    for (const demanda of demandasData) {
        let operacionExitosaParaEsteItem = true;

        try {
            // 1. Encontrar PeriodoAcademico
            const periodoAcademico = await prisma.periodoAcademico.findUnique({
                where: { codigoBanner: demanda.period }
            });

            if (!periodoAcademico) {
                const motivoFallo = `PeriodoAcademico para banner '${demanda.period}' (demanda key: ${demanda.key}) NO ENCONTRADO.`;
                itemsFallidosDetalles.push({ demandaKey: demanda.key, asignaturaCode: demanda.code, motivo: motivoFallo });
                operacionExitosaParaEsteItem = false;
                continue;
            }

            // 2. Gestionar Carrera
            const carrera = await prisma.carrera.upsert({
                where: { nombre: demanda.career.trim().toUpperCase() },
                update: {},
                create: { nombre: demanda.career.trim().toUpperCase() },
            });

            // 3. Gestionar Semestre
            const semestre = await prisma.semestre.upsert({
                where: { carreraId_numero: { carreraId: carrera.id, numero: demanda.semester } },
                update: {},
                create: {
                    numero: demanda.semester,
                    carreraId: carrera.id,
                },
            });

            // 4. Gestionar Asignatura
            // Asume que tu schema Asignatura tiene @@unique([codigo, semestreId])
            // y el nombre del índice es 'codigo_semestreId' o el que hayas definido.
            // Ejecuta `prisma generate` después de cambiar el schema para que los tipos sean correctos.
            const asignatura = await prisma.asignatura.upsert({
                where: { codigo_semestreId: { codigo: demanda.code.trim(), semestreId: semestre.id } },
                update: { nombre: demanda.name.trim() },
                create: {
                    codigo: demanda.code.trim(),
                    nombre: demanda.name.trim(),
                    semestreId: semestre.id,
                },
            });

            // 5. Crear Paralelos con nombre generado
            if (demanda.sectionsNumber > 0) {
                for (let i = 0; i < demanda.sectionsNumber; i++) {
                    const numeroParalelo = i + 1; // Para C1, C2, C3...
                    const nombreParaleloGenerado = `${prefijoParaParalelosDeDemanda}${numeroParalelo}`;

                    // Asume que tu schema Paralelo tiene @@unique([asignaturaId, tipoParaleloId, nombre], name: "asignatura_tipo_nombre_paralelo_unico")
                    // Reemplaza "asignatura_tipo_nombre_paralelo_unico" con el nombre real de tu índice si es diferente.
                    await prisma.paralelo.upsert({
                        where: {
                                asignatura_tipo_nombre_paralelo_unico: {
                                asignaturaId: asignatura.id,
                                tipoParaleloId: tipoParaleloDefecto.id, // Todos son del tipo "Catedra" por defecto
                                nombre: nombreParaleloGenerado,
                            }
                        },
                        update: { // Campos que podrían actualizarse si el paralelo ya existe
                            capacidadEstimada: demanda.sectionSize,
                            // nrc: null, // Decide si el NRC debe actualizarse o re-generarse
                        },
                        create: {
                            nombre: nombreParaleloGenerado,
                            asignaturaId: asignatura.id,
                            tipoParaleloId: tipoParaleloDefecto.id, // Todos son del tipo "Catedra"
                            nrc: null, // O un placeholder si es necesario y es @unique NO nullable
                            capacidadEstimada: demanda.sectionSize,
                        },
                    });
                }
            }
        } catch (e: any) {
            const motivoFallo = `Excepción durante el procesamiento de demanda key ${demanda.key}.`;
            itemsFallidosDetalles.push({ demandaKey: demanda.key, asignaturaCode: demanda.code, motivo: motivoFallo, error: e });
            operacionExitosaParaEsteItem = false;
        } finally {
            if (operacionExitosaParaEsteItem) {
                itemsProcesadosConExito++;
            } else {
                itemsConFallo++;
            }
        }
    }

    console.log(`Finalizado seed de Entidades desde Demanda. Éxitos: ${itemsProcesadosConExito}, Fallos: ${itemsConFallo}`);
    if (itemsFallidosDetalles.length > 0) {
        console.log("\n--- Detalles de Items de Demanda Fallidos ---");
        itemsFallidosDetalles.forEach(fallo => {
            console.error(`Demanda Key: ${fallo.demandaKey}, Asignatura Code: ${fallo.asignaturaCode}, Motivo: ${fallo.motivo}`);
            if (fallo.error) {
                console.error("  Error Detallado:", fallo.error.message || fallo.error);
                if (fallo.error instanceof Prisma.PrismaClientKnownRequestError) {
                    console.error("  Prisma Error Code:", fallo.error.code);
                }
            }
        });
    }
}



// --- Función Principal del Seed ---
async function main() {
    console.log(`Start seeding ...`);

    await seedBloqueHorario();
    await seedPeriodoAcademico();
    await seedTipoParalelo();
    await seedSalas(); // Asegúrate que se implemente cuando tengas el JSON de salas
    await seedProfesoresYDisponibilidad();
    await seedEntidadesDesdeDemanda();

    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });