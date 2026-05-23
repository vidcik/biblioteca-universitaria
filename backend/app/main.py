from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, libros, ejemplares, usuarios, prestamos, reservas, reportes

app = FastAPI(
    title="Sistema de Biblioteca Universitaria",
    description="API REST para gestión de biblioteca",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",       tags=["Autenticación"])
app.include_router(libros.router,     prefix="/api/libros",     tags=["Libros"])
app.include_router(ejemplares.router, prefix="/api/ejemplares", tags=["Ejemplares"])
app.include_router(usuarios.router,   prefix="/api/usuarios",   tags=["Usuarios"])
app.include_router(prestamos.router,  prefix="/api/prestamos",  tags=["Préstamos"])
app.include_router(reservas.router,   prefix="/api/reservas",   tags=["Reservas"])
app.include_router(reportes.router,   prefix="/api/reportes",   tags=["Reportes"])

@app.get("/")
def root():
    return {"message": "Biblioteca Universitaria API", "docs": "/docs"}
