# Sistema de Gestión de Horarios Universitarios

Este proyecto implementa un sistema para gestionar la creación y validación de horarios académicos universitarios, enfocado en las necesidades de la secretaría de un departamento. Consiste en un backend API, un frontend de interfaz gráfica, y una base de datos PostgreSQL, todo orquestado mediante Docker Compose.

## Tabla de Contenidos

1. [Acerca del Proyecto](#acerca-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Prerrequisitos](#prerrequisitos)
5. [SETUP. Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
6. [Configuración Inicial de la Base de Datos](#configuración-inicial-de-la-base-de-datos)
7. [Ejecutar la Aplicación](#ejecutar-la-aplicación)
8. [API del Backend](#api-del-backend)
9. [Funcionalidades para la Secretaría](#funcionalidades-para-la-secretaría)
10. [Consideraciones sobre Datos Maestros](#consideraciones-sobre-datos-maestros)
11. [Despliegue](#despliegue)
12. [Pasos Futuros](#pasos-futuros)

## 1. Acerca del Proyecto

Este proyecto universitario tiene como objetivo desarrollar un software que asista a la secretaría en la compleja tarea de crear horarios de clases, considerando diversas restricciones y validando posibles conflictos en tiempo real. El foco del backend es la implementación de la lógica de negocio para la asignación de paralelos a bloques horarios y salas, así como la detección de conflictos (que impiden la acción) y advertencias (que notifican situaciones a revisar).

## 2. Stack Tecnológico

- **Backend:** NestJS (TypeScript), PNPM (gestor de paquetes), Prisma (ORM)
- **Frontend:** React (TypeScript), Yarn (gestor de paquetes), Vite (bundler)
- **Base de Datos:** PostgreSQL
- **Contenedorización:** Docker, Docker Compose
- **Servidor Web (Frontend):** Nginx (dentro del contenedor frontend)

## 3. Estructura del Proyecto

```
Proyecto-Integrador-de-Software/
├── backend/                    # Código fuente del backend NestJS
│   ├── src/                   # Módulos, servicios, controladores, etc.
│   ├── prisma/               # Archivo schema.prisma y migraciones
│   ├── ...                   # Otros archivos de configuración
│   └── Dockerfile            # Dockerfile para construir la imagen del backend
├── frontend/                  # Código fuente del frontend React/Vite
│   ├── src/                  # Componentes, lógica, etc.
│   ├── public/               # Archivos estáticos
│   ├── ...                   # Otros archivos de configuración
│   └── Dockerfile            # Dockerfile para construir la imagen del frontend
├── docker-compose.yml         # Archivo principal para orquestar los contenedores
├── .env                       # Variables de entorno para Docker Compose
├── docs/                      # Documentación adicional
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

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Variables para la Base de Datos PostgreSQL
POSTGRES_DB=horarios_db
POSTGRES_USER=user_horarios
POSTGRES_PASSWORD=secure_password

# URL de conexión a la Base de Datos
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"

# Puertos de los servicios
BACKEND_PORT=3000
FRONTEND_PORT=80
```

### Construir y Levantar los Contenedores

```bash
docker-compose up --build -d
```

## 6. Configuración Inicial de la Base de Datos

### Aplicar Migraciones

```bash
docker-compose exec backend npx prisma migrate dev --name initial_schema
```

### Ejecutar Seeding

```bash
docker-compose exec backend npx prisma db seed
```

## 7. Ejecutar la Aplicación

La aplicación estará disponible en:
- Backend API: `http://localhost:3000`
- Frontend UI: `http://localhost:80`

## 8. API del Backend

### Endpoints Clave

- `GET /v1/carreras`: Obtener lista de carreras
- `GET /v1/semestres?carreraId=...`: Obtener semestres de una carrera
- `GET /v1/asignaturas?semestreId=...`: Obtener asignaturas de un semestre
- `GET /v1/paralelos?semestreId=...`: Obtener paralelos de un semestre
- `GET /v1/profesores`: Obtener lista de profesores
- `GET /v1/salas`: Obtener lista de salas
- `GET /v1/bloques-horario`: Obtener lista de bloques horarios
- `GET /v1/horario/:periodoAcademicoId`: Obtener horario actual
- `POST /v1/horario/assign`: Asignar paralelo a bloque/sala
- `DELETE /v1/horario/assign/:id`: Eliminar asignación
- `PUT /v1/profesores/:id/bloques-disponibles`: Actualizar disponibilidad
- `POST /v1/paralelos`: Crear nuevo paralelo

## 9. Funcionalidades para la Secretaría

### Flujo de Creación de Horarios

1. Seleccionar Carrera y Período Académico
2. Seleccionar Semestre "Actual"
3. Ver Paralelos Disponibles
4. Crear Paralelos Adicionales
5. Definir Disponibilidad de Profesores
6. Arrastrar Paralelos a Bloques/Salas

### Validación de Conflictos y Advertencias

- **Conflictos**: Problemas graves que impiden la asignación
- **Advertencias**: Problemas menores que permiten la asignación con notificación

## 10. Consideraciones sobre Datos Maestros

Los datos maestros (Carreras, Semestres, Asignaturas, etc.) se cargan inicialmente vía seeding. En producción, deberían sincronizarse con la base de datos central de la universidad.

## 11. Despliegue

El proyecto está diseñado para ser desplegado usando Docker Compose. Para producción, se recomienda:
- Configurar HTTPS
- Implementar gestión de logs centralizada
- Considerar orquestadores como Kubernetes

## 12. Pasos Futuros

- [ ] Implementar Autenticación
- [ ] Desarrollar UI completa
- [ ] Implementar sincronización con BD central
- [ ] Añadir exportación de horarios
- [ ] Mejorar visualización de conflictos
- [ ] Implementar pruebas unitarias