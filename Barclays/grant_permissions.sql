-- ============================================================================
-- BARCLAYS AML - DATABASE PERMISSION SETUP
-- ============================================================================
-- Run this script as the 'postgres' superuser to grant necessary permissions
-- to the barclays_app user so it can create tables for authentication
--
-- Usage: psql -U postgres -d barclays_aml -f grant_permissions.sql

-- Grant CREATE privilege on public schema
GRANT CREATE ON SCHEMA public TO barclays_app;

-- Grant usage on public schema  
GRANT USAGE ON SCHEMA public TO barclays_app;

-- Grant privileges on all existing tables to barclays_app
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO barclays_app;

-- Grant privileges on all sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO barclays_app;

-- Make this default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO barclays_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO barclays_app;

-- Verify permissions
\du barclays_app

-- ============================================================================
-- OUTPUT: You should see barclays_app with:
-- - Attributes: Create DB, Can create more roles
-- - Member of: (none)
-- ============================================================================
