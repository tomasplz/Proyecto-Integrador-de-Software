import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Teacher, Course, TimeSlotData, ScheduledCourse } from '@/lib/types'
import { Pagination } from '@/components/pagination'
import teachersData from '@/lib/teachers.json'
import coursesData from '@/lib/courses.json'
import timeSlotsData from '@/lib/timeSlot.json'
import { useSedeContext } from '@/lib/sede-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TeacherTimeSlot {
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

const defaultTimeSlots: TeacherTimeSlot[] = (timeSlotsData as TimeSlotData[])
  .filter(slot => slot.horario !== null)
  .map(slot => ({ time: slot.horario! }))

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export default function Teachers() {
  const { selectedSede } = useSedeContext()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [showScheduleView, setShowScheduleView] = useState(false)
  const [scheduleData, setScheduleData] = useState<ScheduleByCareerAndSemester>({})
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherTimeSlot[]>(defaultTimeSlots)
  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] = useState<string>('all')
  const [selectedCell, setSelectedCell] = useState<{ time: string; day: keyof Omit<TeacherTimeSlot, 'time'> } | null>(null)

  // Función para obtener el nombre del curso por su código
  const getCourseNameByCode = (courseCode: string) => {
    const course = (coursesData as Course[]).find(c => c.code === courseCode)
    return course ? course.name : courseCode
  }

  // Load schedule data from localStorage
  const loadScheduleData = useCallback(() => {
    try {
      const storedData = localStorage.getItem('schedulesByCareerAndSemester')
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        setScheduleData(parsedData)
      }
    } catch (error) {
      console.error('Error loading schedule data:', error)
    }
  }, [])
  // Generate teacher schedule based on assignments
  const generateTeacherSchedule = useCallback((teacherRut: string): TeacherTimeSlot[] => {
    const schedule = defaultTimeSlots.map(slot => ({ ...slot }))
    
    // Process all careers and semesters
    Object.entries(scheduleData).forEach(([careerAndSemester, timeSlots]) => {
      timeSlots.forEach(timeSlot => {
        // Find matching time slot in teacher schedule
        const matchingSlot = schedule.find(slot => slot.time === timeSlot.time)
        if (!matchingSlot) return

        // Check each day for courses assigned to this teacher
        dayKeys.forEach((dayKey) => {
          const course = timeSlot[dayKey]
          if (course && course.selectedTeacher === teacherRut) {
            matchingSlot[dayKey] = `${course.name} - ${careerAndSemester} (${course.selectedRoom || 'Sin aula'})`
          }
        })
      })
    })

    return schedule
  }, [scheduleData])
  // Get available teachers for dropdown (teachers that have been assigned to courses)
  const availableTeachers = useMemo(() => {
    const assignedTeachers = new Set<string>()
    
    Object.values(scheduleData).forEach(timeSlots => {
      timeSlots.forEach(timeSlot => {
        dayKeys.forEach(dayKey => {
          const course = timeSlot[dayKey]
          if (course && course.selectedTeacher) {
            assignedTeachers.add(course.selectedTeacher)
          }
        })
      })
    })
    
    return Array.from(assignedTeachers).sort()
  }, [scheduleData])

  // Filter teachers for schedule view based on search term
  const filteredTeachersForSchedule = useMemo(() => {
    if (!searchTerm) return availableTeachers
    // Find teacher names by RUT
    const teacherNames = availableTeachers.map(rut => {
      const teacher = teachers.find(t => t.rut === rut)
      return teacher ? teacher.name : rut
    })
    
    return availableTeachers.filter((rut, index) => 
      teacherNames[index].toLowerCase().includes(searchTerm.toLowerCase()) ||
      rut.includes(searchTerm)
    )
  }, [availableTeachers, searchTerm, teachers])

  // Current teacher being displayed in schedule grid
  const currentTeacherForSchedule = useMemo(() => {
    if (selectedTeacherForSchedule === 'all' || !selectedTeacherForSchedule) {
      return filteredTeachersForSchedule[0] || null
    }
    if (filteredTeachersForSchedule.includes(selectedTeacherForSchedule)) {
      return selectedTeacherForSchedule
    }
    return filteredTeachersForSchedule[0] || null
  }, [filteredTeachersForSchedule, selectedTeacherForSchedule])

  // Get teacher name by RUT
  const getTeacherNameByRut = useCallback((rut: string) => {
    const teacher = teachers.find(t => t.rut === rut)
    return teacher ? teacher.name : rut
  }, [teachers])

  const getCellContent = (slot: TeacherTimeSlot, dayKey: keyof TeacherTimeSlot) => {
    return slot[dayKey] as string || ''
  }

  const handleCellClick = (time: string, day: keyof Omit<TeacherTimeSlot, 'time'>) => {
    setSelectedCell({ time, day })
  }

  // Calculate statistics for teacher schedule
  const occupiedSlots = useMemo(() => {
    return teacherSchedule.reduce((count, slot) => {
      return count + dayKeys.filter(day => getCellContent(slot, day)).length
    }, 0)
  }, [teacherSchedule])

  const totalSlots = teacherSchedule.length * days.length
  const teacherUtilization = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0
  // Get teacher details for current selected teacher
  const currentTeacherDetails = useMemo(() => {
    return teachers.find(t => t.rut === currentTeacherForSchedule)
  }, [teachers, currentTeacherForSchedule])

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      console.log('Loading teachers data:', teachersData.length, 'teachers')
      setTeachers(teachersData as Teacher[])
      setLoading(false)
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

  // Update teacher schedule when current teacher or schedule data changes
  useEffect(() => {
    if (currentTeacherForSchedule && Object.keys(scheduleData).length > 0) {
      const updatedSchedule = generateTeacherSchedule(currentTeacherForSchedule)
      setTeacherSchedule(updatedSchedule)
    } else {
      setTeacherSchedule(defaultTimeSlots)
    }
  }, [currentTeacherForSchedule, scheduleData, generateTeacherSchedule])

  // Reset teacher selection when filters change
  useEffect(() => {
    if (selectedTeacherForSchedule !== 'all' && !filteredTeachersForSchedule.includes(selectedTeacherForSchedule)) {
      setSelectedTeacherForSchedule('all')
    }
  }, [filteredTeachersForSchedule, selectedTeacherForSchedule])

  // Reset page when search changes in list view
  useEffect(() => {
    if (!showScheduleView) {
      setCurrentPage(1)
    }
  }, [searchTerm, showScheduleView])

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.rut.includes(searchTerm)
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex)

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="space-y-6 p-6 flex-1 min-h-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Profesores</h1>
            <p className="text-muted-foreground">
              Administra la información de los {teachers.length} profesores.
              {showScheduleView && ` ${availableTeachers.length} profesores con horarios asignados.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowScheduleView(false)
                setSearchTerm('')
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showScheduleView 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Lista de Profesores
            </button>
            <button
              onClick={() => {
                setShowScheduleView(true)
                setSearchTerm('')
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showScheduleView 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Vista de Horarios
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={showScheduleView ? "Buscar profesor con horario asignado..." : "Buscar por nombre o RUT..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {showScheduleView 
              ? `${filteredTeachersForSchedule.length} de ${availableTeachers.length} profesores con horario`
              : `${filteredTeachers.length} de ${teachers.length} profesores`
            }
          </div>
        </div>

        {!showScheduleView ? (
          <>
            {/* Lista de profesores */}
            <div className="grid gap-4">
              {paginatedTeachers.map((teacher) => (
                <div
                  key={teacher.rut}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 cursor-pointer hover:bg-muted"
                  onClick={() => handleTeacherClick(teacher)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold text-lg">
                            {teacher.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{teacher.name}</h3>
                          <p className="text-muted-foreground">RUT: {teacher.rut}</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Estado</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${teacher.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <p className="text-sm">{teacher.isAvailable ? 'Disponible' : 'No disponible'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Máx. Secciones/Semana</p>
                          <p className="text-sm">{teacher.maxSectionsPerWeek}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Cursos Ofrecidos</p>
                          <p className="text-sm">{teacher.courseOffer.length} cursos</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Cursos que puede dictar</p>                        <div className="flex flex-wrap gap-2">
                          {teacher.courseOffer.slice(0, 10).map((courseCode, index) => (
                            <span
                              key={`${teacher.rut}-${courseCode}-${index}`}
                              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground"
                              title={getCourseNameByCode(courseCode)}
                            >
                              {courseCode} - {getCourseNameByCode(courseCode)}
                            </span>
                          ))}
                          {teacher.courseOffer.length > 10 && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-muted text-muted-foreground">
                              +{teacher.courseOffer.length - 10} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {filteredTeachers.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredTeachers.length}
                itemsPerPage={itemsPerPage}
              />
            )}

            {filteredTeachers.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron profesores que coincidan con "{searchTerm}"</p>
              </div>
            )}

            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">Total Profesores</h3>
                <p className="text-3xl font-bold text-primary">{teachers.length}</p>
              </div>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">Profesores Disponibles</h3>
                <p className="text-3xl font-bold text-primary">
                  {teachers.filter(t => t.isAvailable).length}
                </p>
              </div>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">Cursos Cubiertos</h3>
                <p className="text-3xl font-bold text-primary">
                  {new Set(teachers.flatMap(t => t.courseOffer)).size}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Vista de Horarios */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedTeacherForSchedule} onValueChange={setSelectedTeacherForSchedule}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="all">
                    {filteredTeachersForSchedule.length > 0 ? 'Primer profesor disponible' : 'No hay profesores asignados'}
                  </SelectItem>
                  {filteredTeachersForSchedule.map((teacherRut) => (
                    <SelectItem key={teacherRut} value={teacherRut}>
                      {getTeacherNameByRut(teacherRut)} ({teacherRut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>            {/* Current teacher info */}
            {currentTeacherForSchedule && (
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{getTeacherNameByRut(currentTeacherForSchedule)}</h2>
                    <p className="text-muted-foreground">
                      Horario de clases asignadas
                    </p>
                    {currentTeacherDetails && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>RUT: {currentTeacherDetails.rut}</span>
                        <span>Máx. {currentTeacherDetails.maxSectionsPerWeek} secciones/semana</span>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${currentTeacherDetails.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>{currentTeacherDetails.isAvailable ? 'Disponible' : 'No disponible'}</span>
                        </div>
                      </div>
                    )}
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
                        Horario
                      </th>
                      {days.map((day) => (
                        <th key={day} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground min-w-48">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teacherSchedule.map((slot, index) => (
                      <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium text-sm bg-muted/25">
                          {slot.time}
                        </td>
                        {dayKeys.map((dayKey) => {
                          const content = getCellContent(slot, dayKey)
                          return (
                            <td
                              key={dayKey}
                              className={`p-2 align-middle text-center cursor-pointer transition-colors min-h-16 ${
                                content 
                                  ? 'bg-primary/10 hover:bg-primary/20' 
                                  : 'hover:bg-accent/50'
                              } ${
                                selectedCell?.time === slot.time && selectedCell?.day === dayKey
                                  ? 'ring-2 ring-primary'
                                  : ''
                              }`}
                              onClick={() => handleCellClick(slot.time, dayKey)}
                            >
                              {content && (
                                <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium whitespace-pre-wrap">
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

            {/* No teachers assigned message */}
            {availableTeachers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay profesores asignados a cursos aún.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ve a la página de Horarios para asignar profesores a los cursos.
                </p>
              </div>
            )}

            {/* No filtered teachers message */}
            {availableTeachers.length > 0 && filteredTeachersForSchedule.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No se encontraron profesores asignados que coincidan con "{searchTerm}"
                </p>
              </div>
            )}

            {/* Schedule Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">Profesores Asignados</h3>
                <p className="text-3xl font-bold text-primary">
                  {availableTeachers.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {teachers.filter(t => t.isAvailable).length} disponibles
                </p>
              </div>              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">Profesor Actual</h3>
                <p className="text-lg font-bold text-primary truncate">
                  {currentTeacherForSchedule ? getTeacherNameByRut(currentTeacherForSchedule) : 'Ninguno'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  seleccionado
                </p>
              </div>

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">Horas Asignadas</h3>
                <p className="text-3xl font-bold text-primary">
                  {occupiedSlots}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  clases por semana
                </p>
              </div>

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">Carga Horaria</h3>
                <p className="text-3xl font-bold text-primary">
                  {teacherUtilization}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  del horario disponible
                </p>
              </div>
            </div>
          </>
        )}        {/* Modal para mostrar horario del profesor */}
        {selectedTeacher && (
          <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Horario de {selectedTeacher.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">                {/* Generar horario dinámico basado en las asignaciones actuales */}
                {(() => {
                  const teacherCurrentSchedule = generateTeacherSchedule(selectedTeacher.rut)
                  const hasAssignments = teacherCurrentSchedule.some(slot => 
                    dayKeys.some(dayKey => getCellContent(slot, dayKey))
                  )
                  
                  if (!hasAssignments) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Este profesor no tiene clases asignadas actualmente.
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="rounded-md border bg-card overflow-hidden">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                              Horario
                            </th>
                            {days.map((day) => (
                              <th key={day} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {teacherCurrentSchedule.map((slot, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-4 align-middle font-medium text-sm bg-muted/25 text-center">
                                {slot.time}
                              </td>
                              {dayKeys.map((dayKey) => {
                                const content = getCellContent(slot, dayKey)
                                return (
                                  <td key={dayKey} className="p-2 align-middle text-center">
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
                  )
                })()}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
