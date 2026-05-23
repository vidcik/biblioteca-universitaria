from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Ejemplar, Usuario, Reserva
from app.auth import get_current_user, require_bibliotecario

# ── EJEMPLARES ────────────────────────────────────────────────
router = APIRouter()

class EjemplarInput(BaseModel):
    libro_id: int
    codigo_barras: str
    sala: Optional[str] = None
    estante: Optional[str] = None
    estado: str = "disponible"

@router.get("/")
def listar_ejemplares(libro_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Ejemplar)
    if libro_id: q = q.filter(Ejemplar.libro_id == libro_id)
    return [{"id": e.id, "codigo_barras": e.codigo_barras, "sala": e.sala,
             "estante": e.estante, "estado": e.estado, "libro_id": e.libro_id} for e in q.all()]

@router.post("/", dependencies=[Depends(require_bibliotecario)])
def crear_ejemplar(data: EjemplarInput, db: Session = Depends(get_db)):
    ej = Ejemplar(**data.dict()); db.add(ej); db.commit(); db.refresh(ej)
    return {"message": "Ejemplar creado", "id": ej.id}

@router.put("/{ej_id}", dependencies=[Depends(require_bibliotecario)])
def actualizar_ejemplar(ej_id: int, data: EjemplarInput, db: Session = Depends(get_db)):
    ej = db.query(Ejemplar).filter(Ejemplar.id == ej_id).first()
    if not ej: raise HTTPException(404, "No encontrado")
    for k, v in data.dict().items(): setattr(ej, k, v)
    db.commit()
    return {"message": "Actualizado"}

@router.delete("/{ej_id}", dependencies=[Depends(require_bibliotecario)])
def eliminar_ejemplar(ej_id: int, db: Session = Depends(get_db)):
    ej = db.query(Ejemplar).filter(Ejemplar.id == ej_id).first()
    if not ej: raise HTTPException(404, "No encontrado")
    db.delete(ej); db.commit()
    return {"message": "Eliminado"}
