import { useState, useEffect, ChangeEvent } from "react";
import type { Course, ScheduledCourse, TimeSlotData, Teacher, Classroom } from "@/lib/types";
import coursesData from "@/lib/courses.json";
import classroomsData from "@/lib/classrooms.json";
import timeSlotsData from "@/lib/timeSlot.json";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Draggable } from "@/components/ui/draggable";
import { Droppable } from "@/components/ui/droppable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Users, Eye, EyeOff, Download, MapPin, GraduationCap, Check, Plus, Trash2, AlertTriangle, ChevronDown, ChevronUp, Bell, ExclamationTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import * as ExcelJS from 'exceljs';
import { useSedeContext } from "@/lib/sede-context";

interface TimeSlot {
  time: string;
  monday?: ScheduledCourse | null;
  tuesday?: ScheduledCourse | null;
  wednesday?: ScheduledCourse | null;
  thursday?: ScheduledCourse | null;
  friday?: ScheduledCourse | null;
  saturday?: ScheduledCourse | null;
}

interface ScheduleByCareerAndSemester {
  [careerAndSemester: string]: TimeSlot[];
}

const defaultTimeSlots: TimeSlot[] = (timeSlotsData as TimeSlotData[])
  .filter((slot) => slot.horario !== null)
  .map((slot) => ({ time: slot.horario! }));

// Crear mapeo de bloques desde timeSlot.json
const timeSlotMap = new Map((timeSlotsData as TimeSlotData[])
  .filter((slot) => slot.horario !== null)
  .map((slot) => [slot.horario!, slot]));

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

// Colores por prefijo de curso - Compatibles con modo oscuro
const colorsByPrefix = {
  ECIN: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
  DCCB: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  SSED: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  UNFP: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  UNFE: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
  DCTE: "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700",
  MNOR: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700",
  // Colores por defecto para otros prefijos
  default: "bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600",
};

// Función para obtener color por prefijo del curso
const getCourseColor = (courseCode: string) => {
  const prefix = courseCode.split("-")[0];
  return (
    colorsByPrefix[prefix as keyof typeof colorsByPrefix] ||
    colorsByPrefix.default
  );
};

// Funciones helper para la integración con la base de datos
const mapDayToSpanish = (dayKey: string): string => {
  const dayMap: Record<string, string> = {
    'monday': 'LUNES',
    'tuesday': 'MARTES', 
    'wednesday': 'MIERCOLES',
    'thursday': 'JUEVES',
    'friday': 'VIERNES',
    'saturday': 'SABADO'
  };
  return dayMap[dayKey] || dayKey.toUpperCase();
};

// Función para formatear el nombre de la sala con prefijo de sede
const formatRoomNameWithSede = (roomName: string, sede: 'coquimbo' | 'antofagasta'): string => {
  // Si ya tiene prefijo, retornarlo tal como está
  if (roomName.startsWith('CQB ') || roomName.startsWith('ANF ')) {
    return roomName;
  }
  
  // Agregar prefijo según la sede
  const prefix = sede === 'coquimbo' ? 'CQB ' : 'ANF ';
  return prefix + roomName;
};

export default function Schedule() {
  const { selectedSede } = useSedeContext();  // Cambiar de schedule único a schedules por carrera y semestre con persistencia
  const [schedulesByCareerAndSemester, setSchedulesByCareerAndSemester] =
    useState<ScheduleByCareerAndSemester>(() => {
      // Cargar datos del localStorage al inicializar
      const saved = localStorage.getItem("schedulesByCareerAndSemester");
      return saved ? JSON.parse(saved) : {};
    });
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{
    time: string;
    day: keyof Omit<TimeSlot, "time">;
  } | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  // Filtros
  const [selectedCareer, setSelectedCareer] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para controlar la visualización de semestres anteriores (onion layers)
  const [showPreviousSemesters, setShowPreviousSemesters] = useState<string[]>([
    "semestre-1",
    "semestre-2",
  ]);
  
  // Estados para controlar los popovers abiertos
  const [openRoomPopover, setOpenRoomPopover] = useState<string | null>(null);
  const [openTeacherPopover, setOpenTeacherPopover] = useState<string | null>(null);
  
  // Estado para controlar si mostrar todos los profesores o solo los disponibles
  const [showAllTeachers, setShowAllTeachers] = useState<{[key: string]: boolean}>({});

  // Estado para controlar la expansión de paralelos (vista detallada vs condensada)
  const [expandedCourses, setExpandedCourses] = useState<{[key: string]: boolean}>({});

  // Estado para controlar la creación de nuevos paralelos
  const [showCreateParaleloModal, setShowCreateParaleloModal] = useState(false);
  const [selectedCourseForParalelo, setSelectedCourseForParalelo] = useState<Course | null>(null);

  // Estados para manejar conflictos
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [showConflictDetails, setShowConflictDetails] = useState(false);
  const [lastConflictNotification, setLastConflictNotification] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Función para detectar conflictos en el horario actual
  const detectConflicts = (schedule: TimeSlot[]) => {
    const conflictList: string[] = [];
    
    // Agrupar TODAS las asignaciones de TODOS los horarios por día y tiempo
    const assignmentsByTimeAndDay = new Map<string, ScheduledCourse[]>();
    
    // Primero, agregar el horario que se está verificando
    const currentKey = getScheduleKey(selectedCareer, selectedSemester);
    schedule.forEach(slot => {
      dayKeys.forEach(day => {
        const course = slot[day] as ScheduledCourse | null;
        if (course && course.selectedTeacher && course.selectedRoom) {
          const key = `${slot.time}-${day}`;
          if (!assignmentsByTimeAndDay.has(key)) {
            assignmentsByTimeAndDay.set(key, []);
          }
          // Agregar información del semestre y carrera
          const courseWithInfo = {
            ...course,
            _scheduleInfo: `${selectedCareer?.split('-')[0] || selectedCareer} - Semestre ${selectedSemester}`,
            name: course.name || cursosCache[course.key]?.name || course.code
          };
          assignmentsByTimeAndDay.get(key)!.push(courseWithInfo);
        }
      });
    });
    
    // Luego, agregar TODOS los otros horarios guardados
    Object.entries(schedulesByCareerAndSemester).forEach(([scheduleKey, savedSchedule]) => {
      // Saltar el horario actual ya que ya lo agregamos arriba
      if (scheduleKey === currentKey) return;
      
      const [career, semester] = scheduleKey.split('_');
      savedSchedule.forEach(slot => {
        dayKeys.forEach(day => {
          const course = slot[day] as ScheduledCourse | null;
          if (course && course.selectedTeacher && course.selectedRoom) {
            const key = `${slot.time}-${day}`;
            if (!assignmentsByTimeAndDay.has(key)) {
              assignmentsByTimeAndDay.set(key, []);
            }
            // Agregar información del semestre y carrera
            const courseWithInfo = {
              ...course,
              _scheduleInfo: `${career?.split('-')[0] || career} - Semestre ${semester}`,
              name: course.name || cursosCache[course.key]?.name || course.code
            };
            assignmentsByTimeAndDay.get(key)!.push(courseWithInfo);
          }
        });
      });
    });
    
    // Verificar conflictos
    assignmentsByTimeAndDay.forEach((courses, timeDay) => {
      const [time, day] = timeDay.split('-');
      const dayName = days[dayKeys.indexOf(day as typeof dayKeys[number])];
      
      // Mapear tiempo a bloque
      const timeToBlock: { [key: string]: string } = {
        '08:10 - 09:40': 'A',
        '09:55 - 11:25': 'B', 
        '11:40 - 13:10': 'C',
        '13:10 - 14:30': 'C2',
        '14:30 - 16:00': 'D',
        '16:15 - 17:45': 'E',
        '18:00 - 19:30': 'F',
        '19:45 - 21:15': 'G',
        '21:30 - 23:00': 'H'
      };
      
      const bloque = timeToBlock[time] || 'BLOQUE DESCONOCIDO';
      
      // Agrupar por profesor
      const coursesByTeacher = new Map<string, any[]>();
      courses.forEach(course => {
        if (course.selectedTeacher) {
          const teacherKey = course.selectedTeacher;
          if (!coursesByTeacher.has(teacherKey)) {
            coursesByTeacher.set(teacherKey, []);
          }
          coursesByTeacher.get(teacherKey)!.push(course);
        }
      });
        
      // Detectar conflictos de profesor
      coursesByTeacher.forEach((teacherCourses, teacher) => {
        if (teacherCourses.length > 1) {
          const teacherName = teachers.find(t => t.rut === teacher)?.name || teacher || 'Profesor no definido';
          const courseDetails = teacherCourses.map(c => {
            const courseName = c.name || c.code || 'Asignatura';
            const courseParalelo = c.paralelo || 'C1';
            const scheduleInfo = c._scheduleInfo || 'Sin información';
            return `- ${courseName} ${courseParalelo} (${scheduleInfo})`;
          }).join('\n');
          
          conflictList.push(`PROFESOR: ${teacherName} tiene múltiples clases en BLOQUE ${bloque}\n${courseDetails}`);
        }
      });

      // Agrupar por sala
      const coursesByRoom = new Map<string, any[]>();
      courses.forEach(course => {
        if (course.selectedRoom) {
          const roomKey = course.selectedRoom;
          if (!coursesByRoom.has(roomKey)) {
            coursesByRoom.set(roomKey, []);
          }
          coursesByRoom.get(roomKey)!.push(course);
        }
      });

      // Detectar conflictos de sala
      coursesByRoom.forEach((roomCourses, room) => {
        if (roomCourses.length > 1) {
          const courseDetails = roomCourses.map(c => {
            const courseName = c.name || c.code || 'Asignatura';
            const courseParalelo = c.paralelo || 'C1';
            const scheduleInfo = c._scheduleInfo || 'Sin información';
            return `- ${courseName} ${courseParalelo} (${scheduleInfo})`;
          }).join('\n');
          
          conflictList.push(`SALA: ${room} tiene múltiples clases en BLOQUE ${bloque}\n${courseDetails}`);
        }
      });
    });
    
    return conflictList;
  };

  // Función para actualizar conflictos cuando cambia el horario
  const updateConflicts = () => {
    const currentSchedule = getCurrentSchedule();
    const newConflicts = detectConflicts(currentSchedule);
    setConflicts(newConflicts);
  };

  // Función para mostrar notificación de conflicto
  const showConflictNotification = (message: string) => {
    setLastConflictNotification(message);
    setShowNotification(true);
    // Ocultar la notificación después de 5 segundos
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  // Función para alternar la expansión de un curso
  const toggleCourseExpansion = (courseKey: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseKey]: !prev[courseKey]
    }));
  };

  // Cache de cursos para mostrar información completa
  const cursosCache: Record<string, Course> = {};
  courses.forEach((course) => {
    cursosCache[course.key] = course;
  });
  
  // Efecto para guardar en localStorage cuando cambien los horarios
  useEffect(() => {
    localStorage.setItem(
      "schedulesByCareerAndSemester",
      JSON.stringify(schedulesByCareerAndSemester)
    );
  }, [schedulesByCareerAndSemester]);

  // Efecto para manejar Ctrl+S y guardar automáticamente
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar si es Ctrl+S (o Cmd+S en Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Prevenir el comportamiento por defecto del navegador
        
        // Solo ejecutar si hay datos para guardar
        if (Object.keys(schedulesByCareerAndSemester).length > 0) {
          // Forzar guardado (aunque ya se guarda automáticamente)
          localStorage.setItem(
            "schedulesByCareerAndSemester",
            JSON.stringify(schedulesByCareerAndSemester)
          );
          
          // Mostrar confirmación visual
          console.log("✅ Horarios guardados con Ctrl+S");
          
          // Crear un toast/mensaje temporal en pantalla
          const toast = document.createElement('div');
          toast.textContent = '✅ Horarios guardados';
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
          `;
          
          document.body.appendChild(toast);
          
          // Animar entrada
          setTimeout(() => {
            toast.style.transform = 'translateX(0)';
          }, 10);
          
          // Remover después de 2 segundos
          setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 300);
          }, 2000);
        } else {
          // Mostrar mensaje de que no hay datos para guardar
          const toast = document.createElement('div');
          toast.textContent = 'ℹ️ No hay horarios para guardar';
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
          `;
          
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.style.transform = 'translateX(0)';
          }, 10);
          
          setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 300);
          }, 2000);
        }
      }
    };

    // Agregar el event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: remover el event listener cuando el componente se desmonte
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [schedulesByCareerAndSemester]);

  // Efecto para actualizar conflictos cuando cambien los horarios
  useEffect(() => {
    const currentSchedule = getCurrentSchedule();
    const newConflicts = detectConflicts(currentSchedule);
    setConflicts(newConflicts);
  }, [schedulesByCareerAndSemester, selectedCareer, selectedSemester]);

  // Función helper para generar clave única de carrera + semestre
  const getScheduleKey = (career: string, semester: string) => {
    return `${career}-${semester}`;
  };

  // Función para crear asignación de horario en la base de datos
  const createScheduleAssignment = async (params: {
    courseCode: string;
    paralelo: string;
    time: string;
    day: string;
    roomName: string;
    career: string;
    semester: string;
  }) => {
    try {
      console.log('🔄 Creando asignación de horario en la base de datos:', params);
      
      // Formatear el nombre de la sala con el prefijo de sede
      const formattedRoomName = formatRoomNameWithSede(params.roomName, selectedSede);
      console.log('🏢 Nombre de sala formateado:', formattedRoomName);
      
      // Mapear día a nombre esperado por la API
      const dayMap: Record<string, string> = {
        'monday': 'LUNES',
        'tuesday': 'MARTES', 
        'wednesday': 'MIERCOLES',
        'thursday': 'JUEVES',
        'friday': 'VIERNES',
        'saturday': 'SABADO'
      };

      // Mapear tiempo a bloque (asumiendo que el tiempo corresponde directamente al bloque)
      // Por ejemplo: "08:10 - 09:40" corresponde al bloque "A"
      const timeSlotMap = new Map((timeSlotsData as TimeSlotData[])
        .filter((slot) => slot.horario !== null)
        .map((slot) => [slot.horario!, slot]));
      
      const timeSlotData = timeSlotMap.get(params.time);
      if (!timeSlotData) {
        console.error('No se encontró información del bloque horario para:', params.time);
        return;
      }

      const response = await fetch('http://localhost:3000/asignaciones-horario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asignaturaCode: params.courseCode,
          paralelo: params.paralelo,
          bloqueNombre: timeSlotData.nombre,
          bloqueDia: dayMap[params.day],
          salaNombre: formattedRoomName,
          carreraNombre: params.career,
          semestre: parseInt(params.semester)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Asignación de horario creada:', result);
        return result;
      } else {
        const error = await response.text();
        console.error('❌ Error al crear asignación de horario:', error);
        throw new Error(`Error ${response.status}: ${error}`);
      }
    } catch (error) {
      console.error('❌ Error en createScheduleAssignment:', error);
      throw error;
    }
  };

  // Función para eliminar asignación de horario de la base de datos
  const removeScheduleAssignment = async (params: {
    courseCode: string;
    time: string;
    day: string;
    roomName: string;
  }) => {
    try {
      console.log('🗑️ Eliminando asignación de horario:', params);
      
      // Formatear el nombre de la sala con el prefijo de sede
      const formattedRoomName = formatRoomNameWithSede(params.roomName, selectedSede);
      console.log('🏢 Nombre de sala formateado para eliminación:', formattedRoomName);
      
      // Mapear día y obtener información del bloque
      const dayMap: Record<string, string> = {
        'monday': 'LUNES',
        'tuesday': 'MARTES', 
        'wednesday': 'MIERCOLES',
        'thursday': 'JUEVES',
        'friday': 'VIERNES',
        'saturday': 'SABADO'
      };

      const timeSlotMap = new Map((timeSlotsData as TimeSlotData[])
        .filter((slot) => slot.horario !== null)
        .map((slot) => [slot.horario!, slot]));
      
      const timeSlotData = timeSlotMap.get(params.time);
      if (!timeSlotData) {
        console.error('No se encontró información del bloque horario para:', params.time);
        return;
      }

      const paraleloId = 1; // Este ID debería venir del curso/paralelo

      const response = await fetch('http://localhost:3000/asignaciones-horario/by-location?' + new URLSearchParams({
        paraleloId: paraleloId.toString(),
        salaNombre: formattedRoomName, // Usar el nombre formateado
        bloqueHorarioDia: dayMap[params.day],
        bloqueHorarioNombre: timeSlotData.nombre
      }), {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Asignación de horario eliminada:', result);
        return result;
      } else {
        const error = await response.text();
        console.error('❌ Error al eliminar asignación de horario:', error);
        throw new Error(`Error ${response.status}: ${error}`);
      }
    } catch (error) {
      console.error('❌ Error en removeScheduleAssignment:', error);
      throw error;
    }
  };
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Cargando cursos:", coursesData.length, "cursos encontrados");
        // Asignar paralelo "C1" por defecto a todos los cursos existentes
        const coursesWithParalelo = (coursesData as Course[]).map(course => ({
          ...course,
          paralelo: course.paralelo || "C1" // Asignar C1 si no tiene paralelo
        }));
        setCourses(coursesWithParalelo);
        
        // Cargar profesores desde la API
        console.log("🔄 Iniciando carga de profesores desde API...");
        console.log("📡 Fetch URL: http://localhost:3000/profesores");
        const teachersResponse = await fetch('http://localhost:3000/profesores');
        console.log("📥 Respuesta de profesores - Status:", teachersResponse.status, "OK:", teachersResponse.ok);
        
        if (teachersResponse.ok) {
          const teachersFromApi = await teachersResponse.json();
          console.log("✅ Profesores cargados desde API:", teachersFromApi);
          console.log("📊 Total profesores:", teachersFromApi.length);
          
          // Mapear los datos de la API al formato esperado por el frontend
          const mappedTeachers = teachersFromApi.map((teacher: any) => ({
            rut: teacher.rut,
            name: teacher.nombre || teacher.name,
            isAvailable: teacher.isAvailable === true, // Usar la disponibilidad real de la API
            maxSectionsPerWeek: teacher.maxSectionsPerWeek || 10,
            courseOffer: teacher.courseOffer || [],
            availability: teacher.availability || [],
            schedule: teacher.schedule || []
          }));
          
          // Log detalles de algunos profesores para depuración
          mappedTeachers.slice(0, 3).forEach((teacher: Teacher, index: number) => {
            console.log(`👨‍🏫 Profesor ${index + 1} (mapeado):`, {
              rut: teacher.rut,
              name: teacher.name,
              isAvailable: teacher.isAvailable,
              courseOffer: teacher.courseOffer,
              availability: teacher.availability
            });
          });
          
          console.log("🔍 Profesores disponibles:", mappedTeachers.filter((t: Teacher) => t.isAvailable).length);
          console.log("🔍 Profesores NO disponibles:", mappedTeachers.filter((t: Teacher) => !t.isAvailable).length);
          console.log("📋 Lista completa de disponibilidad:");
          mappedTeachers.forEach((teacher: Teacher) => {
            console.log(`   ${teacher.name} (${teacher.rut}): ${teacher.isAvailable ? '✅ Disponible' : '❌ No disponible'}`);
          });
          setTeachers(mappedTeachers);
        } else {
          console.error("❌ Error al cargar profesores desde API. Status:", teachersResponse.status);
          console.log("🔄 Fallback: usando array vacío");
          setTeachers([]);
        }

        // Cargar salas desde la API
        console.log("Cargando salas desde la API...");
        const classroomsResponse = await fetch('http://localhost:3000/salas');
        if (classroomsResponse.ok) {
          const classroomsFromApi = await classroomsResponse.json();
          console.log("Salas cargadas desde API:", classroomsFromApi.length, "salas encontradas");
          setClassrooms(classroomsFromApi);
        } else {
          console.error("Error al cargar salas desde API, usando datos estáticos");
          setClassrooms(classroomsData as Classroom[]);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        // Fallback a datos estáticos si hay error
        setTeachers([]);
        setClassrooms(classroomsData as Classroom[]);
      }
      
      setLoading(false);
    };

    setTimeout(loadData, 500);
  }, []);

  // Función para cargar asignaciones existentes desde la base de datos
  const loadExistingAssignments = async () => {
    try {
      console.log('📥 Cargando asignaciones existentes desde la base de datos...');
      
      const response = await fetch('http://localhost:3000/asignaciones-horario');
      if (!response.ok) {
        throw new Error(`Error al cargar asignaciones: ${response.status}`);
      }
      
      const assignments = await response.json();
      console.log('📋 Asignaciones cargadas desde la base de datos:', assignments.length);
      
      // Convertir asignaciones de BD a formato del frontend
      const schedulesByKey: ScheduleByCareerAndSemester = {};
      
      for (const assignment of assignments) {
        try {
          // Obtener datos del paralelo con información expandida
          const paralelo = assignment.paralelo;
          const asignatura = paralelo.asignatura;
          const carrera = asignatura.semestre.carrera;
          const sala = assignment.sala;
          const bloque = assignment.bloqueHorario;
          
          // Crear la clave del horario (carrera-semestre)
          const scheduleKey = `${carrera.name}-${asignatura.semestre.numero}`;
          
          // Inicializar el horario si no existe
          if (!schedulesByKey[scheduleKey]) {
            schedulesByKey[scheduleKey] = defaultTimeSlots.map((slot) => ({ ...slot }));
          }
          
          // Mapear día de la BD al formato del frontend
          const dayMap: Record<string, keyof Omit<TimeSlot, "time">> = {
            'LUNES': 'monday',
            'MARTES': 'tuesday',
            'MIERCOLES': 'wednesday',
            'JUEVES': 'thursday',
            'VIERNES': 'friday',
            'SABADO': 'saturday'
          };
          
          const dayKey = dayMap[bloque.dia];
          const timeSlot = `${bloque.horaInicio.substring(11, 16)} - ${bloque.horaFin.substring(11, 16)}`;
          
          if (dayKey) {
            // Crear el curso programado
            const scheduledCourse: ScheduledCourse = {
              key: `${asignatura.code}-${carrera.code}-${asignatura.semestre.numero}`,
              code: asignatura.code,
              name: asignatura.name,
              period: assignment.periodoAcademico.codigoBanner || assignment.periodoAcademico.nombre,
              career: carrera.name,
              semester: asignatura.semestre.numero,
              demand: asignatura.demand || 0,
              isLocked: asignatura.isLocked || false,
              isPreAssigned: asignatura.isPreAssigned || false,
              lastUpdate: new Date().toISOString(),
              sectionSize: paralelo.capacidadEstimada || 18,
              sectionsNumber: 1,
              suggestedRoom: asignatura.suggestedRoom || '',
              paralelo: paralelo.nombre,
              selectedRoom: sala.nombre.replace(/^(CQB|ANF) /, ''), // Quitar prefijo para mostrar en UI
              selectedTeacher: paralelo.profesor?.rut || undefined
            };
            
            // Buscar el slot correcto en el horario
            const schedule = schedulesByKey[scheduleKey];
            const slotIndex = schedule.findIndex(slot => slot.time === timeSlot);
            
            if (slotIndex !== -1) {
              schedule[slotIndex] = {
                ...schedule[slotIndex],
                [dayKey]: scheduledCourse
              };
              
              console.log(`✅ Asignación cargada: ${asignatura.code} ${paralelo.nombre} en ${sala.nombre} ${bloque.dia} ${timeSlot}`);
            } else {
              console.warn(`⚠️ No se encontró slot para ${timeSlot} en ${scheduleKey}`);
            }
          } else {
            console.warn(`⚠️ Día no reconocido: ${bloque.dia}`);
          }
        } catch (error) {
          console.error('❌ Error procesando asignación:', assignment.id, error);
        }
      }
      
      // Actualizar el estado con las asignaciones cargadas
      setSchedulesByCareerAndSemester(schedulesByKey);
      
      console.log(`✅ Horarios cargados desde BD para ${Object.keys(schedulesByKey).length} carrera(s)/semestre(s)`);
      
    } catch (error) {
      console.error('❌ Error al cargar asignaciones existentes:', error);
    }
  };

  // Cargar asignaciones existentes al montar el componente
  useEffect(() => {
    loadExistingAssignments();
  }, []);

  // Obtener carreras únicas
  const careers = [...new Set(courses.map((course: Course) => course.career))].sort();
  // Obtener semestres únicos según la carrera seleccionada
  const semesters =
    selectedCareer === ""
      ? []
      : [
          ...new Set(
            courses
              .filter((course: Course) => course.career === selectedCareer)
              .map((course: Course) => course.semester)
          ),
        ].sort((a: any, b: any) => a - b);
  // Resetear semestre cuando cambie la carrera
  const handleCareerChange = (career: string) => {
    setSelectedCareer(career);
    setSelectedSemester(""); // Resetear semestre cuando cambie la carrera
  };

  // Manejar cambio en la visualización de semestres anteriores
  const handleTogglePreviousSemester = (semestre: string) => {
    setShowPreviousSemesters((prev: string[]) => {
      if (prev.includes(semestre)) {
        return prev.filter((s: string) => s !== semestre);
      } else {
        return [...prev, semestre];
      }
    });
  };
  // Obtener horario actual basado en la carrera y semestre seleccionados
  const getCurrentSchedule = () => {
    if (!selectedSemester || !selectedCareer) return defaultTimeSlots;
    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    return schedulesByCareerAndSemester[scheduleKey] || defaultTimeSlots;
  };  // Función para obtener horarios de otros semestres (efecto cebolla)
  const getBackgroundSchedules = () => {
    if (!selectedSemester || !selectedCareer) return [];

    const currentSem = parseInt(selectedSemester);
    const backgroundSchedules: {
      semester: string;
      schedule: TimeSlot[];
      opacity: string;
    }[] = [];

    // Obtener los cursos de los semestres anteriores según la configuración
    const previousSemester = currentSem > 1 ? currentSem - 1 : null;
    const previousSemester2 = currentSem > 2 ? currentSem - 2 : null;

    // Añadir semestre anterior si está habilitado
    if (
      previousSemester &&
      showPreviousSemesters.includes("semestre-1")
    ) {
      const scheduleKey = getScheduleKey(selectedCareer, previousSemester.toString());
      if (schedulesByCareerAndSemester[scheduleKey]) {
        backgroundSchedules.push({
          semester: previousSemester.toString(),
          schedule: schedulesByCareerAndSemester[scheduleKey],
          opacity: "opacity-60",
        });
      }
    }

    // Añadir semestre anterior al anterior si está habilitado
    if (
      previousSemester2 &&
      showPreviousSemesters.includes("semestre-2")
    ) {
      const scheduleKey = getScheduleKey(selectedCareer, previousSemester2.toString());
      if (schedulesByCareerAndSemester[scheduleKey]) {
        backgroundSchedules.push({
          semester: previousSemester2.toString(),
          schedule: schedulesByCareerAndSemester[scheduleKey],
          opacity: "opacity-40",
        });
      }
    }

    return backgroundSchedules;
  };// Filtrar cursos disponibles
  const filteredCourses = courses.filter((course: Course) => {
    // No mostrar cursos hasta que se seleccionen carrera y semestre
    if (selectedCareer === "" || selectedSemester === "") {
      return false;
    }

    const matchesCareer = course.career === selectedCareer;
    const matchesSemester = course.semester.toString() === selectedSemester;
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());

    // Verificar si el curso ya está asignado en el horario del semestre actual
    const currentSchedule = getCurrentSchedule();
    const isAlreadyScheduled = currentSchedule.some((slot: any) =>
      dayKeys.some((day) => slot[day]?.key === course.key)
    );

    return (
      matchesCareer && matchesSemester && matchesSearch && !isAlreadyScheduled
    );
  });
  const getCellContent = (slot: TimeSlot, dayKey: keyof TimeSlot) => {
    return slot[dayKey] as ScheduledCourse | null;
  };

  const handleCellClick = (time: string, day: keyof Omit<TimeSlot, "time">) => {
    setSelectedCell({ time, day });
  };
  const handleDragStart = (event: DragStartEvent) => {
    const course = event.active.data.current?.course as Course;
    setActiveCourse(course);
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCourse(null);

    if (!over) return;

    const course = active.data.current?.course as Course;
    const dropData = over.data.current;

    // Verificar que el curso pertenece al semestre y carrera seleccionados
    if (!selectedSemester || !selectedCareer || 
        course.semester.toString() !== selectedSemester ||
        course.career !== selectedCareer) {
      console.warn(
        `No se puede agregar el curso ${course.code} (${course.career}, Semestre ${course.semester}) al horario actual (${selectedCareer}, Semestre ${selectedSemester})`
      );
      return; // No permitir agregar cursos de otros semestres o carreras
    }

    if (dropData?.type === "schedule-cell") {
      const { time, day } = dropData;      
      // Verificar si ya existe un curso en esa celda
      const currentSchedule = getCurrentSchedule();
      const existingCourse = currentSchedule.find(
        (slot) => slot.time === time
      )?.[day as keyof TimeSlot] as ScheduledCourse | null;

      if (existingCourse) {
        console.warn(
          `Ya existe un curso en ${day} a las ${time}: ${existingCourse.name}`
        );
        return;
      }

      // Crear el ScheduledCourse con la sala sugerida inicialmente
      const scheduledCourse: ScheduledCourse = {
        ...course,
        selectedRoom: course.suggestedRoom,
        selectedTeacher: undefined
      };

      // Actualizar el estado local primero
      const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
      setSchedulesByCareerAndSemester((prevSchedules) => {
        const currentSchedule =
          prevSchedules[scheduleKey] ||
          defaultTimeSlots.map((slot) => ({ ...slot }));
        const newSchedule = currentSchedule.map((slot) =>
          slot.time === time ? { ...slot, [day]: scheduledCourse } : slot
        );
        
        // Detectar conflictos en el nuevo horario
        const newConflicts = detectConflicts(newSchedule);
        const previousConflictCount = conflicts.length;
        
        // Actualizar los conflictos
        setConflicts(newConflicts);
        
        // Si hay nuevos conflictos, mostrar notificación
        if (newConflicts.length > previousConflictCount) {
          const newConflictMessages = newConflicts.slice(previousConflictCount);
          newConflictMessages.forEach(conflict => {
            showConflictNotification(`¡Conflicto detectado! ${conflict}`);
          });
        }
        
        return {
          ...prevSchedules,
          [scheduleKey]: newSchedule,
        };
      });

      // TODO: Crear asignación de horario en la base de datos
      // Esto se implementará cuando tengamos los IDs de paralelos desde la API
      console.log('📝 Creando asignación de horario:', {
        course: course.name,
        code: course.code,
        time: time,
        day: day,
        selectedRoom: course.suggestedRoom
      });
      
      try {
        // Por ahora solo logeamos, más adelante haremos el POST a la API
        await createScheduleAssignment({
          courseCode: course.code,
          paralelo: course.paralelo || 'C1', // Usar el paralelo del curso o C1 por defecto
          time: time,
          day: day,
          roomName: course.suggestedRoom || '',
          career: selectedCareer,
          semester: selectedSemester
        });
      } catch (error) {
        console.error('Error al crear asignación de horario:', error);
        // En caso de error, podríamos revertir el estado local aquí
      }
    }
  };  // Función para eliminar un paralelo (excepto C1)
  const deleteParalelo = (courseKey: string, paralelo: string) => {
    if (paralelo === "C1") {
      console.warn("No se puede eliminar el paralelo C1");
      return;
    }
    
    // Verificar si el curso está asignado en el horario
    const currentSchedule = getCurrentSchedule();
    const isScheduled = currentSchedule.some((slot: any) =>
      dayKeys.some((day) => slot[day]?.key === courseKey)
    );
    
    if (isScheduled) {
      if (!confirm(`El paralelo ${paralelo} está asignado en el horario. ¿Desea eliminarlo de todas formas?`)) {
        return;
      }
      
      // Remover del horario primero
      removeCourseFromSchedule(courseKey);
    }
    
    // Remover de la lista de cursos
    setCourses(prevCourses => prevCourses.filter(course => course.key !== courseKey));
    
    console.log(`Paralelo ${paralelo} eliminado`);
  };

  // Función para remover un curso específico del horario
  const removeCourseFromSchedule = async (courseKey: string) => {
    if (!selectedSemester || !selectedCareer) return;

    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    const currentSchedule = schedulesByCareerAndSemester[scheduleKey] || defaultTimeSlots.map((slot) => ({ ...slot }));
    
    // Encontrar el curso que se va a eliminar para hacer la petición DELETE
    let courseToRemove: ScheduledCourse | null = null;
    let timeSlot = '';
    let dayKey = '';
    
    for (const slot of currentSchedule) {
      for (const day of dayKeys) {
        if (slot[day]?.key === courseKey) {
          courseToRemove = slot[day] as ScheduledCourse;
          timeSlot = slot.time;
          dayKey = day;
          break;
        }
      }
      if (courseToRemove) break;
    }

    // Si encontramos el curso, eliminar de la base de datos primero
    if (courseToRemove && courseToRemove.selectedRoom) {
      try {
        await removeScheduleAssignment({
          courseCode: courseToRemove.code,
          time: timeSlot,
          day: dayKey,
          roomName: courseToRemove.selectedRoom
        });
        console.log('✅ Asignación eliminada de la base de datos');
      } catch (error) {
        console.error('❌ Error al eliminar de la base de datos:', error);
        // Decidir si continuar con la eliminación local o no
        // Por ahora continuamos para mantener la funcionalidad
      }
    }

    // Actualizar el estado local
    setSchedulesByCareerAndSemester((prevSchedules) => {
      const currentSchedule =
        prevSchedules[scheduleKey] ||
        defaultTimeSlots.map((slot) => ({ ...slot }));
      
      return {
        ...prevSchedules,
        [scheduleKey]: currentSchedule.map((slot) => {
          const updatedSlot = { ...slot };
          dayKeys.forEach((day) => {
            if (updatedSlot[day]?.key === courseKey) {
              updatedSlot[day] = null;
            }
          });
          return updatedSlot;
        }),
      };
    });
  };

  // Efecto para cargar el estado inicial desde localStorage
  useEffect(() => {
    const savedSchedules = localStorage.getItem("schedulesByCareerAndSemester");
    if (savedSchedules) {
      setSchedulesByCareerAndSemester(JSON.parse(savedSchedules));
    }
  }, []);

  // Función para limpiar el horario del semestre actual
  const clearAllSchedule = async () => {
    if (!selectedSemester || !selectedCareer) return;
    
    if (confirm(`¿Está seguro de que desea limpiar todo el horario del semestre ${selectedSemester} de ${selectedCareer}?`)) {
      try {
        console.log('🗑️ Eliminando todas las asignaciones de la base de datos...');
        
        // Eliminar todas las asignaciones del periodo académico actual en la base de datos
        const response = await fetch('http://localhost:3000/asignaciones-horario/current-period/all', {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Asignaciones eliminadas de la base de datos:', result);
        } else {
          console.error('❌ Error al eliminar asignaciones de la base de datos:', response.status);
        }
      } catch (error) {
        console.error('❌ Error al conectar con la API para eliminar asignaciones:', error);
      }
      
      // Eliminar del estado local
      const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
      setSchedulesByCareerAndSemester((prevSchedules) => {
        const newSchedules = { ...prevSchedules };
        delete newSchedules[scheduleKey];
        return newSchedules;
      });
      console.log(`Horario del semestre ${selectedSemester} de ${selectedCareer} limpiado`);
    }
  };

  // Función para limpiar toda la caché
  const clearAllCache = () => {
    if (confirm("¿Está seguro de que desea eliminar TODOS los horarios guardados? Esta acción no se puede deshacer.")) {
      setSchedulesByCareerAndSemester({});
      localStorage.removeItem("schedulesByCareerAndSemester");
      console.log("Toda la caché de horarios ha sido eliminada");
    }
  };

  // Función para exportar horarios como JSON
  const exportSchedulesJSON = () => {
    if (Object.keys(schedulesByCareerAndSemester).length === 0) {
      alert("No hay horarios para exportar");
      return;
    }

    const dataStr = JSON.stringify(schedulesByCareerAndSemester, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `horarios_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Función para importar horarios desde JSON
  const importSchedules = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setSchedulesByCareerAndSemester(importedData);
        console.log("Horarios importados exitosamente");
        alert("Horarios importados exitosamente");
      } catch (error) {
        console.error("Error al importar horarios:", error);
        alert("Error al importar horarios. Verifique que el archivo sea válido.");
      }
    };
    reader.readAsText(file);
    
    // Limpiar el input
    event.target.value = '';
  };

  // Función para exportar horarios a Excel
  const exportSchedules = async () => {
    if (Object.keys(schedulesByCareerAndSemester).length === 0) {
      alert("No hay horarios para exportar");
      return;
    }

    // Crear una representación simplificada para exportar
    const exportData: any = {};
    Object.entries(schedulesByCareerAndSemester).forEach(([careerSemester, schedule]) => {
      const simplifiedSchedule: any = {};
      schedule.forEach((slot) => {
        const row: any = {};
        dayKeys.forEach((dayKey) => {
          const course = getCellContent(slot, dayKey);
          if (course) {
            row[dayKey] = `${course.name} (${course.code})${course.paralelo ? ` - ${course.paralelo}` : ''}`;
          }
        });
        if (Object.keys(row).length > 0) {
          simplifiedSchedule[slot.time] = row;
        }
      });
      exportData[careerSemester] = simplifiedSchedule;
    });

    // Crear archivo de texto simple (ya que ExcelJS no está disponible)
    let content = "HORARIOS EXPORTADOS\n";
    content += "===================\n\n";

    Object.entries(exportData).forEach(([careerSemester, scheduleData]) => {
      content += `${careerSemester}\n`;
      content += "-".repeat(careerSemester.length) + "\n";
      
      Object.entries(scheduleData as any).forEach(([time, dayData]) => {
        content += `${time}:\n`;
        Object.entries(dayData as any).forEach(([day, course]) => {
          content += `  ${day}: ${course}\n`;
        });
        content += "\n";
      });
      content += "\n";
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horarios_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Función para obtener asignaturas únicas del semestre y carrera seleccionados
  const getUniqueSubjects = () => {
    if (!selectedCareer || !selectedSemester) return [];
    
    const subjectsMap = new Map();
    
    courses
      .filter((course: Course) => 
        course.career === selectedCareer && 
        course.semester.toString() === selectedSemester
      )
      .forEach((course: Course) => {
        const key = `${course.code}-${course.name}`;
        if (!subjectsMap.has(key)) {
          subjectsMap.set(key, {
            code: course.code,
            name: course.name,
            career: course.career,
            semester: course.semester,
            demand: course.demand,
            suggestedRoom: course.suggestedRoom,
            isLocked: course.isLocked,
            isPreAssigned: course.isPreAssigned
          });
        }
      });
    
    return Array.from(subjectsMap.values());
  };

  // Función para obtener el siguiente paralelo disponible (C2, C3, etc.)
  const getNextAvailableParalelo = (subjectCode: string) => {
    const existingParalelos = courses
      .filter((course: Course) => 
        course.code === subjectCode &&
        course.career === selectedCareer &&
        course.semester.toString() === selectedSemester
      )
      .map((course: Course) => course.paralelo || "C1")
      .sort();
    
    let nextNumber = 1;
    while (existingParalelos.includes(`C${nextNumber}`)) {
      nextNumber++;
    }
    
    return `C${nextNumber}`;
  };

  // Función para crear un nuevo paralelo
  const createNewParalelo = (selectedSubject: any, paraleloName?: string) => {
    if (!selectedSubject) return;
    
    const newParalelo = paraleloName || getNextAvailableParalelo(selectedSubject.code);
    
    // Buscar el curso original para copiar sus propiedades
    const originalCourse = courses.find((course: Course) => 
      course.code === selectedSubject.code &&
      course.career === selectedCareer &&
      course.semester.toString() === selectedSemester
    );
    
    if (!originalCourse) return;
    
    // Crear nuevo curso con el paralelo
    const newCourse: Course = {
      ...originalCourse,
      key: `${originalCourse.code}-${paraleloName || newParalelo}-${Date.now()}`, // Generar key único
      paralelo: paraleloName || newParalelo
    };
    
    // Agregar el nuevo curso a la lista
    setCourses((prevCourses: Course[]) => [...prevCourses, newCourse]);
    
    console.log(`Nuevo paralelo creado: ${newCourse.name} - ${newCourse.paralelo}`);
  };

  // Función para manejar la selección de asignatura para crear paralelo
  const handleCreateParaleloForSubject = (subject: any) => {
    const newParalelo = getNextAvailableParalelo(subject.code);
    createNewParalelo(subject, newParalelo);
    setShowCreateParaleloModal(false);
  };

  // Función para obtener el color del curso
  const getCourseColor = (courseCode: string) => {
    const prefix = courseCode.substring(0, 4);
    return colorsByPrefix[prefix as keyof typeof colorsByPrefix] || 
           "bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700";
  };

  // Función para obtener salas disponibles para un horario específico
  const getAvailableRooms = (time: string) => {
    // Obtener todas las salas disponibles que no están ocupadas en este horario
    const currentSchedule = getCurrentSchedule();
    const occupiedRooms = new Set<string>();
    
    // Encontrar qué salas están ocupadas en este horario
    currentSchedule.forEach((slot) => {
      if (slot.time === time) {
        dayKeys.forEach((dayKey) => {
          const content = getCellContent(slot, dayKey);
          if (content && content.selectedRoom) {
            occupiedRooms.add(content.selectedRoom);
          }
        });
      }
    });
    
    // Retornar salas que no están ocupadas
    return classrooms.filter(room => !occupiedRooms.has(room.nombre));
  };

  // Función para actualizar la sala seleccionada de un curso en el horario
  const updateSelectedRoom = async (time: string, day: keyof Omit<TimeSlot, "time">, roomName: string) => {
    if (!selectedSemester || !selectedCareer) return;

    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    const currentSchedule = schedulesByCareerAndSemester[scheduleKey] || defaultTimeSlots.map((slot) => ({ ...slot }));
    
    // Encontrar el curso actual para actualizar en la base de datos
    const slot = currentSchedule.find(s => s.time === time);
    const currentCourse = slot?.[day] as ScheduledCourse;
    
    // Verificar conflictos ANTES de actualizar
    const tempSchedule = currentSchedule.map((scheduleSlot) =>
      scheduleSlot.time === time
        ? {
            ...scheduleSlot,
            [day]: scheduleSlot[day] ? { ...scheduleSlot[day], selectedRoom: roomName } : null,
          }
        : scheduleSlot
    );
    
    const newConflicts = detectConflicts(tempSchedule);
    if (newConflicts.length > 0) {
      const roomConflicts = newConflicts.filter(conflict => 
        conflict.includes('sala') && conflict.includes(roomName)
      );
      if (roomConflicts.length > 0) {
        showConflictNotification(`⚠️ Conflicto de sala: ${roomConflicts[0]}`);
      }
    }
    
    if (currentCourse && currentCourse.selectedRoom !== roomName) {
      try {
        // Formatear los nombres de sala con el prefijo de sede
        const oldRoomFormatted = formatRoomNameWithSede(currentCourse.selectedRoom || '', selectedSede);
        const newRoomFormatted = formatRoomNameWithSede(roomName, selectedSede);
        
        // Actualizar la asignación en la base de datos
        console.log('🔄 Actualizando sala en la base de datos:', {
          courseCode: currentCourse.code,
          oldRoom: oldRoomFormatted,
          newRoom: newRoomFormatted,
          time,
          day
        });

        const dayInSpanish = mapDayToSpanish(day);
        const bloqueNombre = timeSlotMap.get(time)?.nombre || 'A';
        
        const response = await fetch('http://localhost:3000/asignaciones-horario/update-room', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            asignaturaCode: currentCourse.code,
            bloqueNombre: bloqueNombre,
            bloqueDia: dayInSpanish,
            oldSalaNombre: oldRoomFormatted, // Usar nombre formateado
            newSalaNombre: newRoomFormatted  // Usar nombre formateado
          }),
        });

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        console.log('✅ Sala actualizada en la base de datos');
      } catch (error) {
        console.error('❌ Error al actualizar sala en la base de datos:', error);
        // Continuamos con la actualización local aunque falle la BD
      }
    }

    // Actualizar el estado local
    setSchedulesByCareerAndSemester((prevSchedules) => {
      const currentSchedule = prevSchedules[scheduleKey] || defaultTimeSlots.map((slot) => ({ ...slot }));
      
      return {
        ...prevSchedules,
        [scheduleKey]: currentSchedule.map((slot) =>
          slot.time === time
            ? {
                ...slot,
                [day]: slot[day] ? { ...slot[day], selectedRoom: roomName } : null,
              }
            : slot
        ),
      };
    });
  };

  // Función para actualizar el profesor seleccionado de un curso en el horario
  const updateSelectedTeacher = async (time: string, day: keyof Omit<TimeSlot, "time">, teacherRut: string) => {
    if (!selectedSemester || !selectedCareer) return;

    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    const currentSchedule = schedulesByCareerAndSemester[scheduleKey] || defaultTimeSlots.map((slot) => ({ ...slot }));
    
    // Encontrar el curso actual para actualizar en la base de datos
    const slot = currentSchedule.find(s => s.time === time);
    const currentCourse = slot?.[day] as ScheduledCourse;
    
    // Verificar conflictos ANTES de actualizar
    const tempSchedule = currentSchedule.map((scheduleSlot) =>
      scheduleSlot.time === time
        ? {
            ...scheduleSlot,
            [day]: scheduleSlot[day] ? { ...scheduleSlot[day], selectedTeacher: teacherRut } : null,
          }
        : scheduleSlot
    );
    
    const newConflicts = detectConflicts(tempSchedule);
    if (newConflicts.length > 0) {
      const teacherName = teachers.find(t => t.rut === teacherRut)?.name || teacherRut;
      const teacherConflicts = newConflicts.filter(conflict => 
        conflict.includes('profesor') && conflict.includes(teacherName)
      );
      if (teacherConflicts.length > 0) {
        showConflictNotification(`⚠️ Conflicto de profesor: ${teacherConflicts[0]}`);
      }
    }
    
    if (currentCourse && currentCourse.selectedTeacher !== teacherRut) {
      try {
        // Formatear el nombre de la sala con el prefijo de sede
        const formattedRoomName = formatRoomNameWithSede(currentCourse.selectedRoom || '', selectedSede);
        
        // Actualizar el profesor en la base de datos
        console.log('🔄 Actualizando profesor en la base de datos:', {
          courseCode: currentCourse.code,
          oldTeacher: currentCourse.selectedTeacher,
          newTeacher: teacherRut,
          time,
          day,
          room: formattedRoomName
        });

        const dayInSpanish = mapDayToSpanish(day);
        const bloqueNombre = timeSlotMap.get(time)?.nombre || 'A';
        
        const response = await fetch('http://localhost:3000/asignaciones-horario/update-teacher', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            asignaturaCode: currentCourse.code,
            bloqueNombre: bloqueNombre,
            bloqueDia: dayInSpanish,
            salaNombre: formattedRoomName, // Usar nombre formateado
            teacherRut: teacherRut
          }),
        });

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        console.log('✅ Profesor actualizado en la base de datos');
      } catch (error) {
        console.error('❌ Error al actualizar profesor en la base de datos:', error);
        // Continuamos con la actualización local aunque falle la BD
      }
    }

    // Actualizar el estado local
    setSchedulesByCareerAndSemester((prevSchedules) => {
      const currentSchedule = prevSchedules[scheduleKey] || defaultTimeSlots.map((slot) => ({ ...slot }));
      
      return {
        ...prevSchedules,
        [scheduleKey]: currentSchedule.map((slot) =>
          slot.time === time
            ? {
                ...slot,
                [day]: slot[day] ? { ...slot[day], selectedTeacher: teacherRut } : null,
              }
            : slot
        ),
      };
    });
  };

  // Función para verificar si un profesor está disponible en un horario específico
  const isTeacherAvailable = (teacherRut: string, time: string, dayKey: string): boolean => {
    // Primero verificar si el profesor está disponible según la base de datos
    const teacher = teachers.find((t: Teacher) => t.rut === teacherRut);
    if (!teacher || !teacher.isAvailable) {
      return false; // El profesor no está disponible según la BD
    }
    
    // Luego verificar que no esté ya asignado en este horario en otro curso
    return !Object.values(schedulesByCareerAndSemester).some((timeSlots: any) =>
      timeSlots.some((slot: any) => {
        if (slot.time !== time) return false;
        const dayContent = slot[dayKey as keyof TimeSlot] as ScheduledCourse | null | undefined;
        return dayContent?.selectedTeacher === teacherRut;
      })
    );
  };

  // Función para obtener profesores disponibles
  const getAvailableTeachers = (courseCode: string, career: string, time: string, dayKey: string, showAllOptions?: {[key: string]: boolean}) => {
    const cellKey = `${time}-${dayKey}`;
    const showAll = showAllOptions?.[cellKey] || false;
    
    console.log(`🔍 Dropdown Teachers - Curso: ${courseCode}, Celda: ${cellKey}, ShowAll: ${showAll}`);
    
    // Verificar disponibilidad real de cada profesor
    const teachersWithAvailability = teachers.map((teacher: Teacher) => {
      const isAvailable = isTeacherAvailable(teacher.rut, time, dayKey);
      return {
        ...teacher,
        isAvailableForTimeSlot: isAvailable
      };
    });
    
    // Filtrar según la configuración del toggle
    let filteredTeachers;
    if (showAll) {
      // Mostrar todos los profesores (disponibles y no disponibles)
      filteredTeachers = teachersWithAvailability;
      console.log(`📋 Mostrando TODOS los profesores (${teachersWithAvailability.length})`);
    } else {
      // Mostrar solo los profesores disponibles
      filteredTeachers = teachersWithAvailability.filter((teacher: Teacher & { isAvailableForTimeSlot: boolean }) => teacher.isAvailableForTimeSlot);
      console.log(`📋 Mostrando solo profesores DISPONIBLES (${filteredTeachers.length})`);
    }

    console.log(`📊 Total profesores: ${teachers.length}, Disponibles para ${cellKey}: ${teachersWithAvailability.filter((t: Teacher & { isAvailableForTimeSlot: boolean }) => t.isAvailableForTimeSlot).length}, Mostrando: ${filteredTeachers.length}`);
    console.log(`📋 Lista de profesores para dropdown:`, filteredTeachers.map((t: Teacher & { isAvailableForTimeSlot: boolean }) => `${t.name} (${t.rut}) - ${t.isAvailableForTimeSlot ? 'Disponible' : 'No disponible'}`));

    return filteredTeachers;
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="flex h-screen w-full relative">
        {/* Contador de conflictos flotante */}
        {conflicts.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setShowConflictDetails(!showConflictDetails)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{conflicts.length} Conflicto{conflicts.length !== 1 ? 's' : ''}</span>
              {showConflictDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {/* Barra expandible de detalles de conflictos */}
            {showConflictDetails && (
              <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-red-200 overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                  <h3 className="font-medium text-red-800">Detalles de Conflictos</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="px-4 py-2 border-b border-gray-100 last:border-b-0">
                      <p className="text-sm text-red-700">{conflict}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notificación de conflicto temporal */}
        {showNotification && lastConflictNotification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">{lastConflictNotification}</span>
              <button
                onClick={() => setShowNotification(false)}
                className="ml-2 hover:bg-red-600 rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Panel lateral izquierdo - Lista de cursos */}
        <div className="w-80 border-r bg-card p-4 flex-shrink-0">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-4">Cursos Disponibles</h2>
              {/* Filtros */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>{" "}
                <Select
                  value={selectedCareer}
                  onValueChange={handleCareerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione la carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    {careers.map((career) => (
                      <SelectItem key={career} value={career}>
                        {career}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>{" "}
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                  disabled={selectedCareer === ""}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedCareer === ""
                          ? "Primero seleccione una carrera"
                          : "Seleccione el semestre"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>                    {semesters.map((semester) => (
                      <SelectItem key={semester} value={semester.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>Semestre {semester}</span>
                          {schedulesByCareerAndSemester[getScheduleKey(selectedCareer, semester.toString())] && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Guardado
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>{" "}
              {/* Lista de cursos */}
              <div className="space-y-2">
                {loading ? (
                  <div>Cargando cursos...</div>
                ) : selectedCareer === "" || selectedSemester === "" ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">
                      Seleccione una carrera y semestre para ver los cursos
                      disponibles
                    </p>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">
                      No hay cursos disponibles con los filtros seleccionados
                    </p>
                  </div>                ) : (
                  filteredCourses.map((course) => (
                    <div key={course.key} className="relative group">
                      <Draggable
                        id={course.key}
                        data={{ course }}
                        className="block"
                      >
                        <div
                          className={`p-3 border rounded-lg hover:bg-accent transition-colors cursor-grab active:cursor-grabbing ${getCourseColor(
                            course.code
                          )}`}
                        >
                          <div className="font-medium text-sm break-words">
                            {course.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {course.code}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs">
                            <Users className="h-3 w-3" />
                            <span>Demanda: {course.demand}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {course.career}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Sem. {course.semester}
                            </Badge>
                            {course.paralelo && (
                              <Badge variant="default" className="text-xs">
                                {course.paralelo}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Draggable>
                      
                      {/* Botón de eliminar - Solo para paralelos diferentes a C1 */}
                      {course.paralelo && course.paralelo !== "C1" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteParalelo(course.key, course.paralelo);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                )}</div>            </div>
            
            {/* Botón Crear nuevo paralelo - Solo mostrar cuando hay carrera y semestre seleccionados */}
            {selectedCareer && selectedSemester && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCreateParaleloModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear nuevo paralelo
                </Button>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={clearAllSchedule}
                disabled={!selectedSemester}
              >
                Limpiar Semestre
              </Button>
            </div>

            {/* Dropdown de Archivo - Solo mostrar cuando hay carrera y semestre seleccionados */}
            {selectedCareer && selectedSemester && (
              <div className="mt-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSchedules}
                  style={{ display: "none" }}
                  id="import-file"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Archivo
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() =>
                      document.getElementById("import-file")?.click()
                    }>
                      📁 Importar JSON
                    </DropdownMenuItem>                    <DropdownMenuItem 
                      onClick={exportSchedulesJSON}
                      disabled={Object.keys(schedulesByCareerAndSemester).length === 0}
                    >
                      📄 Exportar como JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={exportSchedules}
                      disabled={Object.keys(schedulesByCareerAndSemester).length === 0}
                    >
                      📊 Exportar como Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={clearAllCache}
                      className="text-destructive focus:text-destructive"
                    >
                      🗑️ Limpiar Todo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>        {/* Panel principal - Horario */}
        <div className="flex-1 p-4 w-full min-w-0 overflow-auto">
          <div className="space-y-4 w-full">
            {" "}
            <div className="flex items-center justify-between">
              <div>                <h1 className="text-3xl font-bold tracking-tight">
                  Gestión de Horarios
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground">
                    Arrastra los cursos al horario para programarlos
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border rounded">
                      Ctrl
                    </kbd>
                    <span>+</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border rounded">
                      S
                    </kbd>
                    <span>para guardar</span>
                  </div>
                </div>
                {getBackgroundSchedules().length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Capas de fondo:
                    </span>
                    {getBackgroundSchedules().map((bg) => (
                      <Badge
                        key={bg.semester}
                        variant="outline"
                        className="text-xs opacity-60"
                      >
                        Semestre {bg.semester}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {/* Controles para mostrar semestres anteriores */}
                {selectedSemester && parseInt(selectedSemester) > 1 && (
                  <div className="flex flex-wrap items-center gap-4">
                    {parseInt(selectedSemester) > 1 && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-previous-1"
                          checked={showPreviousSemesters.includes("semestre-1")}
                          onCheckedChange={() =>
                            handleTogglePreviousSemester("semestre-1")
                          }
                        />
                        <Label
                          htmlFor="show-previous-1"
                          className="flex items-center gap-1"
                        >
                          {showPreviousSemesters.includes("semestre-1") ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                          Ver semestre {parseInt(selectedSemester) - 1}
                        </Label>
                      </div>
                    )}

                    {parseInt(selectedSemester) > 2 && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="show-previous-2"
                          checked={showPreviousSemesters.includes("semestre-2")}
                          onCheckedChange={() =>
                            handleTogglePreviousSemester("semestre-2")
                          }
                        />
                        <Label
                          htmlFor="show-previous-2"
                          className="flex items-center gap-1"
                        >
                          {showPreviousSemesters.includes("semestre-2") ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                          Ver semestre {parseInt(selectedSemester) - 2}
                        </Label>
                      </div>
                    )}
                  </div>)}   
              </div>
            </div>            {/* Tabla de horarios */}            <div className="rounded-md border bg-card overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-fit">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="h-12 px-8 text-center align-middle font-medium text-muted-foreground w-32">
                        Bloque
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className="h-12 px-4 text-center align-middle font-medium text-muted-foreground min-w-48"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentSchedule().map((slot, index) => (
                      <tr
                        key={index}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle font-medium text-sm bg-muted/25">
                          <div className="text-center">
                            {(() => {
                              const timeSlotData = timeSlotMap.get(slot.time);
                              return timeSlotData ? (
                                <>
                                  <div className="text-lg font-bold text-primary">
                                    {timeSlotData.nombre}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {timeSlotData.horario}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm">{slot.time}</div>
                              );
                            })()}
                          </div>
                        </td>
                        {dayKeys.map((dayKey) => {
                          const content = getCellContent(slot, dayKey);
                          const cellId = `${slot.time}-${dayKey}`;
                          const backgroundSchedules = getBackgroundSchedules();

                          return (
                            <td
                              key={dayKey}
                              className="p-1 align-top text-center relative"
                            >
                              <div
                                className={`min-h-12 cursor-pointer transition-colors rounded ${
                                  content
                                    ? "bg-primary/10 hover:bg-primary/20"
                                    : "hover:bg-accent/50 border-2 border-dashed border-transparent hover:border-muted-foreground/20"
                                } ${
                                  selectedCell?.time === slot.time &&
                                  selectedCell?.day === dayKey
                                    ? "ring-2 ring-primary"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCellClick(slot.time, dayKey)
                                }
                              >
                                <Droppable
                                  id={cellId}
                                  data={{
                                    type: "schedule-cell",
                                    time: slot.time,
                                    day: dayKey,
                                  }}
                                  className="h-full flex flex-col gap-0.5 p-0.5"
                                >
                                  {/* Renderizar cursos de fondo (efecto cebolla) primero */}
                                  {backgroundSchedules.map((bg) => {
                                    const bgSlot = bg.schedule.find(
                                      (s) => s.time === slot.time
                                    );
                                    const bgContent = bgSlot
                                      ? getCellContent(bgSlot, dayKey)
                                      : null;                                    return bgContent ? (
                                      <div
                                        key={bg.semester}
                                        className={`pointer-events-auto ${bg.opacity} flex-shrink-0`}
                                      >
                                        <div className="p-0.5">
                                          <div
                                            className={`rounded px-1 py-0.5 text-[7px] font-medium border border-dashed ${getCourseColor(
                                              bgContent.code
                                            )} bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all`}
                                          >
                                            <div
                                              className="font-semibold text-foreground truncate"
                                              title={bgContent.name}
                                            >
                                              {bgContent.name.substring(0, 15)}...
                                            </div>
                                            <div className="text-[6px] text-muted-foreground">
                                              Sem {bg.semester}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : null;
                                  })}                                  {/* Curso actual del semestre seleccionado - debe aparecer DESPUÉS de los cursos de fondo */}
                                  {content ? (
                                    <div className="relative group flex-shrink-0">
                                      <div className="p-0.5 bg-background/95 dark:bg-background/95 backdrop-blur-sm rounded">
                                        <div
                                          className={`rounded cursor-pointer transition-all ${
                                            expandedCourses[content.key] 
                                              ? `px-2 py-1 text-xs font-medium border-2 ${getCourseColor(content.code)} shadow-lg hover:shadow-xl`
                                              : `px-1 py-0.5 text-[8px] font-medium border-2 ${getCourseColor(content.code)} shadow-md hover:shadow-lg`
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCourseExpansion(content.key);
                                          }}
                                        >
                                          {expandedCourses[content.key] ? (
                                            // Vista expandida (información completa)
                                            <>
                                              {/* Nombre del curso completo */}
                                              <div
                                                className="font-bold text-foreground truncate text-xs"
                                                title={content.name}
                                              >
                                                {content.name} {content.paralelo && `(${content.paralelo})`}
                                              </div>

                                              {/* Sala - Dropdown completo */}
                                              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                                <Popover 
                                                  open={openRoomPopover === `${slot.time}-${dayKey}`} 
                                                  onOpenChange={(open) => setOpenRoomPopover(open ? `${slot.time}-${dayKey}` : null)}
                                                >
                                                  <PopoverTrigger asChild>
                                                    <Button
                                                      variant="outline"
                                                      role="combobox"
                                                      aria-expanded={openRoomPopover === `${slot.time}-${dayKey}`}
                                                      className="h-5 text-[9px] px-1 bg-white dark:bg-gray-900 justify-between w-full"
                                                    >
                                                      <div className="flex items-center gap-1">
                                                        <MapPin className="h-2 w-2" />
                                                        <span className="truncate">
                                                          {content.selectedRoom || "Sala"}
                                                        </span>
                                                      </div>
                                                    </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command>
                                                      <CommandInput placeholder="Buscar sala..." className="h-7" />
                                                      <CommandEmpty>No se encontró ninguna sala.</CommandEmpty>
                                                      <CommandGroup className="max-h-48 overflow-auto">
                                                        {getAvailableRooms(slot.time).map((room) => (
                                                          <CommandItem
                                                            key={room.nombre}
                                                            onSelect={() => {
                                                              updateSelectedRoom(slot.time, dayKey, room.nombre);
                                                              setOpenRoomPopover(null);
                                                            }}
                                                            className="cursor-pointer"
                                                          >
                                                            <Check
                                                              className={`mr-2 h-3 w-3 ${
                                                                content.selectedRoom === room.nombre ? "opacity-100" : "opacity-0"
                                                              }`}
                                                            />
                                                            <div className="text-xs">
                                                              <div className="font-medium">{room.nombre}</div>
                                                              <div className="text-muted-foreground text-[10px]">
                                                                {room.sede} • Cap: {room.capacidad || 'N/A'}
                                                              </div>
                                                            </div>
                                                          </CommandItem>
                                                        ))}
                                                      </CommandGroup>
                                                    </Command>
                                                  </PopoverContent>
                                                </Popover>
                                              </div>

                                              {/* Profesor - Dropdown completo */}
                                              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                                <Popover 
                                                  open={openTeacherPopover === `${slot.time}-${dayKey}`} 
                                                  onOpenChange={(open) => {
                                                    if (open) {
                                                      console.log(`🖱️ Abriendo dropdown de profesores para curso: ${content.code} en ${slot.time}`);
                                                    }
                                                    setOpenTeacherPopover(open ? `${slot.time}-${dayKey}` : null);
                                                  }}
                                                >
                                                  <PopoverTrigger asChild>
                                                    <Button
                                                      variant="outline"
                                                      role="combobox"
                                                      aria-expanded={openTeacherPopover === `${slot.time}-${dayKey}`}
                                                      className="h-5 text-[9px] px-1 bg-white dark:bg-gray-900 justify-between w-full"
                                                    >
                                                      <div className="flex items-center gap-1">
                                                        <GraduationCap className="h-2 w-2" />
                                                        <span className="truncate">
                                                          {content.selectedTeacher ? (
                                                            (() => {
                                                              const teacher = getAvailableTeachers(content.code, content.career, slot.time, dayKey, showAllTeachers).find((teacher: Teacher & { isAvailableForTimeSlot: boolean }) => teacher.rut === content.selectedTeacher);
                                                              return teacher ? teacher.name : content.selectedTeacher;
                                                            })()
                                                          ) : "Profesor"}
                                                        </span>
                                                      </div>
                                                    </Button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command>
                                                      <CommandInput placeholder="Buscar profesor..." className="h-7" />
                                                      <CommandEmpty>No se encontró ningún profesor.</CommandEmpty>
                                                      <div className="px-3 py-2 border-b border-border bg-muted/50">
                                                        <div className="flex items-center space-x-2">
                                                          <Switch
                                                            id={`show-all-teachers-${slot.time}-${dayKey}`}
                                                            checked={showAllTeachers[`${slot.time}-${dayKey}`] || false}
                                                            onCheckedChange={(checked) => {
                                                              const key = `${slot.time}-${dayKey}`;
                                                              setShowAllTeachers(prev => ({
                                                                ...prev,
                                                                [key]: checked
                                                              }));
                                                            }}
                                                          />
                                                          <Label htmlFor={`show-all-teachers-${slot.time}-${dayKey}`} className="text-xs cursor-pointer">
                                                            {showAllTeachers[`${slot.time}-${dayKey}`] ? 'Mostrar todos' : 'Solo disponibles'}
                                                          </Label>
                                                        </div>
                                                      </div>
                                                      <CommandGroup className="max-h-48 overflow-auto">
                                                        {getAvailableTeachers(content.code, content.career, slot.time, dayKey, showAllTeachers).map((teacher) => (
                                                          <CommandItem
                                                            key={teacher.rut}
                                                            onSelect={() => {
                                                              updateSelectedTeacher(slot.time, dayKey, teacher.rut);
                                                              setOpenTeacherPopover(null);
                                                            }}
                                                            className="cursor-pointer"
                                                          >
                                                            <Check
                                                              className={`mr-2 h-3 w-3 ${
                                                                content.selectedTeacher === teacher.rut ? "opacity-100" : "opacity-0"
                                                              }`}
                                                            />
                                                            <div className="text-xs">
                                                              <div className="font-medium">{teacher.name}</div>
                                                              <div className="text-muted-foreground text-[10px]">
                                                                {teacher.rut} • {teacher.isAvailableForTimeSlot ? 'Disponible' : 'No disponible'}
                                                              </div>
                                                            </div>
                                                          </CommandItem>
                                                        ))}
                                                      </CommandGroup>
                                                    </Command>
                                                  </PopoverContent>
                                                </Popover>
                                              </div>
                                            </>
                                          ) : (
                                            // Vista condensada (información mínima)
                                            <>
                                              {/* Nombre del curso - Ultra compacto */}
                                              <div
                                                className="font-bold text-foreground truncate leading-tight"
                                                title={content.name}
                                              >
                                                {content.name.substring(0, 20)}...
                                              </div>

                                              {/* Información compacta en una línea */}
                                              <div className="flex items-center justify-between mt-0.5 gap-1">
                                                {/* Sala compacta */}
                                                <div className="flex items-center gap-0.5">
                                                  <MapPin className="h-2 w-2" />
                                                  <span className="text-[7px] truncate">
                                                    {content.selectedRoom?.substring(0, 6) || "Sala"}
                                                  </span>
                                                </div>

                                                {/* Profesor compacto */}
                                                <div className="flex items-center gap-0.5">
                                                  <GraduationCap className="h-2 w-2" />
                                                  <span className="text-[7px] truncate">
                                                    {content.selectedTeacher ? (
                                                      (() => {
                                                        const teacher = getAvailableTeachers(content.code, content.career, slot.time, dayKey, showAllTeachers).find((teacher: Teacher & { isAvailableForTimeSlot: boolean }) => teacher.rut === content.selectedTeacher);
                                                        return teacher ? teacher.name.substring(0, 8) : content.selectedTeacher.substring(0, 8);
                                                      })()
                                                    ) : "Prof"}
                                                 
                                                  </span>
                                                </div>
                                              </div>
                                            </>
                                          )}
                                          
                                          {/* Botón de eliminar curso */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeCourseFromSchedule(content.key);
                                            }}
                                            className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                          >
                                            <X className="h-2 w-2" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    // Solo mostrar placeholder si no hay cursos de fondo o curso actual
                                    backgroundSchedules.every((bg) => {
                                      const bgSlot = bg.schedule.find(
                                        (s) => s.time === slot.time
                                      );
                                      const bgContent = bgSlot ? getCellContent(bgSlot, dayKey) : null;
                                      return !bgContent;
                                    }) ? (
                                      <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] opacity-50">
                                        Arrastra curso
                                      </div>
                                    ) : null
                                  )}
                                </Droppable>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>{" "}
            <div className="grid gap-4 md:grid-cols-1">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Estadísticas del Semestre {selectedSemester}
                </h3>
                {selectedSemester ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Bloques ocupados:
                      </span>
                      <span className="text-sm font-medium">
                        {getCurrentSchedule().reduce(
                          (count: number, slot: TimeSlot) => {
                            return (
                              count +
                              dayKeys.filter((day) => getCellContent(slot, day))
                                .length
                            );
                          },
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total bloques:
                      </span>
                      <span className="text-sm font-medium">
                        {getCurrentSchedule().length * days.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Utilización:
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          (getCurrentSchedule().reduce(
                            (count: number, slot: TimeSlot) => {
                              return (
                                count +
                                dayKeys.filter((day) =>
                                  getCellContent(slot, day)
                                ).length
                              );
                            },
                            0
                          ) /
                            (getCurrentSchedule().length * days.length)) *
                            100
                        )}
                        %
                      </span>
                    </div>                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Carreras-Semestres guardados:
                      </span>
                      <span className="text-sm font-medium">
                        {Object.keys(schedulesByCareerAndSemester).length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm">
                      Seleccione un semestre para ver las estadísticas
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Overlay para mostrar el elemento siendo arrastrado */}
      <DragOverlay>
        {activeCourse && (
          <div
            className={`p-3 border rounded-lg shadow-lg opacity-90 transform rotate-3 ${getCourseColor(
              activeCourse.code
            )}`}
          >            <div className="font-medium text-sm text-foreground">
              {activeCourse.name} {activeCourse.paralelo && `(${activeCourse.paralelo})`}
            </div><div className="text-xs text-muted-foreground mt-1">
              {activeCourse.code}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {activeCourse.career}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Sem. {activeCourse.semester}
              </Badge>
              {activeCourse.paralelo && (
                <Badge variant="default" className="text-xs">
                  {activeCourse.paralelo}
                </Badge>
              )}
            </div>
          </div>
        )}
      </DragOverlay>
      
      {/* Modal para crear nuevo paralelo */}
      {showCreateParaleloModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Paralelo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona la asignatura para crear un nuevo paralelo:
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getUniqueSubjects().map((subject) => {
                const nextParalelo = getNextAvailableParalelo(subject.code);
                return (
                  <Button
                    key={`${subject.code}-${subject.name}`}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleCreateParaleloForSubject(subject)}
                  >
                    <div>
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {subject.code} - Crear {nextParalelo}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateParaleloModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
