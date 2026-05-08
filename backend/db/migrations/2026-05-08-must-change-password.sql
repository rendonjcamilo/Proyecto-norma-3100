-- Agrega columna must_change_password a la tabla users
-- Cuando es true, el usuario debe cambiar su contraseña en el primer login

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
