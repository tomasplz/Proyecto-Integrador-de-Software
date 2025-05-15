
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import ParalelosList from '@/components/scheduler/ParalelosList';
import ScheduleGrid from '@/components/scheduler/ScheduleGrid';
import SemesterSelector from '@/components/scheduler/SemesterSelector';
import CreateParaleloDialog from '@/components/scheduler/CreateParaleloDialog';
import type {
  Carrera,
  PeriodoAcademico,
  Semestre,
  Paralelo,
  BloqueHorario,
  Sala,
  AsignacionHorario,
  AssignmentResult,
  CreateParaleloData,
} from '@/services/scheduler';
import {
  getCarreras,
  getPeriodosAcademicos,
  getSemestres,
  getParalelos,
  getBloquesHorario,
  getSalas,
  getAsignacionesHorario,
  assignParaleloToBloqueHorario,
  deleteAsignacionHorario,
  getParaleloById,
  getSalaById,
  deleteParalelo,
  createParalelo,
  getBaseSubjects, // New import
  getAllProfessors, // New import
} from '@/services/scheduler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

type AsignacionHorarioConDetalles = AsignacionHorario & { paraleloDetails?: Paralelo, salaDetails?: Sala };

interface CreateParaleloDialogData {
  baseSubject: string;
  section: string;
  professor: string | null;
  nrc: string;
}

interface SalaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (salaId: string) => void;
  salas: Sala[];
}

const SalaSelectionModal: React.FC<SalaSelectionModalProps> = ({ isOpen, onClose, onConfirm, salas }) => {
  const [selectedSala, setSelectedSala] = useState<string>('');

  useEffect(() => {
    if (isOpen && salas.length > 0 && !selectedSala) {
      setSelectedSala(salas[0].id);
    }
    if (!isOpen) {
        setSelectedSala('');
    }
  }, [isOpen, salas, selectedSala]);

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {if (!open) onClose();}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Seleccionar Sala</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor, seleccione una sala para esta asignación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <Select value={selectedSala} onValueChange={setSelectedSala}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una sala" />
            </SelectTrigger>
            <SelectContent>
              {salas.map((sala) => (
                <SelectItem key={sala.id} value={sala.id}>
                  {sala.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(selectedSala)} disabled={!selectedSala}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export default function SchedulerPage() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [paralelos, setParalelos] = useState<Paralelo[]>([]);
  const [bloquesHorario, setBloquesHorario] = useState<BloqueHorario[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionHorarioConDetalles[]>([]);
  const [displayedAsignaciones, setDisplayedAsignaciones] = useState<AsignacionHorarioConDetalles[]>([]);

  const [selectedCarrera, setSelectedCarrera] = useState<string>('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('');
  const [selectedSemestre, setSelectedSemestre] = useState<string>('');
  const [dispersionCount, setDispersionCount] = useState<string>('1');

  const [isLoading, setIsLoading] = useState({
    filters: true,
    paralelos: false,
    grid: true,
  });

  const { toast } = useToast();

  const [salaModalOpen, setSalaModalOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    paraleloId: string;
    bloqueHorarioId: string;
    day: string;
  } | null>(null);

  const [isCreateParaleloDialogOpen, setIsCreateParaleloDialogOpen] = useState(false);
  const [baseSubjectsForDialog, setBaseSubjectsForDialog] = useState<string[]>([]);
  const [professorsForDialog, setProfessorsForDialog] = useState<string[]>([]);
  const [isLoadingDialogData, setIsLoadingDialogData] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(prev => ({ ...prev, filters: true }));
        const [carrerasData, periodosData, semestresData, bloquesData, salasData] = await Promise.all([
          getCarreras(),
          getPeriodosAcademicos(),
          getSemestres(),
          getBloquesHorario(),
          getSalas(),
        ]);
        setCarreras(carrerasData);
        setPeriodos(periodosData);
        setSemestres(semestresData);
        setBloquesHorario(bloquesData);
        setSalas(salasData);

        if (carrerasData.length > 0 && !selectedCarrera) setSelectedCarrera(carrerasData[0].id);
        if (periodosData.length > 0 && !selectedPeriodo) setSelectedPeriodo(periodosData[0].id);
        if (semestresData.length > 0 && !selectedSemestre) {
          const defaultSem = semestresData.find(s => s.id === '1') || semestresData[0];
          setSelectedSemestre(defaultSem.id);
        }

      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar los filtros iniciales.', variant: 'destructive' });
      } finally {
        setIsLoading(prev => ({ ...prev, filters: false }));
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Fetch base subjects for dialog when career/semester changes
  useEffect(() => {
    if (selectedCarrera && selectedSemestre) {
      setIsLoadingDialogData(true);
      getBaseSubjects(selectedCarrera, selectedSemestre)
        .then(setBaseSubjectsForDialog)
        .catch(() => toast({ title: 'Error', description: 'No se pudieron cargar las materias base para el diálogo.', variant: 'destructive' }))
        .finally(() => setIsLoadingDialogData(false));
    } else {
      setBaseSubjectsForDialog([]);
    }
  }, [selectedCarrera, selectedSemestre, toast]);

  // Fetch all professors for dialog once
  useEffect(() => {
    setIsLoadingDialogData(true);
    getAllProfessors()
      .then(setProfessorsForDialog)
      .catch(() => toast({ title: 'Error', description: 'No se pudieron cargar los profesores para el diálogo.', variant: 'destructive' }))
      .finally(() => setIsLoadingDialogData(false));
  }, [toast]);


  const fetchParalelosForList = useCallback(async () => {
    if (selectedCarrera && selectedSemestre && selectedPeriodo) {
      try {
        setIsLoading(prev => ({ ...prev, paralelos: true }));
        const allPossibleParalelos = await getParalelos(selectedCarrera, selectedSemestre, selectedPeriodo);
        const assignedParaleloIdsInPeriod = new Set(
          asignaciones
            .filter(a => a.periodoAcademicoId === selectedPeriodo) // ensure we check against assignments in the current period
            .map(a => a.paraleloId)
        );
        const availableParalelos = allPossibleParalelos.filter(p => !assignedParaleloIdsInPeriod.has(p.id));
        setParalelos(availableParalelos);
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron cargar los paralelos para la lista.', variant: 'destructive' });
        setParalelos([]);
      } finally {
        setIsLoading(prev => ({ ...prev, paralelos: false }));
      }
    } else {
      setParalelos([]);
    }
  }, [selectedCarrera, selectedSemestre, selectedPeriodo, asignaciones, toast]);


  const fetchAsignacionesDetalladas = useCallback(async (periodoIdToFetch: string) => {
    if (!periodoIdToFetch) {
      setAsignaciones([]);
      setIsLoading(prev => ({ ...prev, grid: false }));
      return;
    }
    setIsLoading(prev => ({ ...prev, grid: true }));
    try {
      const asignacionesBase = await getAsignacionesHorario(periodoIdToFetch);
      const asignacionesConDetallesPromises = asignacionesBase.map(async (asig) => {
        const [paraleloDetails, salaDetails] = await Promise.all([
          getParaleloById(asig.paraleloId),
          getSalaById(asig.salaId),
        ]);
        return { ...asig, paraleloDetails, salaDetails };
      });
      const resolvedAsignacionesConDetalles = (await Promise.all(asignacionesConDetallesPromises))
                                              .filter(a => a.paraleloDetails && a.paraleloDetails.periodoAcademicoId === periodoIdToFetch);
      setAsignaciones(resolvedAsignacionesConDetalles);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las asignaciones del horario.', variant: 'destructive' });
      setAsignaciones([]);
    } finally {
      setIsLoading(prev => ({ ...prev, grid: false }));
    }
  }, [toast]);

  useEffect(() => {
    if (selectedPeriodo) {
      fetchAsignacionesDetalladas(selectedPeriodo);
    } else {
      setAsignaciones([]); // Clear assignments if no period is selected
    }
  }, [selectedPeriodo, fetchAsignacionesDetalladas]);

  useEffect(() => {
    fetchParalelosForList();
  }, [fetchParalelosForList, asignaciones]); // Re-run when asignaciones changes


  useEffect(() => {
    const updateDisplayedAssignments = async () => {
      if (!selectedSemestre || !selectedCarrera || !selectedPeriodo) {
        setDisplayedAsignaciones(isLoading.grid ? [] : asignaciones.filter(a => a.paraleloDetails?.nrc === 'FORCE_EMPTY_IF_NO_SELECTION'));
        return;
      }
      if (isLoading.grid) {
          setDisplayedAsignaciones([]);
          return;
      }

      const dispersionNum = parseInt(dispersionCount) || 0; // Default to 0 if invalid
      const currentSemestreNum = parseInt(selectedSemestre);
      if (isNaN(currentSemestreNum)) {
        setDisplayedAsignaciones([]);
        return;
      }

      const startSem = Math.max(1, currentSemestreNum - dispersionNum);
      const endSem = Math.min(semestres.length > 0 ? parseInt(semestres[semestres.length - 1].id) : 10, currentSemestreNum + dispersionNum); // Use actual max semester ID

      const relevantParaleloIdsForGrid = new Set<string>();

      try {
        const paraleloPromises: Promise<Paralelo[]>[] = [];
        for (let i = startSem; i <= endSem; i++) {
            paraleloPromises.push(getParalelos(selectedCarrera, i.toString(), selectedPeriodo));
        }
        const results = await Promise.all(paraleloPromises);
        results.flat().forEach(p => relevantParaleloIdsForGrid.add(p.id));


        const filteredForGrid = asignaciones.filter(asig =>
          asig.paraleloDetails && relevantParaleloIdsForGrid.has(asig.paraleloId) && asig.periodoAcademicoId === selectedPeriodo
        );
        setDisplayedAsignaciones(filteredForGrid);
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudieron obtener los paralelos para la dispersión de la grilla.', variant: 'destructive' });
        setDisplayedAsignaciones([]);
      }
    };

    updateDisplayedAssignments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asignaciones, selectedSemestre, dispersionCount, selectedCarrera, selectedPeriodo, semestres, isLoading.grid, toast]);


  const handleDropParalelo = useCallback((paraleloId: string, bloqueHorarioId: string, day: string) => {
    if (!selectedPeriodo) {
      toast({ title: 'Error', description: 'Seleccione un periodo académico.', variant: 'destructive' });
      return;
    }
    if (salas.length === 0) {
      toast({ title: 'Error', description: 'No hay salas disponibles. Configure las salas primero.', variant: 'destructive' });
      return;
    }
    setPendingAssignment({ paraleloId, bloqueHorarioId, day });
    setSalaModalOpen(true);
  }, [selectedPeriodo, toast, salas]);

  const confirmSalaAssignment = useCallback(async (salaId: string) => {
    if (!pendingAssignment || !selectedPeriodo || !salaId) {
        toast({ title: 'Error', description: 'Información de asignación incompleta o sala no seleccionada.', variant: 'destructive' });
        setSalaModalOpen(false);
        setPendingAssignment(null);
        return;
    }

    const { paraleloId, bloqueHorarioId, day } = pendingAssignment;
    setSalaModalOpen(false);

    try {
      const result: AssignmentResult = await assignParaleloToBloqueHorario(
        paraleloId,
        bloqueHorarioId,
        selectedPeriodo,
        salaId,
        day
      );

      if (result.success && result.assignment) {
        toast({
          title: 'Éxito',
          description: 'Paralelo asignado correctamente.',
          className: 'bg-green-500 text-white',
          icon: <CheckCircle2 className="h-5 w-5" />
        });
        if (result.warnings && result.warnings.length > 0) {
          toast({
            title: 'Advertencias',
            description: ( <ul className="list-disc list-inside"> {result.warnings.map((warn, i) => <li key={i}>{warn}</li>)} </ul> ),
            variant: 'default', duration: 7000, className: 'bg-yellow-400 text-black', icon: <AlertCircle className="h-5 w-5" />
          });
        }
        await fetchAsignacionesDetalladas(selectedPeriodo); 
      } else if (result.conflicts && result.conflicts.length > 0) {
         toast({
          title: 'Conflicto de Horario',
          description: ( <ul className="list-disc list-inside"> {result.conflicts.map((conflict, i) => <li key={i}>{conflict}</li>)} </ul> ),
          variant: 'destructive', duration: 10000,
        });
      } else {
        toast({ title: 'Error de Asignación', description: result.conflicts?.[0] || 'No se pudo asignar el paralelo.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error Inesperado', description: `Error de comunicación: ${error instanceof Error ? error.message : String(error)}`, variant: 'destructive' });
    } finally {
      setPendingAssignment(null);
    }
  }, [pendingAssignment, selectedPeriodo, toast, fetchAsignacionesDetalladas]);

  const handleRemoveAssignment = useCallback(async (assignmentId: string) => {
    try {
      const result = await deleteAsignacionHorario(assignmentId);
      if (result.success) {
        toast({ title: 'Éxito', description: 'Asignación eliminada.', className: 'bg-green-500 text-white', icon: <CheckCircle2 className="h-5 w-5" /> });
        await fetchAsignacionesDetalladas(selectedPeriodo);
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo eliminar la asignación.', variant: 'destructive' });
      }
    } catch (error) {
       toast({ title: 'Error', description: `Error de comunicación: ${error instanceof Error ? error.message : String(error)}`, variant: 'destructive' });
    }
  }, [toast, selectedPeriodo, fetchAsignacionesDetalladas]);

  const handleDeleteParaleloFromList = useCallback(async (paraleloId: string) => {
    try {
        const result = await deleteParalelo(paraleloId);
        if (result.success) {
            toast({ title: 'Éxito', description: 'Paralelo eliminado de la lista y sus asignaciones.', className: 'bg-green-500 text-white', icon: <CheckCircle2 className="h-5 w-5" />});
            await fetchParalelosForList(); 
            await fetchAsignacionesDetalladas(selectedPeriodo); 
        } else {
            toast({ title: 'Error', description: 'No se pudo eliminar el paralelo.', variant: 'destructive' });
        }
    } catch (error) {
        toast({ title: 'Error', description: `Error de comunicación al eliminar paralelo: ${error instanceof Error ? error.message : String(error)}`, variant: 'destructive' });
    }
  }, [toast, selectedPeriodo, fetchParalelosForList, fetchAsignacionesDetalladas]);

  const handleOpenCreateParaleloDialog = () => {
    if (!selectedCarrera || !selectedSemestre || !selectedPeriodo) {
      toast({ title: 'Información Incompleta', description: 'Por favor, seleccione Carrera, Periodo y Semestre antes de crear un paralelo.', variant: 'destructive' });
      return;
    }
    setIsCreateParaleloDialogOpen(true);
  };

  const handleCreateParalelo = async (data: CreateParaleloDialogData) => {
    if (!selectedCarrera || !selectedSemestre || !selectedPeriodo) {
      toast({ title: 'Error', description: 'Faltan selecciones de Carrera, Semestre o Periodo.', variant: 'destructive' });
      return;
    }
    try {
      const fullAsignaturaName = `${data.baseSubject} ${data.section}`;
      const newParaleloData: CreateParaleloData = {
        asignatura: fullAsignaturaName,
        professor: data.professor,
        nrc: data.nrc || 'NA', // Already handled in dialog, but good to ensure
        carreraId: selectedCarrera,
        semestreId: selectedSemestre,
        periodoAcademicoId: selectedPeriodo,
      };
      const result = await createParalelo(newParaleloData);
      if (result.success && result.paralelo) {
        toast({ title: 'Éxito', description: `Paralelo "${result.paralelo.asignatura}" creado.`, className: 'bg-green-500 text-white', icon: <CheckCircle2 /> });
        await fetchParalelosForList(); 
        setIsCreateParaleloDialogOpen(false);
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo crear el paralelo.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error Inesperado', description: `Error al crear paralelo: ${error instanceof Error ? error.message : String(error)}`, variant: 'destructive' });
    }
  };


  const isLoadingFilters = isLoading.filters;
  const isLoadingGridData = isLoading.grid;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            Configuración del Horario
          </CardTitle>
          <CardDescription>
            Seleccione los filtros para visualizar y editar el horario académico.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {isLoadingFilters ? (
            <> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> </>
          ) : (
          <>
          <div className="space-y-1.5">
            <Label htmlFor="carrera">Carrera</Label>
            <Select value={selectedCarrera} onValueChange={setSelectedCarrera} disabled={carreras.length === 0}>
              <SelectTrigger id="carrera"><SelectValue placeholder="Seleccione Carrera" /></SelectTrigger>
              <SelectContent>
                {carreras.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="periodo">Periodo Académico</Label>
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo} disabled={periodos.length === 0}>
              <SelectTrigger id="periodo"><SelectValue placeholder="Seleccione Periodo" /></SelectTrigger>
              <SelectContent>
                {periodos.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dispersion">Semestres de Dispersión</Label>
            <Input
              id="dispersion" type="number" value={dispersionCount}
              onChange={(e) => setDispersionCount(e.target.value.replace(/[^0-5]/g, ''))} // Allow only 0-5
              min="0" max="5" placeholder="Ej: 1"
            />
          </div>
          </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule Grid and Semester Selector */}
        <div className="lg:col-span-2 flex flex-col">
          <ScheduleGrid
            bloquesHorario={bloquesHorario}
            asignaciones={displayedAsignaciones}
            onDropParalelo={handleDropParalelo}
            onRemoveAssignment={handleRemoveAssignment}
            isLoading={isLoadingGridData || isLoadingFilters}
          />
          {/* Semester Selector */}
          <SemesterSelector
            semestres={semestres}
            selectedSemestreId={selectedSemestre}
            onSelectSemester={setSelectedSemestre}
            isLoading={isLoadingFilters}
            className="mt-4"
          />
        </div>

        {/* Right Column: Paralelos List */}
        <div className="lg:col-span-1">
          <ParalelosList
            paralelos={paralelos}
            isLoading={isLoading.paralelos || isLoadingFilters}
            onDeleteParalelo={handleDeleteParaleloFromList}
            onCreateParalelo={handleOpenCreateParaleloDialog}
          />
        </div>
      </div>

       <SalaSelectionModal
        isOpen={salaModalOpen}
        onClose={() => { setSalaModalOpen(false); setPendingAssignment(null); }}
        onConfirm={confirmSalaAssignment}
        salas={salas}
      />
      <CreateParaleloDialog
        isOpen={isCreateParaleloDialogOpen}
        onClose={() => setIsCreateParaleloDialogOpen(false)}
        onSubmit={handleCreateParalelo}
        baseSubjects={baseSubjectsForDialog}
        professors={professorsForDialog}
        isLoadingData={isLoadingDialogData}
      />
    </div>
  );
}

