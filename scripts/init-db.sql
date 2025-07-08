-- Vanity Hub Database Initialization Script
-- This script sets up the PostgreSQL database with proper extensions and configurations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS analytics;
-- CREATE SCHEMA IF NOT EXISTS reporting;

-- Set timezone
SET timezone = 'Asia/Qatar';

-- Create indexes for better performance (will be created by Prisma migrations)
-- These are just examples of what we might need

-- Performance optimization settings
-- These will be applied when the database starts

-- Log configuration for development
-- ALTER SYSTEM SET log_statement = 'all';
-- ALTER SYSTEM SET log_duration = on;
-- ALTER SYSTEM SET log_min_duration_statement = 100;

-- Connection settings
-- ALTER SYSTEM SET max_connections = 100;
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';

-- Reload configuration
-- SELECT pg_reload_conf();

-- Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE vanity_hub TO vanity_user;
GRANT ALL ON SCHEMA public TO vanity_user;

-- Create a read-only user for reporting (optional)
-- CREATE USER vanity_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE vanity_hub TO vanity_readonly;
-- GRANT USAGE ON SCHEMA public TO vanity_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO vanity_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO vanity_readonly;
