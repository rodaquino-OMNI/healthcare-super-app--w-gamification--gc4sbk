-- AUSTA SuperApp Database Creation Script
-- This script creates all required databases for the AUSTA SuperApp microservices
-- Each service has its own isolated database for proper data separation

-- Set default encoding and locale settings
SET client_encoding = 'UTF8';

-- Create health_journey database (with TimescaleDB extension support)
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'health_journey') THEN
        CREATE DATABASE health_journey
        WITH 
        OWNER = postgres
        ENCODING = 'UTF8'
        LC_COLLATE = 'pt_BR.UTF-8'
        LC_CTYPE = 'pt_BR.UTF-8'
        TEMPLATE = template0
        CONNECTION LIMIT = -1;
        
        COMMENT ON DATABASE health_journey IS 'Stores health journey data including metrics, goals, and device connections';
    END IF;
END
$$;

-- Create care_journey database
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'care_journey') THEN
        CREATE DATABASE care_journey
        WITH 
        OWNER = postgres
        ENCODING = 'UTF8'
        LC_COLLATE = 'pt_BR.UTF-8'
        LC_CTYPE = 'pt_BR.UTF-8'
        TEMPLATE = template0
        CONNECTION LIMIT = -1;
        
        COMMENT ON DATABASE care_journey IS 'Stores care journey data including appointments, medications, and telemedicine sessions';
    END IF;
END
$$;

-- Create plan_journey database
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'plan_journey') THEN
        CREATE DATABASE plan_journey
        WITH 
        OWNER = postgres
        ENCODING = 'UTF8'
        LC_COLLATE = 'pt_BR.UTF-8'
        LC_CTYPE = 'pt_BR.UTF-8'
        TEMPLATE = template0
        CONNECTION LIMIT = -1;
        
        COMMENT ON DATABASE plan_journey IS 'Stores plan journey data including insurance plans, benefits, and claims';
    END IF;
END
$$;

-- Create gamification database
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'gamification') THEN
        CREATE DATABASE gamification
        WITH 
        OWNER = postgres
        ENCODING = 'UTF8'
        LC_COLLATE = 'pt_BR.UTF-8'
        LC_CTYPE = 'pt_BR.UTF-8'
        TEMPLATE = template0
        CONNECTION LIMIT = -1;
        
        COMMENT ON DATABASE gamification IS 'Stores gamification data including achievements, rewards, quests, and user profiles';
    END IF;
END
$$;

-- Create auth database
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'auth') THEN
        CREATE DATABASE auth
        WITH 
        OWNER = postgres
        ENCODING = 'UTF8'
        LC_COLLATE = 'pt_BR.UTF-8'
        LC_CTYPE = 'pt_BR.UTF-8'
        TEMPLATE = template0
        CONNECTION LIMIT = -1;
        
        COMMENT ON DATABASE auth IS 'Stores authentication and authorization data including users, roles, and permissions';
    END IF;
END
$$;

-- Note: TimescaleDB extension needs to be created within each database separately
-- This is typically done in the migration scripts for the health_journey database

-- Note: The pt_BR.UTF-8 locale must be installed on the PostgreSQL server
-- If the locale is not available, you may need to install it on the host system
-- For Linux systems: sudo locale-gen pt_BR.UTF-8

-- Output confirmation message
\echo 'AUSTA SuperApp databases created successfully'