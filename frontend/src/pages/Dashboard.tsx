import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, Calendar, Building } from 'lucide-react'
import type { Teacher, Course, Classroom } from '@/lib/types'
import coursesData from '@/lib/courses.json'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    availableTeachers: 0,
    totalCourses: 0,
    totalClassrooms: 0,
    totalDemand: 0,
    loading: true,
    teachersFromAPI: false,
    coursesFromAPI: false,
    classroomsFromAPI: false
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Dashboard - Iniciando carga de datos desde API...");
        
        // Cargar profesores desde la API
        console.log("📡 Fetch profesores: http://localhost:3000/profesores");
        const teachersResponse = await fetch('http://localhost:3000/profesores');
        let teachers: Teacher[] = [];
        
        if (teachersResponse.ok) {
          teachers = await teachersResponse.json();
          console.log("✅ Profesores cargados desde API:", teachers.length);
        } else {
          console.error("❌ Error al cargar profesores desde API. Status:", teachersResponse.status);
          teachers = [];
        }

        // Cargar cursos/asignaturas desde la API
        console.log("📡 Fetch asignaturas: http://localhost:3000/asignaturas");
        const coursesResponse = await fetch('http://localhost:3000/asignaturas');
        let courses: any[] = [];
        
        if (coursesResponse.ok) {
          courses = await coursesResponse.json();
          console.log("✅ Asignaturas cargadas desde API:", courses.length);
        } else {
          console.error("❌ Error al cargar asignaturas desde API. Status:", coursesResponse.status);
          // Fallback a datos estáticos si la API no está disponible
          courses = coursesData as Course[];
          console.log("📚 Fallback: usando datos estáticos de cursos:", courses.length);
        }

        // Cargar salas desde la API
        console.log("📡 Fetch salas: http://localhost:3000/salas");
        const classroomsResponse = await fetch('http://localhost:3000/salas');
        let classrooms: Classroom[] = [];
        
        if (classroomsResponse.ok) {
          classrooms = await classroomsResponse.json();
          console.log("✅ Salas cargadas desde API:", classrooms.length);
        } else {
          console.error("❌ Error al cargar salas desde API. Status:", classroomsResponse.status);
          classrooms = [];
        }

        console.log('📊 Dashboard data loaded:', {
          teachers: teachers.length,
          courses: courses.length,
          classrooms: classrooms.length
        });

        const availableTeachers = teachers.filter(teacher => teacher.isAvailable).length;
        const totalDemand = courses.reduce((sum, course) => sum + (course.demand || 0), 0);

        setStats({
          totalTeachers: teachers.length,
          availableTeachers,
          totalCourses: courses.length,
          totalClassrooms: classrooms.length,
          totalDemand,
          loading: false,
          teachersFromAPI: teachersResponse.ok,
          coursesFromAPI: coursesResponse.ok,
          classroomsFromAPI: classroomsResponse.ok
        });

        console.log("✅ Dashboard stats calculadas:", {
          totalTeachers: teachers.length,
          availableTeachers,
          totalCourses: courses.length,
          totalClassrooms: classrooms.length,
          totalDemand
        });

      } catch (error) {
        console.error("❌ Error al cargar datos del dashboard:", error);
        
        // Fallback a datos estáticos en caso de error
        const courses = coursesData as Course[];
        
        setStats({
          totalTeachers: 0,
          availableTeachers: 0,
          totalCourses: courses.length,
          totalClassrooms: 0,
          totalDemand: courses.reduce((sum, course) => sum + (course.demand || 0), 0),
          loading: false,
          teachersFromAPI: false,
          coursesFromAPI: false,
          classroomsFromAPI: false
        });
      }
    };

    // Simular un pequeño delay para mostrar el estado de carga
    setTimeout(loadData, 500);
  }, [])
  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-muted-foreground">Gestión de Horarios Universitarios</p>
          </div>
        </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Profesores</p>
              {stats.loading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              )}
              {!stats.loading && (
                <p className="text-xs text-muted-foreground">
                  {stats.availableTeachers} disponibles 
                  {stats.teachersFromAPI ? 
                    <span className="ml-1 text-green-600">• API</span> : 
                    <span className="ml-1 text-orange-600">• Local</span>
                  }
                </p>
              )}
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cursos</p>
              {stats.loading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
              )}
              {!stats.loading && (
                <p className="text-xs text-muted-foreground">
                  {stats.totalDemand} estudiantes
                  {stats.coursesFromAPI ? 
                    <span className="ml-1 text-green-600">• API</span> : 
                    <span className="ml-1 text-orange-600">• Local</span>
                  }
                </p>
              )}
            </div>
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aulas Disponibles</p>
              {stats.loading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalClassrooms}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Múltiples sedes
                {stats.classroomsFromAPI ? 
                  <span className="ml-1 text-green-600">• API</span> : 
                  <span className="ml-1 text-orange-600">• Local</span>
                }
              </p>
            </div>
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Demanda Total</p>
              {stats.loading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalDemand}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Estudiantes registrados
              </p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Secciones principales */}
      <div className="grid gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Gestión de Horarios</h3>
            <p className="text-sm text-muted-foreground">Crea y administra horarios de cursos</p>
          </div>
          <div className="p-6 pt-0">
            <p className="mb-4 text-sm text-muted-foreground">
              Utiliza la herramienta de arrastrar y soltar para crear horarios de manera intuitiva. Asigna cursos a
              diferentes días y bloques horarios.
            </p>
            <Link 
              to="/schedule"
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors w-full flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Ir a Horarios</span>
            </Link>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Cursos</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Gestiona los {stats.totalCourses} cursos disponibles en el sistema
            </p>
            <Link
              to="/courses"
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full flex items-center justify-center"
            >
              Ver Cursos
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Profesores</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Administra los {stats.totalTeachers} profesores registrados
            </p>            <Link
              to="/teachers"
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full flex items-center justify-center"
            >
              Ver Profesores
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
