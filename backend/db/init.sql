-- PostgreSQL initialization script for Norma 3100
-- Creates application user with limited privileges
-- Note: POSTGRES_DB and POSTGRES_USER are set via environment variables
-- This script creates an additional limited user for the application

-- Create application user (with limited privileges)
-- Use CREATE USER without IF NOT EXISTS for compatibility
CREATE USER app_user WITH PASSWORD 'app_password_change_me';

-- Grant permissions to app_user (on database level)
GRANT CONNECT ON DATABASE norma3100 TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;
