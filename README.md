# Sistema de Gestión de Horarios Universitarios

Este proyecto implementa un sistema integral para la gestión, visualización y validación de horarios académicos universitarios, enfocado en la secretaría y coordinación de carreras. Incluye:
- Backend API (NestJS + Prisma + PostgreSQL)
- Frontend moderno (React + Vite + Tailwind)
- Validación de conflictos en tiempo real (profesores, salas, superposición de paralelos)
- Sincronización total con la base de datos (no hay datos "fantasma" en frontend)
- Visualización avanzada de uso de aulas y horarios
- Notificaciones y barra de conflictos en la UI
- Orquestación con Docker Compose

## Tabla de Contenidos

1. [Acerca del Proyecto](#acerca-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Prerrequisitos](#prerrequisitos)
5. [SETUP. Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
6. [Configuración Inicial de la Base de Datos](#configuración-inicial-de-la-base-de-datos)
7. [Ejecutar la Aplicación](#ejecutar-la-aplicación)
8. [API del Backend](#api-del-backend)
9. [Funcionalidades para la Secretaría y Coordinación](#funcionalidades-para-la-secretaría-y-coordinación)
10. [Consideraciones sobre Datos Maestros](#consideraciones-sobre-datos-maestros)
11. [Despliegue](#despliegue)
12. [Pasos Futuros y TODO](#pasos-futuros-y-todo)

## 1. Acerca del Proyecto

Este proyecto universitario tiene como objetivo desarrollar un software que asista a la secretaría en la compleja tarea de crear horarios de clases, considerando diversas restricciones y validando posibles conflictos en tiempo real. El foco del backend es la implementación de la lógica de negocio para la asignación de paralelos a bloques horarios y salas, así como la detección de conflictos (que impiden la acción) y advertencias (que notifican situaciones a revisar).

## 2. Stack Tecnológico

- **Backend:** NestJS (TypeScript), PNPM, Prisma ORM
- **Frontend:** React (TypeScript), Vite, Tailwind CSS
- **Base de Datos:** PostgreSQL
- **Contenedorización:** Docker, Docker Compose
- **Servidor Web (Frontend):** Nginx (en el contenedor frontend)

## 3. Estructura del Proyecto

```
Proyecto-Integrador-de-Software/
├── backend/                    # Código fuente del backend NestJS
│   ├── src/                   # Módulos, servicios, controladores, etc.
│   ├── prisma/               # Archivos schema.prisma, migraciones, scripts de seeding y datos JSON
│   └── Dockerfile            # Dockerfile para construir la imagen del backend
├── frontend/                  # Código fuente del frontend React/Vite
│   ├── src/                  # Componentes, lógica, etc.
│   ├── public/               # Archivos estáticos
│   └── Dockerfile            # Dockerfile para construir la imagen del frontend
├── docker-compose.yml         # Orquestación de contenedores
├── .env                       # Variables de entorno
└── README.md                  # Este archivo
```

## 4. Prerrequisitos

Asegúrate de tener instalados en tu sistema:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## 5. SETUP. Configuración del Entorno de Desarrollo

### Clonar el Repositorio

```bash
git clone https://github.com/tomasplz/Proyecto-Integrador-de-Software
cd Proyecto-Integrador-de-Software
```

### Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido (ajusta los valores según tu entorno):

```env
# Configuración de PostgreSQL
POSTGRES_DB=horarios_db
POSTGRES_USER=user_horarios
POSTGRES_PASSWORD=secure_password
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"

# Puertos
BACKEND_PORT=3000
# El frontend se expone en el puerto 80 por defecto (ver docker-compose.yml y nginx.conf)

# Configuración de JWT (opcional)
# JWT_SECRET=tu_secreto_jwt_muy_seguro_123

# URLs y Tokens para obtener datos maestros de APIs externas (usado por prisma/test.fetch.ts)
API_URL_BLOQUES="tu_api_url_bloques_aqui"
API_TOKEN_BLOQUES="tu_api_token_bloques_aqui"

API_URL_DEMANDA="tu_api_url_demanda_aqui"
API_TOKEN_DEMANDA="tu_api_token_demanda_aqui"

API_URL_SEMESTRES="tu_api_url_semestres_aqui"
API_TOKEN_SEMESTRES="tu_api_token_semestres_aqui"

API_URL_SALAS="tu_api_url_salas_aqui"
API_TOKEN_SALAS="tu_api_token_salas_aqui"

API_URL_PROFESORES="tu_api_url_profesores_aqui"
API_TOKEN_PROFESORES="tu_api_token_profesores_aqui"
```

### Construir y Levantar los Contenedores

```bash
docker-compose up --build -d
```

## 6. Inicialización Automática de la Base de Datos

> **¡No es necesario ejecutar migraciones ni seeding manualmente!**

El `Dockerfile` y el script `start.sh` del backend automatizan todo el proceso de migración, sincronización de esquema, descarga de datos externos y seeding. Al levantar los contenedores con:

```bash
docker-compose up --build -d
```

el backend espera a que la base de datos esté lista, aplica migraciones, descarga datos externos (si está configurado), ejecuta el seeding y arranca la API. Solo necesitas asegurarte de tener el archivo `.env` correctamente configurado.

## 7. Ejecutar la Aplicación

La aplicación estará disponible en:
- Backend API: `http://localhost:3000`
- Frontend UI: `http://localhost` (puerto 80)

## 8. API del Backend

### Endpoints Clave (actualizados)

- `GET /carreras`, `GET /semestres`, `GET /asignaturas`, `GET /paralelos`, `GET /profesores`, `GET /salas`, `GET /bloques-horario`
- `GET /asignaciones-horario`: Listar todas las asignaciones de horario
- `POST /asignaciones-horario`: Crear una nueva asignación (paralelo, bloque, sala)
- `DELETE /asignaciones-horario/by-location`: Eliminar asignación por ubicación
- `DELETE /asignaciones-horario/current-period/all`: Eliminar todas las asignaciones del periodo actual
- `PATCH /asignaciones-horario/update-room`: Actualizar sala de una asignación
- `PATCH /asignaciones-horario/update-teacher`: Actualizar profesor de una asignación

## 9. Funcionalidades para la Secretaría y Coordinación

### Flujo de Gestión de Horarios

1. Seleccionar carrera y semestre
2. Visualizar y filtrar paralelos disponibles
3. Arrastrar paralelos a la grilla de horario (drag & drop)
4. Seleccionar sala y profesor para cada paralelo
5. El sistema valida automáticamente:
   - Conflictos de profesor (no puede estar en dos bloques a la vez)
   - Conflictos de sala (no puede haber dos paralelos en la misma sala/bloque)
   - Superposición de paralelos
6. Notificaciones de conflicto en tiempo real (barra inferior y contador expandible)
7. Visualización de uso de aulas: grilla por sala, filtrado por sede, búsqueda y modal de detalle
8. Estadísticas de ocupación de aulas y filtros avanzados

### Validación de Conflictos y Notificaciones

- **Conflictos**: Impiden la acción y muestran notificación (profesor/sala ocupada)
- **Notificaciones**: Barra inferior con contador y detalles expandibles
- **Validación en tiempo real**: Al arrastrar, seleccionar sala o profesor

## 10. Consideraciones sobre Datos Maestros

Los datos maestros (carreras, semestres, asignaturas, profesores, salas, bloques horarios, etc.) se cargan mediante el proceso de seeding (`pnpm exec prisma db seed`) usando archivos JSON en `backend/prisma/`.

Estos archivos pueden ser:
1. **Creados manualmente**
2. **Generados automáticamente** usando el script `backend/prisma/test.fetch.ts` (descarga desde APIs externas, configurables en `.env`)

En producción, se recomienda sincronización periódica con la base de datos central o APIs fuente.

## 11. Despliegue

El proyecto está diseñado para ser desplegado usando Docker Compose. Para producción, se recomienda:
- Configurar HTTPS
- Implementar gestión de logs centralizada
- Considerar orquestadores como Kubernetes

## 12. Pasos Futuros y TODO

- [ ] Implementar autenticación y control de acceso
- [ ] Mejorar la experiencia móvil y accesibilidad
- [ ] Sincronización en tiempo real con BD central
- [ ] Exportar horarios a PDF/Excel
- [ ] Mejorar visualización y gestión de conflictos (UI y lógica)
- [ ] Pruebas unitarias y de integración
- [ ] Optimización de performance para grandes volúmenes de datos
- [ ] Mejorar manejo de errores y mensajes en frontend/backend
- [ ] Paginación y búsqueda avanzada en aulas
- [ ] Integración con sistemas institucionales

---

**Notas:**
- El sistema ya permite gestión y visualización de horarios y aulas sincronizados con la base de datos real.
- La validación de conflictos es en tiempo real y abarca todos los semestres/carreras.
- La UI es moderna, responsiva y permite filtros avanzados y visualización detallada.


[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/tomasplz/Proyecto-Integrador-de-Software)
