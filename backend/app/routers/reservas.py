from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Reserva, Ejemplar, Usuario
from app.auth import get_current_user

router = APIRouter()

class ReservaInput(BaseModel):
    ejemplar_id: int

@router.get("/")
def mis_reservas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    rs = db.query(Reserva).filter(Reserva.usuario_id == current_user.id).all()
    return [{"id": r.id, "ejemplar_id": r.ejemplar_id, "estado": r.estado,
             "fecha_reserva": r.fecha_reserva} for r in rs]

@router.post("/")
def crear_reserva(data: ReservaInput, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    ejemplar = db.query(Ejemplar).filter(Ejemplar.id == data.ejemplar_id).first()
    if not ejemplar: raise HTTPException(404, "Ejemplar no encontrado")
    if ejemplar.estado == "disponible":
        raise HTTPException(400, "El ejemplar está disponible, solicite préstamo directamente")
    # Verificar si ya tiene reserva activa
    ya = db.query(Reserva).filter(
        Reserva.usuario_id == current_user.id,
        Reserva.ejemplar_id == data.ejemplar_id,
        Reserva.estado == "activa"
    ).first()
    if ya: raise HTTPException(400, "Ya tiene una reserva activa para este ejemplar")
    r = Reserva(usuario_id=current_user.id, ejemplar_id=data.ejemplar_id)
    db.add(r); db.commit(); db.refresh(r)
    return {"message": "Reserva creada", "id": r.id}

@router.delete("/{reserva_id}")
def cancelar_reserva(reserva_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    r = db.query(Reserva).filter(Reserva.id == reserva_id, Reserva.usuario_id == current_user.id).first()
    if not r: raise HTTPException(404, "No encontrada")
    r.estado = "cancelada"; db.commit()
    return {"message": "Reserva cancelada"}
