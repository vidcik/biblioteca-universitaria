from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt as _bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
import os

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain, hashed):
    return _bcrypt.checkpw(plain.encode(), hashed.encode())

def hash_password(password):
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None: raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if user is None: raise credentials_exception
    return user

def require_bibliotecario(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != "bibliotecario":
        raise HTTPException(status_code=403, detail="Acceso denegado: requiere rol bibliotecario")
    return current_user
