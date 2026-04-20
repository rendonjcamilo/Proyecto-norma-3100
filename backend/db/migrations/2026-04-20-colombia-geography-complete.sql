-- Create departments and municipalities tables
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(5) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS municipalities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, department_id)
);

-- Insert departments
INSERT INTO departments (name, code) VALUES
('Amazonas', 'AMA'),
('Antioquia', 'ANT'),
('Arauca', 'ARA'),
('Atlántico', 'ATL'),
('Bolívar', 'BOL'),
('Boyacá', 'BOY'),
('Caldas', 'CAL'),
('Caquetá', 'CAQ'),
('Casanare', 'CAS'),
('Cauca', 'CAU'),
('Cesar', 'CES'),
('Chocó', 'CHO'),
('Córdoba', 'COR'),
('Cundinamarca', 'CUN'),
('Guainía', 'GUA'),
('Guaviare', 'GUV'),
('Huila', 'HUI'),
('La Guajira', 'LAG'),
('Magdalena', 'MAG'),
('Meta', 'MET'),
('Nariño', 'NAR'),
('Norte de Santander', 'NSA'),
('Putumayo', 'PUT'),
('Quindío', 'QUI'),
('Risaralda', 'RIS'),
('San Andrés y Providencia', 'SAP'),
('Santander', 'SAN'),
('Sucre', 'SUC'),
('Tolima', 'TOL'),
('Valle del Cauca', 'VAL'),
('Vaupés', 'VAU'),
('Vichada', 'VIC')
ON CONFLICT DO NOTHING;

-- Insert Antioquia municipalities
INSERT INTO municipalities (name, department_id) VALUES
('Medellín', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Abejorral', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Abriaquí', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Alejandría', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Amagá', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Amalfi', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Andes', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Angecopía', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Angostura', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Anorí', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Antioquia', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Apía', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Arboletes', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Archia', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Argelia', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Anza', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Barbosa', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Belmira', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Bello', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Bolívar', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Buriticá', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Cáceres', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Caicedo', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Calamonte', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Caldas', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Campamento', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Canadá', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Caramanta', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Carbonera', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Cardío', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Carolina', (SELECT id FROM departments WHERE name = 'Antioquia')),
('Cartagena', (SELECT id FROM departments WHERE name = 'Antioquia'))
ON CONFLICT DO NOTHING;

-- Insert Arauca municipalities
INSERT INTO municipalities (name, department_id) VALUES
('Arauca', (SELECT id FROM departments WHERE name = 'Arauca')),
('Arauquita', (SELECT id FROM departments WHERE name = 'Arauca')),
('Cravo Norte', (SELECT id FROM departments WHERE name = 'Arauca')),
('Fortul', (SELECT id FROM departments WHERE name = 'Arauca')),
('Puerto Rondón', (SELECT id FROM departments WHERE name = 'Arauca')),
('Saravena', (SELECT id FROM departments WHERE name = 'Arauca')),
('Tame', (SELECT id FROM departments WHERE name = 'Arauca'))
ON CONFLICT DO NOTHING;

-- Insert Atlántico municipalities
INSERT INTO municipalities (name, department_id) VALUES
('Barranquilla', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Baranoa', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Calamar', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Campo de la Cruz', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Candelaria', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Galapa', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Juan de Acosta', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Luruaco', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Malambo', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Manatí', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Palmar de Varela', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Piojó', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Polonuevo', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Ponedera', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Puerto Colombia', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Repelón', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Sabanalarga', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Sabanilla', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Santa Lucía', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Santo Tomás', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Soledad', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Suan', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Suere', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Tubará', (SELECT id FROM departments WHERE name = 'Atlántico')),
('Usiacurí', (SELECT id FROM departments WHERE name = 'Atlántico'))
ON CONFLICT DO NOTHING;
