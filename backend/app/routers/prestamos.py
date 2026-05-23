from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Prestamo, Ejemplar, Usuario
from app.auth import get_current_user, require_bibliotecario

router = APIRouter()

class PrestamoInput(BaseModel):
    ejemplar_id: int
    dias_prestamo: Optional[str] = None

class DevolucionInput(BaseModel):
    observacion: Optional[str] = None
    multa_manual: Optional[float] = None

class PagoMultaInput(BaseModel):
    monto: float

@router.get("/")
def listar_prestamos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol == "bibliotecario":
        result = db.execute(text("""
            SELECT p.id AS prestamo_id, u.nombres AS usuario, l.titulo AS libro,
                   ej.codigo_barras, p.fecha_prestamo, p.fecha_vencimiento,
                   p.estado, p.multa,
                   CASE WHEN NOW() > p.fecha_vencimiento AND p.estado = 'activo' THEN 'VENCIDO' ELSE 'VIGENTE' END AS condicion,
                   GREATEST(0, EXTRACT(DAY FROM NOW() - p.fecha_vencimiento))::INT AS dias_retraso
            FROM prestamos p
            JOIN usuarios u ON p.usuario_id = u.id
            JOIN ejemplares ej ON p.ejemplar_id = ej.id
            JOIN libros l ON ej.libro_id = l.id
            ORDER BY p.creado_en DESC
        """))
    else:
        result = db.execute(text("""
            SELECT p.id, l.titulo, ej.codigo_barras, p.fecha_prestamo,
                   p.fecha_vencimiento, p.estado, p.multa
            FROM prestamos p
            JOIN ejemplares ej ON p.ejemplar_id = ej.id
            JOIN libros l ON ej.libro_id = l.id
            WHERE p.usuario_id = :uid
            ORDER BY p.creado_en DESC
        """), {"uid": current_user.id})
    return [dict(r._mapping) for r in result]

@router.post("/solicitar")
def solicitar_prestamo(data: PrestamoInput, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    ejemplar = db.query(Ejemplar).filter(Ejemplar.id == data.ejemplar_id).first()
    if not ejemplar: raise HTTPException(404, "Ejemplar no encontrado")
    if ejemplar.estado != "disponible": raise HTTPException(400, "Ejemplar no disponible")
    if current_user.estado != "activo": raise HTTPException(403, "Usuario bloqueado")

    # Verificar multas pendientes
    multa_pendiente = db.execute(
        text("SELECT SUM(multa) FROM prestamos WHERE usuario_id = :uid AND multa > 0"),
        {"uid": current_user.id}
    ).scalar()
    if multa_pendiente and float(multa_pendiente) > 0:
        raise HTTPException(403, f"Tienes multas pendientes por ${float(multa_pendiente):,.0f} COP. Págalas antes de solicitar un préstamo")

    dias = data.dias_prestamo or "8dias"
    if dias == "0dias":
        interval = "1 minute"
    elif dias == "1dia":
        interval = "1 day"
    else:
        interval = "8 days"

    fecha_venc = db.execute(text(f"SELECT NOW() + INTERVAL '{interval}'")).scalar()
    prestamo = Prestamo(usuario_id=current_user.id, ejemplar_id=data.ejemplar_id, fecha_vencimiento=fecha_venc, estado="solicitado")
    db.add(prestamo); db.commit(); db.refresh(prestamo)
    return {"message": "Solicitud enviada", "prestamo_id": prestamo.id}

@router.post("/{prestamo_id}/aprobar", dependencies=[Depends(require_bibliotecario)])
def aprobar_prestamo(prestamo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    try:
        db.execute(text("CALL aprobar_prestamo(:p_id, :bib_id)"), {"p_id": prestamo_id, "bib_id": current_user.id})
        db.commit()
        return {"message": "Préstamo aprobado"}
    except Exception as e:
        db.rollback(); raise HTTPException(400, str(e))

@router.post("/{prestamo_id}/devolver", dependencies=[Depends(require_bibliotecario)])
def devolver_prestamo(prestamo_id: int, data: DevolucionInput, db: Session = Depends(get_db)):
    prestamo = db.query(Prestamo).filter(Prestamo.id == prestamo_id, Prestamo.estado.in_(["activo", "vencido"])).first()
    if not prestamo: raise HTTPException(404, "Préstamo no encontrado o ya devuelto")

    ejemplar = db.query(Ejemplar).filter(Ejemplar.id == prestamo.ejemplar_id).first()
    multa = data.multa_manual if data.multa_manual is not None else 0
    prestamo.estado = "devuelto"
    prestamo.multa = multa
    prestamo.observacion_devolucion = data.observacion
    from datetime import datetime
    prestamo.fecha_devolucion = datetime.utcnow()
    if ejemplar: ejemplar.estado = "disponible"
    db.commit()
    return {"message": "Devolución registrada", "multa": float(multa)}

@router.post("/{prestamo_id}/ampliar")
def ampliar_prestamo(prestamo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    try:
        db.execute(text("CALL ampliar_prestamo(:p_id)"), {"p_id": prestamo_id})
        db.commit()
        return {"message": "Fecha ampliada 8 días"}
    except Exception as e:
        db.rollback(); raise HTTPException(400, str(e))

@router.post("/{prestamo_id}/pagar-multa")
def pagar_multa(prestamo_id: int, data: PagoMultaInput, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    prestamo = db.query(Prestamo).filter(Prestamo.id == prestamo_id, Prestamo.usuario_id == current_user.id).first()
    if not prestamo: raise HTTPException(404, "Préstamo no encontrado")
    if not prestamo.multa or prestamo.multa <= 0: raise HTTPException(400, "No hay multa pendiente")
    if data.monto < float(prestamo.multa): raise HTTPException(400, f"El monto mínimo es ${prestamo.multa}")
    prestamo.multa = 0
    db.commit()
    return {"message": "Multa pagada"}
