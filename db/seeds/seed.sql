-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- Editoriales
INSERT INTO editoriales (nombre, pais) VALUES
    ('Pearson', 'USA'), ('O''Reilly', 'USA'), ('Alfaomega', 'México'),
    ('Planeta', 'España'), ('McGraw-Hill', 'USA');

-- Autores
INSERT INTO autores (nombre, nacionalidad) VALUES
    ('Robert C. Martin', 'Estadounidense'),
    ('Andrew S. Tanenbaum', 'Estadounidense'),
    ('Gabriel García Márquez', 'Colombiano'),
    ('Donald E. Knuth', 'Estadounidense'),
    ('Thomas H. Cormen', 'Estadounidense');

-- Libros
INSERT INTO libros (isbn, titulo, editorial_id, anio, categoria_id, descripcion, tipo_prestamo, palabras_clave) VALUES
    ('978-0132350884', 'Clean Code', 2, 2008, 2, 'Guía de buenas prácticas de programación', '8dias', ARRAY['programación', 'software', 'clean code']),
    ('978-0136042594', 'Computer Networks', 1, 2010, 2, 'Redes de computadoras: conceptos fundamentales', '8dias', ARRAY['redes', 'tcp/ip', 'protocolos']),
    ('978-9586144445', 'Cien Años de Soledad', 4, 1967, 3, 'Obra maestra del realismo mágico', '1dia', ARRAY['literatura', 'colombia', 'realismo mágico']),
    ('978-0201896831', 'The Art of Computer Programming', 5, 1998, 5, 'Análisis de algoritmos', '8dias', ARRAY['algoritmos', 'matemáticas', 'programación']),
    ('978-0262033848', 'Introduction to Algorithms', 5, 2009, 2, 'Algoritmos y estructuras de datos', '8dias', ARRAY['algoritmos', 'estructuras de datos']);

-- Relaciones libro-autor
INSERT INTO libros_autores VALUES (1,1),(2,2),(3,3),(4,4),(5,5);

-- Ejemplares
INSERT INTO ejemplares (libro_id, codigo_barras, sala, estante, estado) VALUES
    (1, 'EJ-0001', 'Sala A', 'Estante 1', 'disponible'),
    (1, 'EJ-0002', 'Sala A', 'Estante 1', 'disponible'),
    (2, 'EJ-0003', 'Sala B', 'Estante 3', 'disponible'),
    (3, 'EJ-0004', 'Sala A', 'Estante 2', 'disponible'),
    (4, 'EJ-0005', 'Sala C', 'Estante 1', 'disponible'),
    (5, 'EJ-0006', 'Sala C', 'Estante 2', 'disponible'),
    (5, 'EJ-0007', 'Sala C', 'Estante 2', 'prestado');

-- Usuarios (passwords hasheados = "password123" con bcrypt - solo para testing)
INSERT INTO usuarios (codigo, identificacion, nombres, correo, password_hash, rol, carrera) VALUES
    ('ADMIN001', '1000000001', 'Admin Bibliotecario', 'admin@biblioteca.edu', '$2b$12$5hdISs90AWOYCBIF8UtLF.yt5dDV0IfpiWzBLU5kj0TPaybAbV5aC', 'bibliotecario', NULL),
    ('EST001', '1000000002', 'Juan Pérez García', 'juan.perez@estudiante.edu', '$2b$12$5hdISs90AWOYCBIF8UtLF.yt5dDV0IfpiWzBLU5kj0TPaybAbV5aC', 'estudiante', 'Ingeniería de Sistemas'),
    ('DOC001', '1000000003', 'María López Ruiz', 'maria.lopez@docente.edu', '$2b$12$5hdISs90AWOYCBIF8UtLF.yt5dDV0IfpiWzBLU5kj0TPaybAbV5aC', 'docente', NULL),
    ('EST002', '1000000004', 'Carlos Martínez', 'carlos.m@estudiante.edu', '$2b$12$5hdISs90AWOYCBIF8UtLF.yt5dDV0IfpiWzBLU5kj0TPaybAbV5aC', 'estudiante', 'Administración');

-- Préstamo de prueba activo
INSERT INTO prestamos (usuario_id, ejemplar_id, fecha_prestamo, fecha_vencimiento, estado, aprobado_por)
VALUES (2, 7, NOW() - INTERVAL '5 days', NOW() + INTERVAL '3 days', 'activo', 1);
