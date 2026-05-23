# Sistema de Gestión de Biblioteca Universitaria

## Arquitectura General

```
┌──────────────────────────────────────────────┐
│                  Docker Compose               │
│                                              │
│  ┌──────────┐   ┌──────────┐  ┌──────────┐  │
│  │ Frontend │──▶│ Backend  │─▶│   DB     │  │
│  │  React   │   │ FastAPI  │  │PostgreSQL│  │
│  │ (Nginx)  │   │ Python   │  │  :5432   │  │
│  │  :3000   │   │  :8000   │  └──────────┘  │
│  └──────────┘   └──────────┘                │
└──────────────────────────────────────────────┘
```

## Cómo Desplegar

### Requisitos
- Docker Desktop instalado
- Docker Compose v2

### Despliegue en un solo comando
```bash
git clone <repo>
cd biblioteca
docker compose up --build
```

Acceder en: http://localhost:3000
API Docs: http://localhost:8000/docs

### Credenciales de prueba
| Usuario | Correo | Contraseña | Rol |
|---------|--------|-----------|-----|
| Admin | admin@biblioteca.edu | password123 | Bibliotecario |
| Estudiante | juan.perez@estudiante.edu | password123 | Estudiante |
| Docente | maria.lopez@docente.edu | password123 | Docente |

---

## Modelo de Datos (E-R simplificado)

```
CATEGORIAS ──┐
EDITORIALES ─┤
             ├──▶ LIBROS ◀──── LIBROS_AUTORES ◀──── AUTORES
                    │
                    └──▶ EJEMPLARES
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
                PRESTAMOS   RESERVAS  (estado)
                    │
                NOTIFICACIONES
USUARIOS ──────────────────────────────────────┘
MULTAS_CONFIG
```

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `libros` | Catálogo de títulos con ISBN, tipo de préstamo |
| `ejemplares` | Copias físicas de cada libro (con estado) |
| `usuarios` | Estudiantes, docentes y bibliotecarios |
| `prestamos` | Registro de préstamos con estado y multa |
| `reservas` | Reservas de ejemplares no disponibles |
| `notificaciones` | Alertas automáticas de vencimiento |
| `multas_config` | Tarifa diaria configurable |

---

## Estructura de Contenedores

```yaml
services:
  db:        PostgreSQL 15 con volumen persistente
  backend:   FastAPI con hot-reload en desarrollo
  frontend:  React buildado servido por Nginx
```

### Persistencia
Los datos persisten entre reinicios gracias al volumen Docker:
```yaml
volumes:
  postgres_data:  # Mapeado a /var/lib/postgresql/data
```

---

## Funcionalidades de Base de Datos

### Vistas
- `v_catalogo` — Libros con autores, disponibilidad
- `v_prestamos_activos` — Préstamos en curso con condición
- `v_inventario` — Stock por estado

### Funciones
- `calcular_multa(prestamo_id)` — Retorna multa en pesos
- `fecha_vencimiento_prestamo(ejemplar_id)` — Calcula fecha según tipo

### Procedimientos Almacenados
- `aprobar_prestamo(prestamo_id, bibliotecario_id)` — Aprueba y notifica
- `registrar_devolucion(prestamo_id, observacion)` — Devuelve y calcula multa
- `ampliar_prestamo(prestamo_id)` — Amplía +8 días si no está reservado

### Triggers
- `trg_notificar_vencimiento` — Crea notificación automática cuando un préstamo vence en ≤2 días

### Funciones de Ventana (Reportes)
```sql
-- Ranking de libros más prestados
RANK() OVER (ORDER BY total_prestamos DESC)
SUM(total_prestamos) OVER ()          -- total global
ROUND(... / SUM(...) OVER (), 2)      -- porcentaje

-- Estadísticas mensuales con media móvil
SUM(COUNT(*)) OVER (ORDER BY mes)     -- acumulado
AVG(COUNT(*)) OVER (
  ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
)                                      -- promedio 3 meses
```

---

## Roles y Permisos

| Función | Estudiante | Docente | Bibliotecario |
|---------|:----------:|:-------:|:-------------:|
| Ver catálogo | ✅ | ✅ | ✅ |
| Solicitar préstamo | ✅ | ✅ | — |
| Reservar ejemplar | ✅ | ✅ | — |
| Ampliar préstamo | ✅ | ✅ | — |
| Aprobar/devolver | — | — | ✅ |
| Gestionar usuarios | — | — | ✅ |
| Ver reportes | — | — | ✅ |
| CRUD libros/ejemplares | — | — | ✅ |

---

## Reglas de Negocio Implementadas

1. Solo se presta si el usuario está **activo** y el ejemplar está **disponible**
2. Los préstamos son de **1 día o 8 días** según el libro
3. Solo se puede ampliar si el ejemplar **no tiene reserva activa**
4. La multa se calcula automáticamente: `días_retraso × tarifa_diaria ($500 COP/día)`
5. Al devolver, si hay reserva activa, se completa automáticamente
6. El bibliotecario debe **aprobar** cada solicitud
7. Notificaciones automáticas cuando el vencimiento es ≤ 2 días

---

## Endpoints API Principales

```
POST /api/auth/login              Autenticación
GET  /api/libros/                 Listar/buscar catálogo
POST /api/prestamos/solicitar     Solicitar préstamo
POST /api/prestamos/{id}/aprobar  Aprobar (bibliotecario)
POST /api/prestamos/{id}/devolver Registrar devolución
POST /api/prestamos/{id}/ampliar  Ampliar fecha
POST /api/reservas/               Crear reserva
GET  /api/reportes/libros-mas-prestados
GET  /api/reportes/estadisticas-prestamos
```

Documentación interactiva completa: http://localhost:8000/docs
