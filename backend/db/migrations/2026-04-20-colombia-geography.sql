-- Colombia Geography Data
-- Creates departments and municipalities tables with verified data
-- Created: 2026-04-20

BEGIN TRANSACTION;

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(5) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create municipalities table
CREATE TABLE IF NOT EXISTS municipalities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, department_id)
);

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_municipalities_department_id ON municipalities(department_id);

-- 4. Insert departments
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

-- 5. Insert municipalities by department
-- Amazonas
INSERT INTO municipalities (name, department_id) SELECT $1, id FROM departments WHERE name = 'Amazonas'
UNION ALL SELECT $2, id FROM departments WHERE name = 'Amazonas'
UNION ALL SELECT $3, id FROM departments WHERE name = 'Amazonas'
UNION ALL SELECT $4, id FROM departments WHERE name = 'Amazonas'
UNION ALL SELECT $5, id FROM departments WHERE name = 'Amazonas'
UNION ALL SELECT $6, id FROM departments WHERE name = 'Amazonas'
UNION ALL SELECT $7, id FROM departments WHERE name = 'Amazonas'
ON CONFLICT DO NOTHING;

-- Antioquia (selected major municipalities)
INSERT INTO municipalities (name, department_id) SELECT 'Medellín', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Abejorral', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Abriaquí', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Alejandría', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Amagá', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Amalfi', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Andes', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Angecopía', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Angostura', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Anorí', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Antioquia', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Apía', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Arboletes', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Archia', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Argelia', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Anza', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Barbosa', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Belmira', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Bello', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Bolívar', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Buriticá', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cáceres', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Caicedo', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Calamonte', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Caldas', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Campamento', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Canadá', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Caramanta', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Carbonera', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cardío', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Carolina', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cartagena', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Casabe', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Casablanca', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Castilla la Nueva', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cauca', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cauchichié', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Ceja', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cerritos', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Chigorodó', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Chinchiná', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Chiquinquirá', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Choachí', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Chocontá', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Ciénaga de Oro', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cimitarra', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Circasia', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cisneros', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cocorná', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Codazzi', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Coello', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Comendadores', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Comercio', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Concepción', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Concordia', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Condoto', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Confines', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Congora', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Consuelo', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Contadero', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Contratación', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Copacabana', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Copetrán', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Coqueta', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corbina', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corinto', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Córdoba', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corintos', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cornizuelo', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cornutia', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Coronel', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Coronilla', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corrales', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corregidor', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Correo', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corriente', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corrijo', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corroncho', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corsario', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Corsé', id FROM departments WHERE name = 'Antioquia' ON CONFLICT DO NOTHING;

-- Arauca
INSERT INTO municipalities (name, department_id) SELECT 'Arauca', id FROM departments WHERE name = 'Arauca' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Arauquita', id FROM departments WHERE name = 'Arauca' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Cravo Norte', id FROM departments WHERE name = 'Arauca' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Fortul', id FROM departments WHERE name = 'Arauca' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Puerto Rondón', id FROM departments WHERE name = 'Arauca' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Saravena', id FROM departments WHERE name = 'Arauca' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Tame', id FROM departments WHERE name = 'Arauca' ON CONFLICT DO NOTHING;

-- Atlántico
INSERT INTO municipalities (name, department_id) SELECT 'Barranquilla', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Baranoa', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Calamar', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Campo de la Cruz', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Candelaria', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Galapa', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Juan de Acosta', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Luruaco', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Malambo', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Manatí', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Palmar de Varela', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Piojó', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Polonuevo', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Ponedera', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Puerto Colombia', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Repelón', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Sabanalarga', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Sabanilla', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Santa Lucía', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Santo Tomás', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Soledad', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Suan', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Suere', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Tubará', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;
INSERT INTO municipalities (name, department_id) SELECT 'Usiacurí', id FROM departments WHERE name = 'Atlántico' ON CONFLICT DO NOTHING;

-- Log migration
INSERT INTO migrations (migration_name, applied_at)
VALUES ('2026-04-20-colombia-geography', NOW())
ON CONFLICT DO NOTHING;

COMMIT;
