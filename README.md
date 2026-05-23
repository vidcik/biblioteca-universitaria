# 📚 Biblioteca Universitaria

> Sistema de gestión de biblioteca desarrollado con FastAPI, React, PostgreSQL y Docker Compose.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 🚀 Inicio Rápido

git clone https://github.com/vidcik/biblioteca-universitaria.git

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

┌─────────────────────────────────────┐
│           Docker Compose            │
│                                     │
│  ┌──────────┐      ┌─────────────┐  │
│  │  React   │─────▶│   FastAPI   │  │
│  │  :3000   │      │   :8000     │  │
│  └──────────┘      └──────┬──────┘  │
│                           │         │
│                    ┌──────▼──────┐  │
│                    │ PostgreSQL  │  │
│                    │   :5432     │  │
│                    └─────────────┘  │
└─────────────────────────────────────┘

---

## ✨ Funcionalidades

### 👨‍💼 Bibliotecario
- ➕ Agregar libros con número de ejemplares
- ✏️ Editar y eliminar libros del catálogo
- ✅ Aprobar y gestionar solicitudes de préstamo
- 💰 Asignar multas manualmente al devolver
- 👥 Crear y gestionar usuarios
- 📊 Reportes con funciones de ventana SQL

### 🎓 Estudiante / Docente
- 🔍 Buscar libros por título, autor o ISBN
- 📖 Solicitar préstamos eligiendo duración
- 📅 Reservar libros no disponibles
- ⏰ Ampliar fecha de devolución
- 💳 Ver y pagar multas pendientes
- 🌙 Modo oscuro

---

## 📋 Reglas de Negocio

- 🔒 Usuario con multa pendiente no puede solicitar préstamos
- ⏱️ Duración del préstamo: 1 minuto (demo), 1 día o 8 días
- 🔄 No se puede ampliar si el ejemplar tiene reserva activa
- 📬 Notificaciones automáticas cuando el préstamo está por vencer

---

## 🗄️ Base de Datos

| Objeto | Detalle |
|--------|---------|
| 📋 Tablas | libros, ejemplares, usuarios, prestamos, reservas, notificaciones |
| 👁️ Vistas | v_catalogo, v_prestamos_activos, v_inventario |
| ⚙️ Funciones | calcular_multa(), fecha_vencimiento_prestamo() |
| 🔧 Procedimientos | aprobar_prestamo(), registrar_devolucion(), ampliar_prestamo() |
| ⚡ Trigger | Notificaciones automáticas de vencimiento |
| 📊 Window Functions | RANK(), SUM OVER(), AVG OVER ROWS BETWEEN |

---

## 📁 Estructura del Proyecto

biblioteca/
├── 🐳 docker-compose.yml
├── ⚡ backend/
│   ├── app/
│   │   ├── routers/        # Endpoints API
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── auth.py         # JWT + bcrypt
│   │   └── main.py
│   └── requirements.txt
├── 🌐 frontend/
│   └── src/
│       ├── pages/          # Vistas React
│       └── services/       # Llamadas API
└── 🗄️ db/
    ├── init.sql            # Esquema completo
    └── seeds/seed.sql      # Datos de prueba

---

> Desarrollado como proyecto final de Base de Datos — 2026
