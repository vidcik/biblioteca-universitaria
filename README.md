# 📚 Biblioteca Universitaria

> Sistema de gestión de biblioteca desarrollado con FastAPI, React, PostgreSQL y Docker Compose.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 🚀 Inicio Rápido

**Requisitos:** Docker Desktop instalado y corriendo

git clone -b main https://github.com/vidcik/biblioteca-universitaria.git

cd biblioteca-universitaria

docker compose up --build

| Servicio | URL |
|----------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚡ API Docs | http://localhost:8000/docs |

---

## 👤 Credenciales de Prueba

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| 🔑 Bibliotecario | admin@biblioteca.edu | password123 |
| 🎓 Estudiante | juan.perez@estudiante.edu | password123 |
| 👨‍🏫 Docente | maria.lopez@docente.edu | password123 |

---

## 🏗️ Arquitectura

<img width="384" height="223" alt="image" src="https://github.com/user-attachments/assets/af0a7a7e-ce14-44da-a20f-def1c7d43b57" />


---

## 🗄️ Modelo de Datos

<img width="560" height="277" alt="image" src="https://github.com/user-attachments/assets/e3b62b58-ca3e-446b-929d-34ee21451b17" />

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| libros | Catálogo de títulos con ISBN y tipo de préstamo |
| ejemplares | Copias físicas de cada libro |
| usuarios | Estudiantes, docentes y bibliotecarios |
| prestamos | Registro de préstamos con estado y multa |
| reservas | Reservas de ejemplares no disponibles |
| notificaciones | Alertas automáticas de vencimiento |
| multas_config | Tarifa diaria configurable |

---

## 🗃️ Objetos de Base de Datos

### 👁️ Vistas
- v_catalogo — Libros con autores y disponibilidad
- v_prestamos_activos — Préstamos en curso con condición
- v_inventario — Stock por estado

### ⚙️ Funciones
- calcular_multa(prestamo_id) — Retorna multa en pesos
- fecha_vencimiento_prestamo(ejemplar_id) — Calcula fecha según tipo

### 🔧 Procedimientos Almacenados
- aprobar_prestamo(prestamo_id, bibliotecario_id) — Aprueba y notifica
- registrar_devolucion(prestamo_id, observacion) — Devuelve y calcula multa
- ampliar_prestamo(prestamo_id) — Amplía +8 días si no está reservado

### ⚡ Trigger
- trg_notificar_vencimiento — Notificación automática cuando vence en ≤ 2 días

### 📊 Funciones de Ventana
RANK() OVER (ORDER BY total_prestamos DESC)
SUM(total_prestamos) OVER ()
ROUND(... / SUM(...) OVER (), 2)
SUM(COUNT(*)) OVER (ORDER BY mes)
AVG(COUNT(*)) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)

---

## 👥 Roles y Permisos

| Función | Estudiante | Docente | Bibliotecario |
|---------|:----------:|:-------:|:-------------:|
| Ver catálogo | ✅ | ✅ | ✅ |
| Solicitar préstamo | ✅ | ✅ | — |
| Reservar ejemplar | ✅ | ✅ | — |
| Ampliar préstamo | ✅ | ✅ | — |
| Pagar multa | ✅ | ✅ | — |
| Aprobar/devolver | — | — | ✅ |
| Gestionar usuarios | — | — | ✅ |
| Ver reportes | — | — | ✅ |
| CRUD libros/ejemplares | — | — | ✅ |

---

## 📋 Reglas de Negocio

1. Solo se presta si el usuario está activo y el ejemplar está disponible
2. Duración del préstamo: 1 minuto (demo), 1 día o 8 días
3. Solo se puede ampliar si el ejemplar no tiene reserva activa
4. Usuario con multa pendiente no puede solicitar préstamos
5. La multa la asigna el bibliotecario manualmente al devolver
6. El bibliotecario debe aprobar cada solicitud
7. Notificaciones automáticas cuando el vencimiento es ≤ 2 días

---

## 📡 Endpoints API Principales

POST /api/auth/login                    Autenticación
GET  /api/libros/                       Listar/buscar catálogo
GET  /api/libros/categorias             Listar categorías
POST /api/libros/                       Crear libro (admin)
PUT  /api/libros/{id}                   Editar libro (admin)
DELETE /api/libros/{id}                 Eliminar libro (admin)
POST /api/prestamos/solicitar           Solicitar préstamo
POST /api/prestamos/{id}/aprobar        Aprobar (admin)
POST /api/prestamos/{id}/devolver       Devolver con multa (admin)
POST /api/prestamos/{id}/ampliar        Ampliar fecha
POST /api/prestamos/{id}/pagar-multa    Pagar multa
GET  /api/reportes/libros-mas-prestados Ranking con RANK()
GET  /api/reportes/estadisticas-prestamos Media móvil 3 meses

Documentación interactiva: http://localhost:8000/docs

---

## 📁 Estructura del Proyecto

<img width="467" height="341" alt="image" src="https://github.com/user-attachments/assets/23e38cff-9bef-43dc-bf0a-a9c4d2bf04c7" />


> Desarrollado como proyecto final de Base de Datos — 2026
