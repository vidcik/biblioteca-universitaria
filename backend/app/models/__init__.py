from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, TIMESTAMP, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)

class Editorial(Base):
    __tablename__ = "editoriales"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(150), unique=True, nullable=False)
    pais = Column(String(100))

class Autor(Base):
    __tablename__ = "autores"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    nacionalidad = Column(String(100))

class Libro(Base):
    __tablename__ = "libros"
    id = Column(Integer, primary_key=True)
    isbn = Column(String(20), unique=True, nullable=False)
    titulo = Column(String(300), nullable=False)
    editorial_id = Column(Integer, ForeignKey("editoriales.id"))
    anio = Column(Integer)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    descripcion = Column(Text)
    tipo_prestamo = Column(String(10), default="8dias")
    palabras_clave = Column(ARRAY(String))
    creado_en = Column(TIMESTAMP, server_default=func.now())
    editorial = relationship("Editorial")
    categoria = relationship("Categoria")
    autores = relationship("Autor", secondary="libros_autores")
    ejemplares = relationship("Ejemplar", back_populates="libro")

class LibroAutor(Base):
    __tablename__ = "libros_autores"
    libro_id = Column(Integer, ForeignKey("libros.id"), primary_key=True)
    autor_id = Column(Integer, ForeignKey("autores.id"), primary_key=True)

class Ejemplar(Base):
    __tablename__ = "ejemplares"
    id = Column(Integer, primary_key=True)
    libro_id = Column(Integer, ForeignKey("libros.id"), nullable=False)
    codigo_barras = Column(String(50), unique=True, nullable=False)
    sala = Column(String(50))
    estante = Column(String(50))
    estado = Column(String(20), default="disponible")
    creado_en = Column(TIMESTAMP, server_default=func.now())
    libro = relationship("Libro", back_populates="ejemplares")

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True)
    codigo = Column(String(50), unique=True, nullable=False)
    identificacion = Column(String(30), unique=True, nullable=False)
    nombres = Column(String(200), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="estudiante")
    carrera = Column(String(150))
    estado = Column(String(20), default="activo")
    creado_en = Column(TIMESTAMP, server_default=func.now())

class Prestamo(Base):
    __tablename__ = "prestamos"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    ejemplar_id = Column(Integer, ForeignKey("ejemplares.id"), nullable=False)
    fecha_prestamo = Column(TIMESTAMP, server_default=func.now())
    fecha_vencimiento = Column(TIMESTAMP, nullable=False)
    fecha_devolucion = Column(TIMESTAMP)
    estado = Column(String(20), default="solicitado")
    aprobado_por = Column(Integer, ForeignKey("usuarios.id"))
    observacion_devolucion = Column(Text)
    multa = Column(Numeric(10, 2), default=0)
    creado_en = Column(TIMESTAMP, server_default=func.now())
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    ejemplar = relationship("Ejemplar")

class Reserva(Base):
    __tablename__ = "reservas"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    ejemplar_id = Column(Integer, ForeignKey("ejemplares.id"), nullable=False)
    fecha_reserva = Column(TIMESTAMP, server_default=func.now())
    estado = Column(String(20), default="activa")
    usuario = relationship("Usuario")
    ejemplar = relationship("Ejemplar")

class Notificacion(Base):
    __tablename__ = "notificaciones"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    prestamo_id = Column(Integer, ForeignKey("prestamos.id"))
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, default=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())
