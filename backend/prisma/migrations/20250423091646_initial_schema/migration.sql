-- CreateTable
CREATE TABLE "Carrera" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semestre" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "carrera_id" INTEGER NOT NULL,

    CONSTRAINT "Semestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignatura" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "semestre_id" INTEGER NOT NULL,

    CONSTRAINT "Asignatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profesor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_contrato" TEXT NOT NULL,

    CONSTRAINT "Profesor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sala" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueHorario" (
    "id" SERIAL NOT NULL,
    "dia" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloqueHorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfesorBloqueDisponible" (
    "id" SERIAL NOT NULL,
    "profesor_id" INTEGER NOT NULL,
    "bloque_horario_id" INTEGER NOT NULL,

    CONSTRAINT "ProfesorBloqueDisponible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoParalelo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "TipoParalelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paralelo" (
    "id" SERIAL NOT NULL,
    "asignatura_id" INTEGER NOT NULL,
    "tipo_paralelo_id" INTEGER NOT NULL,
    "profesor_id" INTEGER,
    "nrc" TEXT NOT NULL,
    "capacidad_estimada" INTEGER,

    CONSTRAINT "Paralelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionHorario" (
    "id" SERIAL NOT NULL,
    "paralelo_id" INTEGER NOT NULL,
    "sala_id" INTEGER NOT NULL,
    "bloque_horario_id" INTEGER NOT NULL,
    "periodo_academico_id" INTEGER NOT NULL,

    CONSTRAINT "AsignacionHorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoAcademico" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodoAcademico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_nombre_key" ON "Carrera"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Semestre_carrera_id_numero_key" ON "Semestre"("carrera_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Asignatura_codigo_key" ON "Asignatura"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Sala_nombre_key" ON "Sala"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "BloqueHorario_dia_nombre_key" ON "BloqueHorario"("dia", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ProfesorBloqueDisponible_profesor_id_bloque_horario_id_key" ON "ProfesorBloqueDisponible"("profesor_id", "bloque_horario_id");

-- CreateIndex
CREATE UNIQUE INDEX "TipoParalelo_nombre_key" ON "TipoParalelo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Paralelo_nrc_key" ON "Paralelo"("nrc");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionHorario_paralelo_id_sala_id_bloque_horario_id_per_key" ON "AsignacionHorario"("paralelo_id", "sala_id", "bloque_horario_id", "periodo_academico_id");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoAcademico_nombre_key" ON "PeriodoAcademico"("nombre");

-- AddForeignKey
ALTER TABLE "Semestre" ADD CONSTRAINT "Semestre_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "Carrera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignatura" ADD CONSTRAINT "Asignatura_semestre_id_fkey" FOREIGN KEY ("semestre_id") REFERENCES "Semestre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfesorBloqueDisponible" ADD CONSTRAINT "ProfesorBloqueDisponible_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "Profesor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfesorBloqueDisponible" ADD CONSTRAINT "ProfesorBloqueDisponible_bloque_horario_id_fkey" FOREIGN KEY ("bloque_horario_id") REFERENCES "BloqueHorario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paralelo" ADD CONSTRAINT "Paralelo_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paralelo" ADD CONSTRAINT "Paralelo_tipo_paralelo_id_fkey" FOREIGN KEY ("tipo_paralelo_id") REFERENCES "TipoParalelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paralelo" ADD CONSTRAINT "Paralelo_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "Profesor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionHorario" ADD CONSTRAINT "AsignacionHorario_paralelo_id_fkey" FOREIGN KEY ("paralelo_id") REFERENCES "Paralelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionHorario" ADD CONSTRAINT "AsignacionHorario_sala_id_fkey" FOREIGN KEY ("sala_id") REFERENCES "Sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionHorario" ADD CONSTRAINT "AsignacionHorario_bloque_horario_id_fkey" FOREIGN KEY ("bloque_horario_id") REFERENCES "BloqueHorario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionHorario" ADD CONSTRAINT "AsignacionHorario_periodo_academico_id_fkey" FOREIGN KEY ("periodo_academico_id") REFERENCES "PeriodoAcademico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
