from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import Libro, Autor, Editorial, Categoria, LibroAutor
from app.auth import get_current_user, require_bibliotecario

router = APIRouter()

class LibroInput(BaseModel):
    isbn: str
    titulo: str
    editorial_id: Optional[int] = None
    anio: Optional[int] = None
    categoria_id: Optional[int] = None
    descripcion: Optional[str] = None
    tipo_prestamo: str = "8dias"
    palabras_clave: Optional[List[str]] = []
    autor_ids: Optional[List[int]] = []

# IMPORTANTE: rutas fijas ANTES de /{libro_id}
@router.get("/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    return [{"id": c.id, "nombre": c.nombre} for c in db.query(Categoria).all()]

@router.get("/editoriales")
def listar_editoriales(db: Session = Depends(get_db)):
    return [{"id": e.id, "nombre": e.nombre} for e in db.query(Editorial).all()]

@router.get("/")
def listar_libros(
    q: Optional[str] = Query(None),
    categoria_id: Optional[int] = None,
    disponible: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = "SELECT * FROM v_catalogo WHERE 1=1"
    params = {}
    if q:
        query += " AND (titulo ILIKE :q OR autores ILIKE :q OR isbn ILIKE :q)"
        params["q"] = f"%{q}%"
    if categoria_id:
        query += " AND libro_id IN (SELECT id FROM libros WHERE categoria_id = :cat)"
        params["cat"] = categoria_id
    if disponible is True:
        query += " AND disponibles > 0"
    result = db.execute(text(query), params)
    return [dict(row._mapping) for row in result]

@router.get("/{libro_id}")
def obtener_libro(libro_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM v_catalogo WHERE libro_id = :id"), {"id": libro_id})
    row = result.fetchone()
    if not row: raise HTTPException(404, "Libro no encontrado")
    return dict(row._mapping)

@router.post("/", dependencies=[Depends(require_bibliotecario)])
def crear_libro(data: LibroInput, db: Session = Depends(get_db)):
    libro = Libro(
        isbn=data.isbn, titulo=data.titulo, editorial_id=data.editorial_id,
        anio=data.anio, categoria_id=data.categoria_id, descripcion=data.descripcion,
        tipo_prestamo=data.tipo_prestamo, palabras_clave=data.palabras_clave
    )
    db.add(libro); db.flush()
    for a_id in (data.autor_ids or []):
        db.add(LibroAutor(libro_id=libro.id, autor_id=a_id))
    db.commit()
    return {"message": "Libro creado", "id": libro.id}

@router.put("/{libro_id}", dependencies=[Depends(require_bibliotecario)])
def actualizar_libro(libro_id: int, data: LibroInput, db: Session = Depends(get_db)):
    libro = db.query(Libro).filter(Libro.id == libro_id).first()
    if not libro: raise HTTPException(404, "No encontrado")
    for k, v in data.dict(exclude={"autor_ids"}).items():
        setattr(libro, k, v)
    db.query(LibroAutor).filter(LibroAutor.libro_id == libro_id).delete()
    for a_id in (data.autor_ids or []):
        db.add(LibroAutor(libro_id=libro_id, autor_id=a_id))
    db.commit()
    return {"message": "Actualizado"}

@router.delete("/{libro_id}", dependencies=[Depends(require_bibliotecario)])
def eliminar_libro(libro_id: int, db: Session = Depends(get_db)):
    libro = db.query(Libro).filter(Libro.id == libro_id).first()
    if not libro: raise HTTPException(404, "No encontrado")
    db.delete(libro); db.commit()
    return {"message": "Eliminado"}
