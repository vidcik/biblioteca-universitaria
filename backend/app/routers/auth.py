from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Usuario
from app.auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter()

class RegisterInput(BaseModel):
    codigo: str
    identificacion: str
    nombres: str
    correo: str
    password: str
    rol: str = "estudiante"
    carrera: str = None

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.correo == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if user.estado == "bloqueado":
        raise HTTPException(status_code=403, detail="Usuario bloqueado")
    token = create_access_token({"sub": str(user.id), "rol": user.rol})
    return {"access_token": token, "token_type": "bearer", "rol": user.rol, "nombres": user.nombres}

@router.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.correo == data.correo).first():
        raise HTTPException(status_code=400, detail="Correo ya registrado")
    user = Usuario(
        codigo=data.codigo, identificacion=data.identificacion,
        nombres=data.nombres, correo=data.correo,
        password_hash=hash_password(data.password),
        rol=data.rol, carrera=data.carrera
    )
    db.add(user); db.commit(); db.refresh(user)
    return {"message": "Usuario registrado", "id": user.id}

@router.get("/me")
def me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id, "nombres": current_user.nombres,
        "correo": current_user.correo, "rol": current_user.rol,
        "estado": current_user.estado, "carrera": current_user.carrera
    }
