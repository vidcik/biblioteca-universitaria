from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from app.database import get_db
from app.auth import require_bibliotecario

router = APIRouter()

@router.get("/libros-mas-prestados", dependencies=[Depends(require_bibliotecario)])
def libros_mas_prestados(dias: int = Query(30), db: Session = Depends(get_db)):
    """Ranking de libros más prestados con funciones de ventana."""
    result = db.execute(text("""
        SELECT
            titulo,
            total_prestamos,
            RANK() OVER (ORDER BY total_prestamos DESC) AS ranking,
            SUM(total_prestamos) OVER () AS total_general,
            ROUND(total_prestamos * 100.0 / NULLIF(SUM(total_prestamos) OVER (), 0), 2) AS porcentaje
        FROM (
            SELECT l.titulo, COUNT(p.id) AS total_prestamos
            FROM prestamos p
            JOIN ejemplares ej ON p.ejemplar_id = ej.id
            JOIN libros l ON ej.libro_id = l.id
            WHERE p.fecha_prestamo >= NOW() - MAKE_INTERVAL(days => :dias)
            GROUP BY l.id, l.titulo
        ) sub
        ORDER BY ranking
    """), {"dias": dias})
    return [dict(r._mapping) for r in result]

@router.get("/usuarios-mas-prestamos", dependencies=[Depends(require_bibliotecario)])
def usuarios_mas_prestamos(db: Session = Depends(get_db)):
    """Usuarios con más préstamos usando funciones de ventana."""
    result = db.execute(text("""
        SELECT
            u.nombres, u.rol, u.carrera,
            COUNT(p.id) AS total_prestamos,
            RANK() OVER (ORDER BY COUNT(p.id) DESC) AS ranking,
            ROUND(COUNT(p.id) * 100.0 / NULLIF(SUM(COUNT(p.id)) OVER (), 0), 2) AS porcentaje
        FROM prestamos p
        JOIN usuarios u ON p.usuario_id = u.id
        GROUP BY u.id, u.nombres, u.rol, u.carrera
        ORDER BY ranking
    """))
    return [dict(r._mapping) for r in result]

@router.get("/prestamos-activos", dependencies=[Depends(require_bibliotecario)])
def prestamos_activos(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM v_prestamos_activos ORDER BY condicion DESC, dias_retraso DESC"))
    return [dict(r._mapping) for r in result]

@router.get("/inventario", dependencies=[Depends(require_bibliotecario)])
def inventario(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM v_inventario ORDER BY titulo"))
    return [dict(r._mapping) for r in result]

@router.get("/estadisticas-prestamos", dependencies=[Depends(require_bibliotecario)])
def estadisticas(db: Session = Depends(get_db)):
    """Estadísticas mensuales con acumulado."""
    result = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', fecha_prestamo), 'YYYY-MM') AS mes,
            COUNT(*) AS prestamos_mes,
            SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', fecha_prestamo)) AS acumulado,
            ROUND(AVG(COUNT(*)) OVER (
                ORDER BY DATE_TRUNC('month', fecha_prestamo)
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ), 1) AS promedio_3_meses
        FROM prestamos
        GROUP BY DATE_TRUNC('month', fecha_prestamo)
        ORDER BY mes
    """))
    return [dict(r._mapping) for r in result]
