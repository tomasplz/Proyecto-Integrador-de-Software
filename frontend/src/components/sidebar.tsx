import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Calendar, LayoutDashboard, Settings, BookOpen, Users, Landmark, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { useState } from "react"
import { useSedeContext } from "@/lib/sede-context"

// Rutas actualizadas para React Router
const routes = [
  {
    name: "Inicio",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Horarios",
    path: "/schedule",
    icon: Calendar,
  },
  {
    name: "Cursos",
    path: "/courses",
    icon: BookOpen,
  },
  {
    name: "Profesores",
    path: "/teachers",
    icon: Users,
  },
  {
    name: "Salas",
    path: "/classrooms",
    icon: Landmark,
  },
  {
    name: "Configuración",
    path: "/settings",
    icon: Settings,
  }
]

export function Sidebar() {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { selectedSede, setSelectedSede } = useSedeContext()

  const sedes = [
    {
      id: 'coquimbo' as const,
      name: 'Coquimbo',
      image: '/sede-coquimbo.png'
    },
    {
      id: 'antofagasta' as const,
      name: 'Antofagasta', 
      image: '/sede-antofagasta.png'
    }
  ]

  return (
    <div className={cn(
      "flex flex-col bg-background border-r h-screen transition-all duration-300",
      isCollapsed ? "w-16 min-w-16" : "w-64 min-w-64"
    )}>
      <div className={cn(
        "border-b flex items-center justify-between",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-bold">Schedule Management</h1>
            <p className="text-s text-muted-foreground">Gestión de Horarios</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title={isCollapsed ? "Expandir sidebar" : "Minimizar sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}        </button>
      </div>

      <nav className={cn(
        "flex-1 space-y-1",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className={cn(
              "flex items-center rounded-md text-sm transition-colors",
              isCollapsed 
                ? "gap-0 px-2 py-3 justify-center" 
                : "gap-3 px-3 py-2",
              location.pathname === route.path 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted",
            )}
            title={isCollapsed ? route.name : undefined}
          >
            <route.icon className="h-4 w-4" />
            {!isCollapsed && route.name}
          </Link>        ))}
      </nav>

      {/* Selector de Sede */}
      <div className={cn(
        "border-t",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {!isCollapsed ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Seleccionar Sede</h3>
            <div className="grid grid-cols-2 gap-2">
              {sedes.map((sede) => (
                <button
                  key={sede.id}
                  onClick={() => setSelectedSede(sede.id)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-md text-xs transition-colors",
                    selectedSede === sede.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <MapPin className="h-4 w-4 mb-1" />
                  {sede.name}
                </button>
              ))}
            </div>
            {/* Imagen de la sede seleccionada */}
            <div className="mt-3">
              <img
                src={sedes.find(s => s.id === selectedSede)?.image}
                alt={`Sede ${sedes.find(s => s.id === selectedSede)?.name}`}
                className="w-full h-24 object-cover rounded-md border"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setSelectedSede(selectedSede === 'coquimbo' ? 'antofagasta' : 'coquimbo')}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title={`Cambiar a ${selectedSede === 'coquimbo' ? 'Antofagasta' : 'Coquimbo'}`}
            >
              <MapPin className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className={cn(
        "border-t",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <div className="flex flex-col space-y-2">
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sched. Mgmt. </p>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
