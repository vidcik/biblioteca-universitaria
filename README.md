📚 Sistema de Gestión de Biblioteca Universitaria
Sistema completo de gestión de biblioteca desarrollado con FastAPI, React, PostgreSQL y Docker.
🚀 Despliegue Rápido
Requisitos: Docker Desktop instalado y corriendo
bashgit clone https://github.com/vidcik/biblioteca-universitaria.git
cd biblioteca-universitaria
docker compose up --build

Frontend: http://localhost:3000
API Docs: http://localhost:8000/docs

👤 Credenciales de Prueba
RolCorreoContraseñaBibliotecarioadmin@biblioteca.edupassword123Estudiantejuan.perez@estudiante.edupassword123Docentemaria.lopez@docente.edupassword123
🏗️ Stack Tecnológico

Frontend: React 18 + Vite + React Router
Backend: FastAPI (Python 3.11)
Base de datos: PostgreSQL 15
Contenedores: Docker + Docker Compose
Servidor web: Nginx

👥 Roles
FunciónEstudianteDocenteBibliotecarioVer catálogo✅✅✅Solicitar préstamo✅✅—Pagar multa✅✅—Aprobar préstamos——✅Agregar/editar libros——✅Gestionar usuarios——✅Ver reportes——✅
🗄️ Base de Datos

3 Vistas, 2 Funciones, 3 Procedimientos almacenados, 1 Trigger
Funciones de ventana SQL: RANK(), SUM OVER(), AVG OVER ROWS BETWEEN
