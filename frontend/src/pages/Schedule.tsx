import { useState, useEffect } from "react";
import type { Course, ScheduledCourse, TimeSlotData, Teacher, Classroom } from "@/lib/types";
import coursesData from "@/lib/courses.json";
import teachersData from "@/lib/teachers.json";
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
import { Search, X, Users, Eye, EyeOff, Download, MapPin, GraduationCap, Check, ChevronsUpDown } from "lucide-react";
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

export default function Schedule() {
  const { selectedSede } = useSedeContext();  // Cambiar de schedule único a schedules por carrera y semestre con persistencia
  const [schedulesByCareerAndSemester, setSchedulesByCareerAndSemester] =
    useState<ScheduleByCareerAndSemester>(() => {
      // Cargar datos del localStorage al inicializar
      const saved = localStorage.getItem("schedulesByCareerAndSemester");
      return saved ? JSON.parse(saved) : {};
    });const [courses, setCourses] = useState<Course[]>([]);
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
  const [searchTerm, setSearchTerm] = useState("");  // Estado para controlar la visualización de semestres anteriores (onion layers)
  const [showPreviousSemesters, setShowPreviousSemesters] = useState<string[]>([
    "semestre-1",
    "semestre-2",
  ]);
  
  // Estados para controlar los popovers abiertos
  const [openRoomPopover, setOpenRoomPopover] = useState<string | null>(null);
  const [openTeacherPopover, setOpenTeacherPopover] = useState<string | null>(null);

  // Cache de cursos para mostrar información completa
  const cursosCache: Record<string, Course> = {};
  courses.forEach((course) => {
    cursosCache[course.key] = course;
  });  // Efecto para guardar en localStorage cuando cambien los horarios
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

  // Función helper para generar clave única de carrera + semestre
  const getScheduleKey = (career: string, semester: string) => {
    return `${career}-${semester}`;
  };
  useEffect(() => {
    setTimeout(() => {
      console.log("Cargando cursos:", coursesData.length, "cursos encontrados");
      setCourses(coursesData as Course[]);
      setTeachers(teachersData as Teacher[]);
      setClassrooms(classroomsData as Classroom[]);
      setLoading(false);
    }, 500);
  }, []);
  // Obtener carreras únicas
  const careers = [...new Set(courses.map((course) => course.career))].sort();
  // Obtener semestres únicos según la carrera seleccionada
  const semesters =
    selectedCareer === ""
      ? []
      : [
          ...new Set(
            courses
              .filter((course) => course.career === selectedCareer)
              .map((course) => course.semester)
          ),
        ].sort((a, b) => a - b);
  // Resetear semestre cuando cambie la carrera
  const handleCareerChange = (career: string) => {
    setSelectedCareer(career);
    setSelectedSemester(""); // Resetear semestre cuando cambie la carrera
  };

  // Manejar cambio en la visualización de semestres anteriores
  const handleTogglePreviousSemester = (semestre: string) => {
    setShowPreviousSemesters((prev) => {
      if (prev.includes(semestre)) {
        return prev.filter((s) => s !== semestre);
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
  const filteredCourses = courses.filter((course) => {
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
    const isAlreadyScheduled = currentSchedule.some((slot) =>
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
  const handleDragEnd = (event: DragEndEvent) => {
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
      const { time, day } = dropData;      // Verificar si ya existe un curso en esa celda
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

      const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
      setSchedulesByCareerAndSemester((prevSchedules) => {
        const currentSchedule =
          prevSchedules[scheduleKey] ||
          defaultTimeSlots.map((slot) => ({ ...slot }));
        return {
          ...prevSchedules,
          [scheduleKey]: currentSchedule.map((slot) =>
            slot.time === time ? { ...slot, [day]: scheduledCourse } : slot
          ),
        };
      });
    }
  };  const removeCourseFromSchedule = (
    time: string,
    day: keyof Omit<TimeSlot, "time">
  ) => {
    if (!selectedSemester || !selectedCareer) return;

    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    setSchedulesByCareerAndSemester((prevSchedules) => {
      const currentSchedule =
        prevSchedules[scheduleKey] ||
        defaultTimeSlots.map((slot) => ({ ...slot }));
      return {
        ...prevSchedules,
        [scheduleKey]: currentSchedule.map((slot) =>
          slot.time === time ? { ...slot, [day]: null } : slot
        ),
      };
    });
  };
  // Función para actualizar la sala seleccionada de un curso
  const updateSelectedRoom = (
    time: string,
    day: keyof Omit<TimeSlot, "time">,
    roomName: string
  ) => {
    if (!selectedSemester || !selectedCareer) return;

    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    setSchedulesByCareerAndSemester((prevSchedules) => {
      const currentSchedule =
        prevSchedules[scheduleKey] ||
        defaultTimeSlots.map((slot) => ({ ...slot }));
      return {
        ...prevSchedules,
        [scheduleKey]: currentSchedule.map((slot) => {
          if (slot.time === time) {
            const currentCourse = slot[day] as ScheduledCourse;
            if (currentCourse) {
              return {
                ...slot,
                [day]: {
                  ...currentCourse,
                  selectedRoom: roomName
                }
              };
            }
          }
          return slot;
        }),
      };
    });
  };
  // Función para actualizar el profesor seleccionado de un curso
  const updateSelectedTeacher = (
    time: string,
    day: keyof Omit<TimeSlot, "time">,
    teacherRut: string
  ) => {
    if (!selectedSemester || !selectedCareer) return;

    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    setSchedulesByCareerAndSemester((prevSchedules) => {
      const currentSchedule =
        prevSchedules[scheduleKey] ||
        defaultTimeSlots.map((slot) => ({ ...slot }));
      return {
        ...prevSchedules,
        [scheduleKey]: currentSchedule.map((slot) => {
          if (slot.time === time) {
            const currentCourse = slot[day] as ScheduledCourse;
            if (currentCourse) {
              return {
                ...slot,
                [day]: {
                  ...currentCourse,
                  selectedTeacher: teacherRut
                }
              };
            }
          }
          return slot;
        }),
      };
    });
  };  // Función para obtener salas disponibles para un bloque específico
  const getAvailableRooms = (time: string) => {
    if (!selectedSemester || !selectedCareer) return [];

    // Obtener todas las salas ocupadas en este bloque de tiempo en TODOS los horarios guardados
    const occupiedRooms = new Set<string>();
    
    // Verificar en todos los schedules guardados (todos los semestres y carreras)
    Object.values(schedulesByCareerAndSemester).forEach(schedule => {
      const timeSlot = schedule.find(slot => slot.time === time);
      if (timeSlot) {
        dayKeys.forEach(dayKey => {
          const course = timeSlot[dayKey] as ScheduledCourse;
          if (course?.selectedRoom) {
            occupiedRooms.add(course.selectedRoom);
          }
        });
      }
    });    // Mapear sede del contexto a valor en JSON de classrooms
    const sedeFilter = selectedSede === 'coquimbo' ? 'COQUIMBO' : 'ANTOFAGASTA';

    // Filtrar salas disponibles por sede y disponibilidad global, luego ordenar alfabéticamente
    return classrooms
      .filter(classroom => 
        !occupiedRooms.has(classroom.nombre) && 
        classroom.sede === sedeFilter
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

// Función para obtener profesores disponibles para un curso específico con filtrado por carrera
const getAvailableTeachers = (courseCode: string, career: string, time?: string) => {
  // Filtrar profesores que:
  // 1. Están disponibles (isAvailable: true)
  // 2. Pueden enseñar este curso (courseOffer incluye el código)
  
  // Primero filtramos los profesores por código de curso
  const courseProfessors = teachers.filter(teacher => 
    teacher.isAvailable && 
    teacher.courseOffer.includes(courseCode)
  );

  // Si se proporciona tiempo, verificar conflictos globales
  let availableProfessors = courseProfessors;
  if (time) {
    // Obtener todos los profesores ocupados en este bloque de tiempo en TODOS los horarios guardados
    const occupiedTeachers = new Set<string>();
    
    Object.values(schedulesByCareerAndSemester).forEach(schedule => {
      const timeSlot = schedule.find(slot => slot.time === time);
      if (timeSlot) {
        dayKeys.forEach(dayKey => {
          const course = timeSlot[dayKey] as ScheduledCourse;
          if (course?.selectedTeacher) {
            occupiedTeachers.add(course.selectedTeacher);
          }
        });
      }
    });

    // Filtrar profesores que no estén ocupados en este horario
    availableProfessors = courseProfessors.filter(teacher => 
      !occupiedTeachers.has(teacher.rut)
    );
  }
  
  // Ahora verificamos si alguno de estos profesores debería estar limitado a ciertas carreras
  // En este caso, filtramos en base a las reglas conocidas (Eric Ross solo ciertas combinaciones)
  return availableProfessors.filter(teacher => {
    // Caso especial para Eric Ross (128401768)
    if (teacher.rut === "128401768") {
      if (courseCode === "ECIN-00100" || courseCode === "ECIN-00115") {
        return career === "ITI"; // Eric solo da estos cursos en ITI
      } else if (courseCode === "ECIN-08606") {
        return career === "ICCI"; // Eric solo da este curso en ICCI
      }
    }
    // Todos los demás profesores pueden dar clases en cualquier carrera
    return true;
  });
};
  const clearAllSchedule = () => {
    if (!selectedSemester || !selectedCareer) return;

    const scheduleKey = getScheduleKey(selectedCareer, selectedSemester);
    setSchedulesByCareerAndSemester((prevSchedules) => ({
      ...prevSchedules,
      [scheduleKey]: defaultTimeSlots.map((slot) => ({ ...slot })),
    }));
  };  // Función para exportar horarios a Excel
  const exportSchedules = async () => {
    if (Object.keys(schedulesByCareerAndSemester).length === 0) {
      console.warn("No hay horarios para exportar");
      return;
    }

    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();

    // Iterar sobre cada carrera-semestre y crear una hoja
    Object.entries(schedulesByCareerAndSemester).forEach(([careerSemester, schedule]) => {
      const worksheet = workbook.addWorksheet(careerSemester);
      
      // Agregar encabezados
      const headers = ['Horario', ...days];
      worksheet.addRow(headers);

      // Agregar cada fila de horario
      schedule.forEach((slot) => {
        const row: (string | number)[] = [slot.time];
        
        dayKeys.forEach((dayKey) => {
          const course = getCellContent(slot, dayKey);
          if (course) {
            // Formato: Nombre del curso (Código)
            row.push(`${course.name} (${course.code})`);
          } else {
            row.push('');
          }
        });
        
        worksheet.addRow(row);
      });

      // Ajustar el ancho de las columnas
      worksheet.getColumn(1).width = 15; // Horario
      for (let i = 2; i <= days.length + 1; i++) {
        worksheet.getColumn(i).width = 40; // Días de la semana
      }
    });

    // Crear una hoja de resumen
    const summaryWorksheet = workbook.addWorksheet('Resumen');
    summaryWorksheet.addRow(['Resumen de Horarios por Carrera y Semestre']);
    summaryWorksheet.addRow(['']); // Línea vacía
    summaryWorksheet.addRow(['Carrera-Semestre', 'Total Cursos', 'Bloques Ocupados', 'Total Bloques', 'Utilización']);

    Object.entries(schedulesByCareerAndSemester).forEach(([careerSemester, schedule]) => {
      const totalCourses = schedule.reduce((count, slot) => {
        return count + dayKeys.filter(day => getCellContent(slot, day)).length;
      }, 0);
      
      const totalBlocks = schedule.length * days.length;
      const utilization = Math.round((totalCourses / totalBlocks) * 100);
      
      summaryWorksheet.addRow([
        careerSemester,
        totalCourses,
        totalCourses,
        totalBlocks,
        `${utilization}%`
      ]);
    });

    // Ajustar columnas del resumen
    summaryWorksheet.getColumn(1).width = 20;
    summaryWorksheet.getColumn(2).width = 15;
    summaryWorksheet.getColumn(3).width = 18;
    summaryWorksheet.getColumn(4).width = 15;
    summaryWorksheet.getColumn(5).width = 12;

    // Exportar el archivo
    const fileName = `horarios-por-carrera-semestre-${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log(`Horarios exportados a ${fileName}`);
  };
  // Función para exportar horarios a JSON
  const exportSchedulesJSON = () => {
    if (Object.keys(schedulesByCareerAndSemester).length === 0) {
      console.warn("No hay horarios para exportar");
      return;
    }

    const dataStr = JSON.stringify(schedulesByCareerAndSemester, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = `horarios-por-carrera-semestre-${new Date().toISOString().split('T')[0]}.json`;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log(`Horarios exportados a ${fileName}`);
  };
  // Función para importar horarios
  const importSchedules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSchedulesByCareerAndSemester(imported);
        console.log("Horarios importados exitosamente");
      } catch (error) {
        console.error("Error al importar horarios:", error);
      }
    };
    reader.readAsText(file);
  };

  // ...existing code...
  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >      <div className="flex h-screen w-full">        {/* Panel lateral izquierdo - Lista de cursos */}
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
                    <Draggable
                      key={course.key}
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
                        </div>
                      </div>
                    </Draggable>
                  ))
                )}</div>            </div>
            
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
                                className={`min-h-20 cursor-pointer transition-colors rounded ${
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
                                  className="h-full flex flex-col gap-1 p-1"
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
                                        <div className="p-1.5">
                                          <div
                                            className={`rounded px-2 py-1.5 text-xs font-medium border-2 border-dashed ${getCourseColor(
                                              bgContent.code
                                            )} bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all`}
                                          >
                                            <div
                                              className="font-semibold text-foreground truncate text-[10px]"
                                              title={bgContent.name}
                                            >
                                              {bgContent.name}
                                            </div>
                                            <div className="text-[8px] text-muted-foreground flex items-center justify-between mt-0.5">
                                              <span className="truncate font-mono">
                                                {bgContent.code}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-[7px] px-1 py-0 h-auto bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700"
                                              >
                                                Sem {bg.semester}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5 text-[8px] text-muted-foreground">
                                              <Users className="h-2 w-2" />
                                              <span>
                                                Demanda:{" "}
                                                {bgContent.demand}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : null;
                                  })}                                  {/* Curso actual del semestre seleccionado - debe aparecer DESPUÉS de los cursos de fondo */}
                                  {content ? (
                                    <div className="relative group flex-shrink-0">
                                      <div className="p-2 bg-background/95 dark:bg-background/95 backdrop-blur-sm rounded">
                                        <div
                                          className={`rounded px-3 py-2 text-xs font-medium border-2 ${getCourseColor(
                                            content.code
                                          )} shadow-lg hover:shadow-xl transition-all`}
                                        >                                          <div
                                            className="font-bold text-foreground truncate text-base"
                                            title={content.name}
                                          >
                                            {content.name}
                                          </div>
                                          <div className="text-sm text-muted-foreground mt-1 font-mono">
                                            {content.code}
                                          </div>
                                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>
                                              Demanda: {content.demand}
                                            </span>
                                          </div>                                          {/* Sala sugerida - Solo mostrar información */}
                                          {content.suggestedRoom && (
                                            <div className="mt-2 p-1 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                              <div className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span>Sugerida: {content.suggestedRoom}</span>
                                              </div>
                                            </div>
                                          )}                                          {/* Dropdown de sala seleccionada con buscador */}
                                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              <span>Sala:</span>
                                            </div>
                                            <Popover 
                                              open={openRoomPopover === `${slot.time}-${dayKey}`} 
                                              onOpenChange={(open) => setOpenRoomPopover(open ? `${slot.time}-${dayKey}` : null)}
                                            >
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  role="combobox"
                                                  aria-expanded={openRoomPopover === `${slot.time}-${dayKey}`}
                                                  className="h-7 text-xs px-2 bg-white dark:bg-gray-900 justify-between w-full"
                                                >
                                                  {content.selectedRoom ? 
                                                    getAvailableRooms(slot.time).find(room => room.nombre === content.selectedRoom)?.nombre || content.selectedRoom
                                                    : "Seleccionar sala"
                                                  }
                                                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
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
                                          </div>                                          {/* Dropdown de profesor seleccionado con buscador */}
                                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                              <GraduationCap className="h-3 w-3" />
                                              <span>Profesor:</span>
                                            </div>
                                            <Popover 
                                              open={openTeacherPopover === `${slot.time}-${dayKey}`} 
                                              onOpenChange={(open) => setOpenTeacherPopover(open ? `${slot.time}-${dayKey}` : null)}
                                            >
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  role="combobox"
                                                  aria-expanded={openTeacherPopover === `${slot.time}-${dayKey}`}
                                                  className="h-7 text-xs px-2 bg-white dark:bg-gray-900 justify-between w-full"
                                                >
                                                  {content.selectedTeacher ? 
                                                    getAvailableTeachers(content.code, content.career, slot.time).find(teacher => teacher.rut === content.selectedTeacher)?.name || content.selectedTeacher
                                                    : "Seleccionar profesor"
                                                  }
                                                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                  <CommandInput placeholder="Buscar profesor..." className="h-7" />
                                                  <CommandEmpty>No se encontró ningún profesor.</CommandEmpty>
                                                  <CommandGroup className="max-h-48 overflow-auto">
                                                    {getAvailableTeachers(content.code, content.career, slot.time).map((teacher) => (
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
                                                            {teacher.rut}
                                                          </div>
                                                        </div>
                                                      </CommandItem>
                                                    ))}
                                                  </CommandGroup>
                                                </Command>
                                              </PopoverContent>
                                            </Popover>
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeCourseFromSchedule(
                                            slot.time,
                                            dayKey
                                          );
                                        }}
                                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    // Solo mostrar placeholder si no hay cursos de fondo o curso actual
                                    !backgroundSchedules.some((bg) => {
                                      const bgSlot = bg.schedule.find(
                                        (s) => s.time === slot.time
                                      );
                                      return bgSlot
                                        ? getCellContent(bgSlot, dayKey)
                                        : false;
                                    })
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
              {activeCourse.name}
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
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
