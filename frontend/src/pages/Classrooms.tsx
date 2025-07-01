import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, Users, MapPin, Calendar, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Tipos de datos según la estructura real de la API
interface Carrera {
  id: number;
  name: string;
  code: string;
}

interface Semestre {
  id: number;
  numero: number;
  carreraId: number;
  carrera: Carrera;
}

interface Asignatura {
  id: number;
  code: string;
  name: string;
  semestreId: number;
  demand: number;
  suggestedRoom: string;
  isLocked: boolean;
  isPreAssigned: boolean;
  semestre: Semestre;
}

interface TipoParalelo {
  id: number;
  nombre: string;
}

interface Profesor {
  id: number;
  rut: string;
  name: string;
  courseOffer: string[];
  isAvailable: boolean;
  maxSectionsPerWeek: number;
  availability: any[];
  institutionalEmail: string;
  phone: string | null;
}

interface Paralelo {
  id: number;
  nombre: string;
  asignaturaId: number;
  tipoParaleloId: number;
  profesorId: number;
  nrc: string | null;
  capacidadEstimada: number;
  asignatura: Asignatura;
  tipoParalelo: TipoParalelo;
  profesor: Profesor;
}

interface Sala {
  id: number;
  nombre: string;
  capacidad: number;
  sede: string;
}

interface BloqueHorario {
  id: number;
  dia: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
}

interface PeriodoAcademico {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  codigoBanner: string;
}

interface AsignacionHorario {
  id: number;
  paraleloId: number;
  salaId: number;
  bloqueHorarioId: number;
  periodoAcademicoId: number;
  paralelo: Paralelo;
  sala: Sala;
  bloqueHorario: BloqueHorario;
  periodoAcademico: PeriodoAcademico;
}

const API_BASE_URL = "http://localhost:3000";

// Componente principal
export default function Classrooms() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionHorario[]>([]);
  const [filteredSalas, setFilteredSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [sedeFilter, setSedeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Modal
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAsignaciones, setModalAsignaciones] = useState<AsignacionHorario[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cargar salas
        const salasResponse = await fetch(`${API_BASE_URL}/salas`);
        if (!salasResponse.ok) {
          throw new Error("Error al cargar las salas");
        }
        const salasData = await salasResponse.json();
        setSalas(salasData);
        
        // Cargar asignaciones
        const asignacionesResponse = await fetch(`${API_BASE_URL}/asignaciones-horario`);
        if (!asignacionesResponse.ok) {
          throw new Error("Error al cargar las asignaciones");
        }
        const asignacionesData = await asignacionesResponse.json();
        setAsignaciones(asignacionesData);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar salas
  useEffect(() => {
    let filtered = salas;
    
    // Filtrar por sede
    if (sedeFilter !== "all") {
      filtered = filtered.filter(sala => sala.sede === sedeFilter);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(sala =>
        sala.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredSalas(filtered);
  }, [salas, sedeFilter, searchTerm]);

  // Obtener estadísticas
  const totalSalas = salas.length;
  const salasOcupadas = new Set(asignaciones.map(a => a.sala.id)).size;
  const utilizacionPromedio = totalSalas > 0 ? ((salasOcupadas / totalSalas) * 100).toFixed(1) : "0";

  // Obtener asignaciones por sala
  const getAsignacionesPorSala = (salaId: number) => {
    return asignaciones.filter(asignacion => asignacion.sala.id === salaId);
  };

  // Obtener sedes únicas
  const sedes = Array.from(new Set(salas.map(sala => sala.sede))).sort();

  // Abrir modal con horario detallado de una sala
  const openSalaModal = (sala: Sala) => {
    setSelectedSala(sala);
    const asignacionesSala = getAsignacionesPorSala(sala.id);
    setModalAsignaciones(asignacionesSala);
    setIsModalOpen(true);
  };

  // Componente del modal con grilla de horario
  const SalaScheduleModal = () => {
    if (!selectedSala) return null;

    const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
    const bloques = ["A", "B", "C", "D", "E", "F"];

    const getAsignacionForDayAndBlock = (dia: string, bloqueNombre: string) => {
      return modalAsignaciones.find(asignacion => 
        asignacion.bloqueHorario.dia === dia && asignacion.bloqueHorario.nombre === bloqueNombre
      );
    };

    // Función para formatear la hora
    const formatTime = (timeString: string) => {
      const date = new Date(timeString);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
      });
    };

    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Horario de {selectedSala.nombre}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Capacidad: {selectedSala.capacidad}
              </span>
              <span className="flex items-center gap-1">
                <Badge variant="secondary">{selectedSala.sede}</Badge>
              </span>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1 text-sm">
              {/* Header */}
              <div className="font-semibold p-2 text-center bg-gray-100 rounded">
                Bloque/Día
              </div>
              {dias.map(dia => (
                <div key={dia} className="font-semibold p-2 text-center bg-gray-100 rounded">
                  {dia.charAt(0) + dia.slice(1).toLowerCase()}
                </div>
              ))}
              
              {/* Filas de bloques */}
              {bloques.map(bloque => {
                // Obtener las horas del primer bloque encontrado para mostrar en el header
                const primeraAsignacionDelBloque = modalAsignaciones.find(a => a.bloqueHorario.nombre === bloque);
                const horasBloque = primeraAsignacionDelBloque 
                  ? `${formatTime(primeraAsignacionDelBloque.bloqueHorario.horaInicio)}-${formatTime(primeraAsignacionDelBloque.bloqueHorario.horaFin)}`
                  : '';
                
                return (
                  <div key={bloque} className="contents">
                    <div className="font-medium p-2 text-center bg-gray-50 rounded text-xs">
                      <div className="font-semibold">{bloque}</div>
                      {horasBloque && (
                        <div className="text-gray-600 mt-1">{horasBloque}</div>
                      )}
                    </div>
                    {dias.map(dia => {
                      const asignacion = getAsignacionForDayAndBlock(dia, bloque);
                      return (
                        <div key={`${dia}-${bloque}`} className="p-1 min-h-[80px] border rounded">
                          {asignacion ? (
                            <div className="bg-blue-50 p-2 rounded text-xs h-full">
                              <div className="font-semibold text-blue-900 mb-1">
                                {asignacion.paralelo.asignatura?.code || 'Sin código'}
                              </div>
                              <div className="text-blue-800 mb-1 font-medium">
                                {asignacion.paralelo.asignatura?.name || 'Asignatura no cargada'}
                              </div>
                              <div className="text-blue-700 mb-1">
                                {asignacion.paralelo.tipoParalelo?.nombre || 'Tipo'}: {asignacion.paralelo.nombre}
                              </div>
                              <div className="text-blue-600 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate">
                                  {asignacion.paralelo.profesor?.name || 'Sin profesor'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-center py-4">
                              Libre
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando aulas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Aulas</h1>
        <p className="text-gray-600">
          Visualiza el uso y disponibilidad de las aulas del campus
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Aulas</p>
              <p className="text-2xl font-bold text-gray-900">{totalSalas}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aulas Ocupadas</p>
              <p className="text-2xl font-bold text-green-600">{salasOcupadas}</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilización</p>
              <p className="text-2xl font-bold text-purple-600">{utilizacionPromedio}%</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar aula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <Select value={sedeFilter} onValueChange={setSedeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sedes</SelectItem>
                {sedes.map(sede => (
                  <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid de aulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSalas.map(sala => {
          const asignacionesSala = getAsignacionesPorSala(sala.id);
          const clasesAsignadas = asignacionesSala.length;
          const ocupacionPorcentaje = clasesAsignadas > 0 ? Math.round((clasesAsignadas / 36) * 100) : 0; // 36 = 6 bloques × 6 días
          
          return (
            <div 
              key={sala.id} 
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all duration-200"
              onClick={() => openSalaModal(sala)}
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sala.nombre}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {sala.sede} • Capacidad: {sala.capacidad || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={ocupacionPorcentaje === 0 ? "secondary" : "default"}
                    className={ocupacionPorcentaje === 0 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                    }
                  >
                    {ocupacionPorcentaje}% ocupado
                  </Badge>
                </div>
              </div>

              {/* Sección de clases asignadas */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Clases Asignadas:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {asignacionesSala.length > 0 ? (
                    asignacionesSala.slice(0, 6).map((asignacion, index) => (
                      <div
                        key={asignacion.id}
                        className="p-2 rounded border border-gray-200 text-xs bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">
                          {asignacion.paralelo.asignatura?.name || 'Asignatura no cargada'}
                        </div>
                        <div className="text-gray-600">
                          {asignacion.paralelo.asignatura?.code || 'Sin código'} - {asignacion.paralelo.nombre} | {asignacion.paralelo.asignatura?.semestre?.carrera?.name || 'Sin carrera'} S{asignacion.paralelo.asignatura?.semestre?.numero || '?'}
                        </div>
                        <div className="text-gray-500">
                          {asignacion.bloqueHorario.dia.charAt(0) + asignacion.bloqueHorario.dia.slice(1).toLowerCase()} {asignacion.bloqueHorario.nombre} • Prof: {asignacion.paralelo.profesor?.name || 'Sin asignar'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No hay clases asignadas
                    </div>
                  )}
                  {asignacionesSala.length > 6 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{asignacionesSala.length - 6} clases más...
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredSalas.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron aulas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Intenta cambiar los filtros de búsqueda.
          </p>
        </div>
      )}

      {/* Modal de horario detallado */}
      <SalaScheduleModal />
    </div>
  );
}