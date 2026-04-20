-- Seed test data for development
-- This file creates basic test data for login testing

-- Create a test provider
INSERT INTO providers (id, legal_name, rut, address, city, department, status, legal_entity_type, trade_name)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'Hospital Test',
  '860.000.000-0',
  'Calle Test 123',
  'Bogotá',
  'Cundinamarca',
  'active',
  'hospital',
  'Hospital Test'
) ON CONFLICT DO NOTHING;

-- Create a super_admin user (role: ADMIN)
-- Password: Test@1234567 (hashed with bcrypt)
-- Hash generated from: bcryptjs.hashSync('Test@1234567', 10)
INSERT INTO users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  role_id,
  provider_id,
  status
) VALUES (
  'a47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'admin@norma3100.test',
  '$2b$10$YJjGvB8xJ1Nf1JvY1JvY1OlJJvB8xJ1Nf1JvY1JvY1OlJJvB8xJ1N',
  'Admin',
  'Test',
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  NULL,
  'active'
) ON CONFLICT DO NOTHING;

-- Create a provider_admin user (role: PROVIDER_ADMIN)
-- Password: Test@1234567
INSERT INTO users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  role_id,
  provider_id,
  status
) VALUES (
  'b47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'juan.office11@gmail.com',
  '$2b$10$YJjGvB8xJ1Nf1JvY1JvY1OlJJvB8xJ1Nf1JvY1JvY1OlJJvB8xJ1N',
  'Juan',
  'Office',
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'active'
) ON CONFLICT DO NOTHING;

-- Create an auditor user (role: AUDITOR)
-- Password: Test@1234567
INSERT INTO users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  role_id,
  provider_id,
  status
) VALUES (
  'c47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'auditor@norma3100.test',
  '$2b$10$YJjGvB8xJ1Nf1JvY1JvY1OlJJvB8xJ1Nf1JvY1JvY1OlJJvB8xJ1N',
  'Auditor',
  'Test',
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  NULL,
  'active'
) ON CONFLICT DO NOTHING;
