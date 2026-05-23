from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Usuario
from app.auth import get_current_user, require_bibliotecario, hash_password

router = APIRouter()

class UsuarioInput(BaseModel):
    codigo: str
    identificacion: str
    nombres: str
    correo: str
    password: str
    rol: str = "estudiante"
    carrera: Optional[str] = None
    estado: str = "activo"

@router.get("/", dependencies=[Depends(require_bibliotecario)])
def listar_usuarios(db: Session = Depends(get_db)):
    users = db.query(Usuario).all()
    return [{"id": u.id, "codigo": u.codigo, "nombres": u.nombres,
             "correo": u.correo, "rol": u.rol, "estado": u.estado} for u in users]

@router.get("/{user_id}")
def obtener_usuario(user_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "bibliotecario" and current_user.id != user_id:
        raise HTTPException(403, "Sin acceso")
    u = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not u: raise HTTPException(404, "No encontrado")
    return {"id": u.id, "codigo": u.codigo, "nombres": u.nombres,
            "correo": u.correo, "rol": u.rol, "estado": u.estado, "carrera": u.carrera}

@router.post("/", dependencies=[Depends(require_bibliotecario)])
def crear_usuario(data: UsuarioInput, db: Session = Depends(get_db)):
    u = Usuario(**{**data.dict(exclude={"password"}), "password_hash": hash_password(data.password)})
    db.add(u); db.commit(); db.refresh(u)
    return {"message": "Usuario creado", "id": u.id}

@router.put("/{user_id}", dependencies=[Depends(require_bibliotecario)])
def actualizar_usuario(user_id: int, data: UsuarioInput, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not u: raise HTTPException(404, "No encontrado")
    for k, v in data.dict(exclude={"password"}).items(): setattr(u, k, v)
    if data.password: u.password_hash = hash_password(data.password)
    db.commit()
    return {"message": "Actualizado"}

@router.patch("/{user_id}/estado", dependencies=[Depends(require_bibliotecario)])
def cambiar_estado(user_id: int, estado: str, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not u: raise HTTPException(404, "No encontrado")
    u.estado = estado; db.commit()
    return {"message": f"Estado actualizado a {estado}"}

@router.delete("/{user_id}", dependencies=[Depends(require_bibliotecario)])
def eliminar_usuario(user_id: int, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not u: raise HTTPException(404, "No encontrado")
    db.delete(u); db.commit()
    return {"message": "Eliminado"}
