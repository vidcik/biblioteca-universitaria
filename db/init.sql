-- ============================================================
-- BIBLIOTECA UNIVERSITARIA - Esquema de Base de Datos
-- PostgreSQL 15
-- ============================================================

-- ============================================================
-- TABLAS BASE
-- ============================================================

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE editoriales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    pais VARCHAR(100)
);

CREATE TABLE autores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nacionalidad VARCHAR(100)
);

CREATE TABLE libros (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    titulo VARCHAR(300) NOT NULL,
    editorial_id INT REFERENCES editoriales(id),
    anio INT,
    categoria_id INT REFERENCES categorias(id),
    descripcion TEXT,
    tipo_prestamo VARCHAR(10) NOT NULL DEFAULT '8dias'
        CHECK (tipo_prestamo IN ('1dia', '8dias')),
    palabras_clave TEXT[],
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE libros_autores (
    libro_id INT REFERENCES libros(id) ON DELETE CASCADE,
    autor_id INT REFERENCES autores(id) ON DELETE CASCADE,
    PRIMARY KEY (libro_id, autor_id)
);

CREATE TABLE ejemplares (
    id SERIAL PRIMARY KEY,
    libro_id INT NOT NULL REFERENCES libros(id) ON DELETE CASCADE,
    codigo_barras VARCHAR(50) NOT NULL UNIQUE,
    sala VARCHAR(50),
    estante VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'prestado', 'perdido')),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    identificacion VARCHAR(30) NOT NULL UNIQUE,
    nombres VARCHAR(200) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'estudiante'
        CHECK (rol IN ('estudiante', 'docente', 'bibliotecario')),
    carrera VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'bloqueado')),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE multas_config (
    id SERIAL PRIMARY KEY,
    tarifa_por_dia NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    vigente_desde TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prestamos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id),
    fecha_prestamo TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_vencimiento TIMESTAMP NOT NULL,
    fecha_devolucion TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'solicitado'
        CHECK (estado IN ('solicitado', 'activo', 'devuelto', 'vencido')),
    aprobado_por INT REFERENCES usuarios(id),
    observacion_devolucion TEXT,
    multa NUMERIC(10,2) DEFAULT 0,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id),
    fecha_reserva TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'cancelada', 'completada')),
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    prestamo_id INT REFERENCES prestamos(id),
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_libros_titulo ON libros USING gin(to_tsvector('spanish', titulo));
CREATE INDEX idx_libros_isbn ON libros(isbn);
CREATE INDEX idx_ejemplares_estado ON ejemplares(estado);
CREATE INDEX idx_prestamos_usuario ON prestamos(usuario_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);
CREATE INDEX idx_reservas_ejemplar ON reservas(ejemplar_id, estado);

-- ============================================================
-- VISTAS
-- ============================================================

-- Vista: catálogo completo con disponibilidad
CREATE VIEW v_catalogo AS
SELECT
    l.id AS libro_id,
    l.isbn,
    l.titulo,
    l.anio,
    l.tipo_prestamo,
    l.descripcion,
    l.palabras_clave,
    c.nombre AS categoria,
    e.nombre AS editorial,
    STRING_AGG(DISTINCT a.nombre, ', ') AS autores,
    COUNT(DISTINCT ej.id) AS total_ejemplares,
    COUNT(DISTINCT ej.id) FILTER (WHERE ej.estado = 'disponible') AS disponibles
FROM libros l
LEFT JOIN categorias c ON l.categoria_id = c.id
LEFT JOIN editoriales e ON l.editorial_id = e.id
LEFT JOIN libros_autores la ON l.id = la.libro_id
LEFT JOIN autores a ON la.autor_id = a.id
LEFT JOIN ejemplares ej ON l.id = ej.libro_id
GROUP BY l.id, c.nombre, e.nombre;

-- Vista: préstamos activos con detalle
CREATE VIEW v_prestamos_activos AS
SELECT
    p.id AS prestamo_id,
    u.nombres AS usuario,
    u.correo,
    u.rol,
    l.titulo AS libro,
    ej.codigo_barras,
    p.fecha_prestamo,
    p.fecha_vencimiento,
    CASE WHEN NOW() > p.fecha_vencimiento THEN 'VENCIDO' ELSE 'VIGENTE' END AS condicion,
    EXTRACT(DAY FROM NOW() - p.fecha_vencimiento) AS dias_retraso
FROM prestamos p
JOIN usuarios u ON p.usuario_id = u.id
JOIN ejemplares ej ON p.ejemplar_id = ej.id
JOIN libros l ON ej.libro_id = l.id
WHERE p.estado IN ('activo', 'vencido');

-- Vista: inventario por estado
CREATE VIEW v_inventario AS
SELECT
    l.id,
    l.titulo,
    l.isbn,
    COUNT(ej.id) AS total,
    COUNT(ej.id) FILTER (WHERE ej.estado = 'disponible') AS disponibles,
    COUNT(ej.id) FILTER (WHERE ej.estado = 'prestado') AS prestados,
    COUNT(ej.id) FILTER (WHERE ej.estado = 'perdido') AS perdidos
FROM libros l
LEFT JOIN ejemplares ej ON l.id = ej.libro_id
GROUP BY l.id, l.titulo, l.isbn;

-- ============================================================
-- FUNCIONES
-- ============================================================

-- Calcular multa de un préstamo
CREATE OR REPLACE FUNCTION calcular_multa(prestamo_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_vencimiento TIMESTAMP;
    v_devolucion TIMESTAMP;
    v_dias_retraso INT;
    v_tarifa NUMERIC;
BEGIN
    SELECT fecha_vencimiento, COALESCE(fecha_devolucion, NOW())
    INTO v_vencimiento, v_devolucion
    FROM prestamos WHERE id = prestamo_id;

    SELECT tarifa_por_dia INTO v_tarifa
    FROM multas_config ORDER BY vigente_desde DESC LIMIT 1;

    v_dias_retraso := GREATEST(0, EXTRACT(DAY FROM v_devolucion - v_vencimiento)::INT);
    RETURN v_dias_retraso * COALESCE(v_tarifa, 500);
END;
$$ LANGUAGE plpgsql;

-- Obtener fecha de vencimiento según tipo de préstamo del libro
CREATE OR REPLACE FUNCTION fecha_vencimiento_prestamo(ejemplar_id INT, desde TIMESTAMP DEFAULT NOW())
RETURNS TIMESTAMP AS $$
DECLARE
    v_tipo VARCHAR(10);
BEGIN
    SELECT l.tipo_prestamo INTO v_tipo
    FROM ejemplares ej JOIN libros l ON ej.libro_id = l.id
    WHERE ej.id = ejemplar_id;

    IF v_tipo = '1dia' THEN
        RETURN desde + INTERVAL '1 day';
    ELSE
        RETURN desde + INTERVAL '8 days';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================

-- Aprobar préstamo (cambia estado a activo, marca ejemplar como prestado)
CREATE OR REPLACE PROCEDURE aprobar_prestamo(p_prestamo_id INT, p_bibliotecario_id INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_ejemplar_id INT;
    v_usuario_id INT;
    v_estado_usuario VARCHAR;
    v_estado_ejemplar VARCHAR;
BEGIN
    SELECT p.ejemplar_id, p.usuario_id, u.estado, ej.estado
    INTO v_ejemplar_id, v_usuario_id, v_estado_usuario, v_estado_ejemplar
    FROM prestamos p
    JOIN usuarios u ON p.usuario_id = u.id
    JOIN ejemplares ej ON p.ejemplar_id = ej.id
    WHERE p.id = p_prestamo_id AND p.estado = 'solicitado';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Préstamo no encontrado o no está en estado solicitado';
    END IF;
    IF v_estado_usuario != 'activo' THEN
        RAISE EXCEPTION 'Usuario bloqueado, no se puede aprobar el préstamo';
    END IF;
    IF v_estado_ejemplar != 'disponible' THEN
        RAISE EXCEPTION 'El ejemplar no está disponible';
    END IF;

    UPDATE prestamos SET
        estado = 'activo',
        aprobado_por = p_bibliotecario_id,
        fecha_vencimiento = fecha_vencimiento_prestamo(v_ejemplar_id, NOW())
    WHERE id = p_prestamo_id;

    UPDATE ejemplares SET estado = 'prestado' WHERE id = v_ejemplar_id;

    INSERT INTO notificaciones (usuario_id, prestamo_id, mensaje)
    SELECT v_usuario_id, p_prestamo_id,
        'Tu préstamo fue aprobado. Fecha de devolución: ' ||
        TO_CHAR(fecha_vencimiento, 'DD/MM/YYYY')
    FROM prestamos WHERE id = p_prestamo_id;
END;
$$;

-- Registrar devolución
CREATE OR REPLACE PROCEDURE registrar_devolucion(
    p_prestamo_id INT,
    p_observacion TEXT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_ejemplar_id INT;
    v_multa NUMERIC;
BEGIN
    SELECT ejemplar_id INTO v_ejemplar_id
    FROM prestamos WHERE id = p_prestamo_id AND estado IN ('activo','vencido');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Préstamo no encontrado o ya fue devuelto';
    END IF;

    v_multa := calcular_multa(p_prestamo_id);

    UPDATE prestamos SET
        estado = 'devuelto',
        fecha_devolucion = NOW(),
        observacion_devolucion = p_observacion,
        multa = v_multa
    WHERE id = p_prestamo_id;

    UPDATE ejemplares SET estado = 'disponible' WHERE id = v_ejemplar_id;

    -- Activar siguiente reserva si existe
    UPDATE reservas SET estado = 'completada'
    WHERE id = (
        SELECT id FROM reservas
        WHERE ejemplar_id = v_ejemplar_id AND estado = 'activa'
        ORDER BY fecha_reserva ASC LIMIT 1
    );
END;
$$;

-- Ampliar fecha de préstamo
CREATE OR REPLACE PROCEDURE ampliar_prestamo(p_prestamo_id INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_ejemplar_id INT;
    v_tiene_reserva BOOLEAN;
BEGIN
    SELECT p.ejemplar_id INTO v_ejemplar_id
    FROM prestamos p WHERE p.id = p_prestamo_id AND p.estado = 'activo';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Préstamo no activo';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM reservas
        WHERE ejemplar_id = v_ejemplar_id AND estado = 'activa'
    ) INTO v_tiene_reserva;

    IF v_tiene_reserva THEN
        RAISE EXCEPTION 'No se puede ampliar: el ejemplar tiene una reserva activa';
    END IF;

    UPDATE prestamos SET
        fecha_vencimiento = fecha_vencimiento + INTERVAL '8 days'
    WHERE id = p_prestamo_id;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: marcar préstamos vencidos automáticamente
CREATE OR REPLACE FUNCTION fn_actualizar_prestamos_vencidos()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE prestamos
    SET estado = 'vencido'
    WHERE estado = 'activo' AND fecha_vencimiento < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_notificar_vencimiento_proximo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'activo' AND
       NEW.fecha_vencimiento BETWEEN NOW() AND NOW() + INTERVAL '2 days' THEN
        INSERT INTO notificaciones (usuario_id, prestamo_id, mensaje)
        VALUES (NEW.usuario_id, NEW.id,
            'Recuerda devolver tu préstamo antes del ' ||
            TO_CHAR(NEW.fecha_vencimiento, 'DD/MM/YYYY HH24:MI'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificar_vencimiento
AFTER INSERT OR UPDATE ON prestamos
FOR EACH ROW EXECUTE FUNCTION fn_notificar_vencimiento_proximo();

-- ============================================================
-- CONSULTAS CON FUNCIONES DE VENTANA (para reportes)
-- ============================================================

-- Ejemplo: ranking de libros más prestados por periodo
-- SELECT titulo, total_prestamos,
--        RANK() OVER (ORDER BY total_prestamos DESC) AS ranking,
--        SUM(total_prestamos) OVER () AS total_general,
--        ROUND(total_prestamos * 100.0 / SUM(total_prestamos) OVER (), 2) AS porcentaje
-- FROM (
--     SELECT l.titulo, COUNT(p.id) AS total_prestamos
--     FROM prestamos p
--     JOIN ejemplares ej ON p.ejemplar_id = ej.id
--     JOIN libros l ON ej.libro_id = l.id
--     WHERE p.fecha_prestamo >= NOW() - INTERVAL '30 days'
--     GROUP BY l.id, l.titulo
-- ) sub ORDER BY ranking;

-- ============================================================
-- DATOS INICIALES (admin y configuración)
-- ============================================================

INSERT INTO multas_config (tarifa_por_dia) VALUES (500.00);

-- Categorías base
INSERT INTO categorias (nombre) VALUES
    ('Ciencias'), ('Tecnología'), ('Literatura'), ('Historia'),
    ('Matemáticas'), ('Ingeniería'), ('Arte'), ('Derecho');
