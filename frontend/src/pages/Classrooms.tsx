import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Classroom, TimeSlotData, ScheduledCourse } from '@/lib/types'
import classroomsData from '@/lib/classrooms.json'
import timeSlotsData from '@/lib/timeSlot.json'
import { useSedeContext } from '@/lib/sede-context'
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ClassroomTimeSlot {
  time: string
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
}

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

const defaultTimeSlots: ClassroomTimeSlot[] = (timeSlotsData as TimeSlotData[])
  .filter(slot => slot.horario !== null)
  .map(slot => ({ time: slot.horario! }))

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export default function Classrooms() {
  const { selectedSede } = useSedeContext()
  // --- NUEVO: Estados para bloques y días dinámicos ---
  const [bloquesHorario, setBloquesHorario] = useState<any[]>([])
  const [dias, setDias] = useState<string[]>([])
  const [bloques, setBloques] = useState<string[]>([])
  const [schedule, setSchedule] = useState<ClassroomTimeSlot[]>(defaultTimeSlots)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedCell, setSelectedCell] = useState<{ time: string; day: keyof Omit<ClassroomTimeSlot, 'time'> } | null>(null)
  const [scheduleData, setScheduleData] = useState<ScheduleByCareerAndSemester>({})

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all')  // Load schedule data from localStorage
  const loadScheduleData = useCallback(() => {
    try {
      const storedData = localStorage.getItem('schedulesByCareerAndSemester')
      console.log('Raw localStorage data:', storedData)
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        console.log('Parsed schedule data:', parsedData)
        setScheduleData(parsedData)
      } else {
        console.log('No schedule data found in localStorage')
      }
    } catch (error) {
      console.error('Error loading schedule data:', error)
    }
  }, [])
  // Generate classroom schedule based on room assignments
  const generateClassroomSchedule = useCallback((classroomName: string): ClassroomTimeSlot[] => {
    console.log('Generating schedule for classroom:', classroomName)
    console.log('Available schedule data:', scheduleData)
    
    const classroomSchedule = defaultTimeSlots.map(slot => ({ ...slot }))
    
    // Process all careers and semesters
    Object.entries(scheduleData).forEach(([careerKey, timeSlots]) => {
      console.log(`Processing career: ${careerKey}`)
      timeSlots.forEach(timeSlot => {
        console.log(`Processing time slot: ${timeSlot.time}`)
        
        // Find matching time slot in classroom schedule
        const matchingSlot = classroomSchedule.find(slot => slot.time === timeSlot.time)
        if (!matchingSlot) {
          console.log(`No matching slot found for time: ${timeSlot.time}`)
          return
        }

        // Check each day for courses assigned to this classroom
        dayKeys.forEach((dayKey) => {
          const course = timeSlot[dayKey]
          if (course) {
            console.log(`Found course for ${dayKey}:`, course)
            console.log(`Course selectedRoom: ${course.selectedRoom}, looking for: ${classroomName}`)
            
            if (course.selectedRoom === classroomName) {
              console.log(`Match! Assigning course to ${dayKey}`)
              matchingSlot[dayKey] = `${course.name} - ${course.code}`
            }
          }
        })
      })
    })

    console.log('Final classroom schedule:', classroomSchedule)
    return classroomSchedule
  }, [scheduleData])

  // Map sede context values to classroom sede values
  const getSedeFilter = () => {
    return selectedSede === 'coquimbo' ? 'COQUIMBO' : 'ANTOFAGASTA'
  }

  // Filter classrooms based on search and sede from context
  const filteredClassrooms = useMemo(() => {
    const sedeFilter = getSedeFilter()
    return classrooms.filter(classroom => {
      const matchesSearch = classroom.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSede = classroom.sede === sedeFilter
      
      return matchesSearch && matchesSede
    })
  }, [classrooms, searchTerm, selectedSede])

  // Get unique classroom names for dropdown
  const availableClassrooms = useMemo(() => {
    return filteredClassrooms.map(c => c.nombre).sort()
  }, [filteredClassrooms])

  // Current classroom being displayed in grid
  const currentClassroom = useMemo(() => {
    if (selectedClassroom === 'all' || !selectedClassroom) {
      return filteredClassrooms[0] || null
    }
    return filteredClassrooms.find(c => c.nombre === selectedClassroom) || null
  }, [filteredClassrooms, selectedClassroom])
  useEffect(() => {
    // Load classrooms data
    setTimeout(() => {
      console.log('Cargando aulas:', classroomsData.length, 'aulas encontradas')
      setClassrooms(classroomsData as Classroom[])
    }, 500)

    // Load schedule data and set up listener for changes
    loadScheduleData()
    
    // Listen for localStorage changes (when Schedule page updates data)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'schedulesByCareerAndSemester') {
        loadScheduleData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadScheduleData])

  // Update classroom schedule when current classroom or schedule data changes
  useEffect(() => {
    if (currentClassroom && Object.keys(scheduleData).length > 0) {
      const updatedSchedule = generateClassroomSchedule(currentClassroom.nombre)
      setSchedule(updatedSchedule)
    } else {
      setSchedule(defaultTimeSlots)
    }
  }, [currentClassroom, scheduleData, generateClassroomSchedule])

  // Reset classroom selection when filters change
  useEffect(() => {
    if (selectedClassroom !== 'all' && !availableClassrooms.includes(selectedClassroom)) {
      setSelectedClassroom('all')
    }
  }, [availableClassrooms, selectedClassroom])

  const getCellContent = (slot: ClassroomTimeSlot, dayKey: keyof ClassroomTimeSlot) => {
    return slot[dayKey] as string || ''
  }

  const handleCellClick = (time: string, day: keyof Omit<ClassroomTimeSlot, 'time'>) => {
    setSelectedCell({ time, day })
  }

  // Calculate statistics based on actual classroom usage
  const occupiedSlots = useMemo(() => {
    return schedule.reduce((count, slot) => {
      return count + dayKeys.filter(day => getCellContent(slot, day)).length
    }, 0)
  }, [schedule])

  const totalSlots = schedule.length * days.length
  const utilizationPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0

  // --- NUEVO: Obtener bloques de horario desde la API ---
  useEffect(() => {
    fetch('http://localhost:3000/bloques-horario')
      .then(res => res.json())
      .then((data) => {
        setBloquesHorario(data)
        // Extraer días únicos y bloques únicos ordenados
        const uniqueDias = Array.from(new Set(data.map((b: any) => b.dia)))
        setDias(uniqueDias)
        const uniqueBloques = Array.from(new Set(data.map((b: any) => b.name))).sort()
        setBloques(uniqueBloques)
      })
      .catch(console.error)
  }, [])

  // --- NUEVO: Generar grilla dinámica de horarios ---
  const dynamicTimeSlots = useMemo(() => {
    // Cada bloque es una fila, cada día es una columna
    return bloques.map((bloque) => {
      const slot: any = { bloque };
      dias.forEach((dia) => {
        // Buscar el bloqueHorario correspondiente
        const found = bloquesHorario.find(bh => bh.dia === dia && bh.name === bloque)
        slot[dia] = found ? '' : undefined // Inicialmente vacío
      })
      return slot
    })
  }, [bloques, dias, bloquesHorario])

  // --- NUEVO: Generar matriz de ocupación real para la sala seleccionada ---
  const classroomScheduleMatrix = useMemo(() => {
    if (!currentClassroom || !bloquesHorario.length || !Object.keys(scheduleData).length) return [];
    // Crear matriz: filas = bloques, columnas = días
    return bloques.map((bloque) => {
      const row: any = { bloque };
      dias.forEach((dia) => {
        // Buscar el bloqueHorario correspondiente
        const bh = bloquesHorario.find(bh => bh.dia === dia && bh.name === bloque);
        if (!bh) {
          row[dia] = null;
          return;
        }
        let asignacion = null;
        // Mapear español a inglés para dayKey
        const dayMap: Record<string, string> = {
          'LUNES': 'monday',
          'MARTES': 'tuesday',
          'MIERCOLES': 'wednesday',
          'JUEVES': 'thursday',
          'VIERNES': 'friday',
          'SABADO': 'saturday',
        };
        const slotDayKey = dayMap[dia.toUpperCase()] || dia.toLowerCase();
        // Buscar en todos los schedules
        Object.values(scheduleData).forEach((timeSlots: any[]) => {
          timeSlots.forEach((slot) => {
            // Buscar el bloque correcto por nombre (A, B, ...)
            // Se asume que slot.bloque existe, si no, hacer el cruce por hora
            let slotBloque = slot.bloque;
            if (!slotBloque && slot.time && bh.horaInicio && bh.horaFin) {
              // Si no hay campo bloque, intentar cruce por hora
              const horaStr = `${bh.horaInicio.slice(11,16)} - ${bh.horaFin.slice(11,16)}`;
              if (slot.time === horaStr) {
                slotBloque = bh.name;
              }
            }
            if (slotBloque === bh.name) {
              const course = slot[slotDayKey];
              if (course && course.selectedRoom === currentClassroom.nombre) {
                asignacion = `${course.name} - ${course.code}`;
              }
            }
          });
        });
        row[dia] = asignacion;
      });
      return row;
    });
  }, [bloques, dias, bloquesHorario, scheduleData, currentClassroom]);

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="p-4 space-y-4 flex-1 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Aulas</h1>
            <p className="text-muted-foreground">Administra los horarios y asignaciones de aulas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar aula por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <span className="text-sm font-medium">Sede:</span>
            <span className="text-sm text-primary font-semibold">
              {selectedSede === 'coquimbo' ? 'COQUIMBO' : 'ANTOFAGASTA'}
            </span>
          </div>

          <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Seleccionar aula" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {availableClassrooms.length > 0 ? 'Primera aula disponible' : 'No hay aulas'}
              </SelectItem>
              {availableClassrooms.map((classroom) => (
                <SelectItem key={classroom} value={classroom}>
                  {classroom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current classroom info */}
        {currentClassroom && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{currentClassroom.nombre}</h2>
                <p className="text-muted-foreground">
                  Sede: {currentClassroom.sede} • 
                  Capacidad: {currentClassroom.capacidad || 'No especificada'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Grid */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-fit">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-40">
                    Bloque
                  </th>
                  {dias.map((dia) => (
                    <th key={dia} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground min-w-48">
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classroomScheduleMatrix.map((slot, index) => (
                  <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-9 align-middle font-medium text-sm bg-muted/25">
                      {slot.bloque}
                    </td>
                    {dias.map((dia) => {
                      const content = slot[dia];
                      return (
                        <td
                          key={dia}
                          className={`p-2 align-middle text-center cursor-pointer transition-colors min-h-16 ${
                            content 
                              ? 'bg-primary/10 hover:bg-primary/20' 
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          {content && (
                            <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium">
                              {content}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Aulas Disponibles</h3>
            <p className="text-3xl font-bold text-primary">
              {filteredClassrooms.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de {classrooms.length} totales
            </p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Sede Actual</h3>
            <p className="text-3xl font-bold text-primary">
              {selectedSede === 'coquimbo' ? 'COQUIMBO' : 'ANTOFAGASTA'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredClassrooms.length} aulas disponibles
            </p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Bloques Ocupados</h3>
            <p className="text-3xl font-bold text-primary">
              {occupiedSlots}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de {totalSlots} totales
            </p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Utilización</h3>
            <p className="text-3xl font-bold text-primary">
              {utilizationPercentage}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              del horario disponible
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}