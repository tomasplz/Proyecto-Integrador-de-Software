import { useState, useEffect } from 'react'
import type { Course, Career } from '@/lib/types'
import { Pagination } from '@/components/pagination'

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all')
  const [selectedCareer, setSelectedCareer] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchCoursesAndCareers = async () => {
      try {
        setLoading(true)
        const [coursesResponse, careersResponse] = await Promise.all([
          fetch('http://localhost:3000/asignaturas'),
          fetch('http://localhost:3000/carreras')
        ]);

        if (!coursesResponse.ok || !careersResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const coursesData: Course[] = await coursesResponse.json();
        const careersData: Career[] = await careersResponse.json();

        console.log(`Se cargaron ${coursesData.length} cursos.`);
        console.log(coursesData);
        console.log(`Se cargaron ${careersData.length} carreras.`);
        console.log(careersData);

        setCourses(coursesData);
        setCareers(careersData);

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCoursesAndCareers()
  }, [])

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSemester = selectedSemester === 'all' || course.semester === selectedSemester
    const matchesCareer = selectedCareer === 'all' || course.career === selectedCareer
    return matchesSearch && matchesSemester && matchesCareer
  })
  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

  // Obtener semestres únicos para el filtro según la carrera seleccionada
  const getAvailableSemesters = () => {
    if (selectedCareer === 'all') {
      // Si no hay carrera seleccionada, mostrar todos los semestres
      return Array.from(new Set(courses.map(course => course.semester))).sort((a, b) => a - b)
    } else {
      // Filtrar semestres según la carrera seleccionada
      return Array.from(
        new Set(
          courses
            .filter(course => course.career === selectedCareer)
            .map(course => course.semester)
        )
      ).sort((a, b) => a - b)
    }
  }

  const uniqueSemesters = getAvailableSemesters()

  // Reset semester filter if current selection is not available for selected career
  useEffect(() => {
    if (selectedCareer !== 'all' && selectedSemester !== 'all') {
      const availableSemesters = getAvailableSemesters()
      if (!availableSemesters.includes(selectedSemester as number)) {
        setSelectedSemester('all')
      }
    }
  }, [selectedCareer])

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
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Cursos</h1>
            <p className="text-muted-foreground">
              Administra los cursos disponibles en el sistema ({courses.length} cursos)
            </p>
          </div>
        </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Todos los semestres</option>
            {uniqueSemesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}° Semestre
              </option>
            ))}
          </select>
          <select
            value={selectedCareer}
            onChange={(e) => setSelectedCareer(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Todas las carreras</option>
            {careers.map((career) => (
              <option key={career.id} value={career.id}>
                {career.name}
              </option>
            ))}
          </select>
          <div className="text-sm text-muted-foreground flex items-center">
            {filteredCourses.length} de {courses.length} cursos
          </div>        </div>
      </div>

      {/* Tabla de cursos */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-fit">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-24">Código</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-48">Nombre</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-24">Semestre</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-24">Demanda</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-24">Secciones</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-32">Aula Sugerida</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-28">Estado</th>              </tr>
            </thead>
            <tbody>
              {paginatedCourses.map((course) => (
                <tr key={course.key} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="font-mono text-sm">{course.code}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-medium">{course.name}</div>
                    <div className="text-sm text-muted-foreground">{course.career}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      {course.semester}° Sem
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">{course.demand} estudiantes</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm">
                      {course.sectionsNumber} sección{course.sectionsNumber !== 1 ? 'es' : ''}
                      <div className="text-xs text-muted-foreground">
                        {course.sectionSize} est/sección
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm font-mono">{course.suggestedRoom}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${course.isLocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-xs">{course.isLocked ? 'Bloqueado' : 'Disponible'}</span>
                      </div>
                      {course.isPreAssigned && (
                        <span className="text-xs text-blue-600">Pre-asignado</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>        </div>
      </div>

      {/* Paginación */}
      {filteredCourses.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCourses.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {filteredCourses.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron cursos que coincidan con "{searchTerm}"</p>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">Total Cursos</h3>
          <p className="text-3xl font-bold text-primary">{courses.length}</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">Demanda Total</h3>
          <p className="text-3xl font-bold text-primary">
            {courses.reduce((sum, course) => sum + course.demand, 0)} est.          </p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">Semestres</h3>
          <p className="text-3xl font-bold text-primary">
            {selectedCareer === 'all' 
              ? Math.max(...courses.map((c) => c.semester))
              : Math.max(...courses.filter(c => c.career === selectedCareer).map((c) => c.semester))
            }
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
