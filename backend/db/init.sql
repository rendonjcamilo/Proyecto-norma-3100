-- PostgreSQL initialization script for Norma 3100
-- Creates database and users

-- Create norma3100 database if it doesn't exist
CREATE DATABASE IF NOT EXISTS norma3100;

-- Create application user (with limited privileges)
CREATE USER IF NOT EXISTS app_user WITH PASSWORD 'app_password_change_me';

-- Grant permissions to app_user (on database level)
GRANT CONNECT ON DATABASE norma3100 TO app_user;
