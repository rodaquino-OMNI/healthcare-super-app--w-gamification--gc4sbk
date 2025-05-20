-- Create users and databases for AUSTA SuperApp services
-- This script follows the principle of least privilege, giving each service
-- only the permissions it needs to function properly

-- Connect to PostgreSQL as superuser
\connect postgres

-- Create databases for each service if they don't exist
CREATE DATABASE IF NOT EXISTS health_journey;
CREATE DATABASE IF NOT EXISTS care_journey;
CREATE DATABASE IF NOT EXISTS plan_journey;
CREATE DATABASE IF NOT EXISTS gamification;
CREATE DATABASE IF NOT EXISTS auth_service;

-- Create users for each service with secure passwords for local development
-- In production, these would be replaced with more secure passwords or other authentication methods
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'health_journey_user') THEN
    CREATE USER health_journey_user WITH PASSWORD 'health_secure_password';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'care_journey_user') THEN
    CREATE USER care_journey_user WITH PASSWORD 'care_secure_password';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'plan_journey_user') THEN
    CREATE USER plan_journey_user WITH PASSWORD 'plan_secure_password';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gamification_user') THEN
    CREATE USER gamification_user WITH PASSWORD 'gamification_secure_password';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'auth_service_user') THEN
    CREATE USER auth_service_user WITH PASSWORD 'auth_secure_password';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'readonly_user') THEN
    CREATE USER readonly_user WITH PASSWORD 'readonly_secure_password';
  END IF;
END
$$;

-- Grant appropriate permissions to each user

-- Health Journey Service
\connect health_journey
GRANT CONNECT ON DATABASE health_journey TO health_journey_user;
GRANT USAGE ON SCHEMA public TO health_journey_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO health_journey_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO health_journey_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO health_journey_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO health_journey_user;

-- Care Journey Service
\connect care_journey
GRANT CONNECT ON DATABASE care_journey TO care_journey_user;
GRANT USAGE ON SCHEMA public TO care_journey_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO care_journey_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO care_journey_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO care_journey_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO care_journey_user;

-- Plan Journey Service
\connect plan_journey
GRANT CONNECT ON DATABASE plan_journey TO plan_journey_user;
GRANT USAGE ON SCHEMA public TO plan_journey_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO plan_journey_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO plan_journey_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO plan_journey_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO plan_journey_user;

-- Gamification Engine
\connect gamification
GRANT CONNECT ON DATABASE gamification TO gamification_user;
GRANT USAGE ON SCHEMA public TO gamification_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gamification_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gamification_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gamification_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO gamification_user;

-- Auth Service
\connect auth_service
GRANT CONNECT ON DATABASE auth_service TO auth_service_user;
GRANT USAGE ON SCHEMA public TO auth_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO auth_service_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO auth_service_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO auth_service_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO auth_service_user;

-- Read-only access for reporting and monitoring
\connect postgres
GRANT CONNECT ON DATABASE health_journey TO readonly_user;
GRANT CONNECT ON DATABASE care_journey TO readonly_user;
GRANT CONNECT ON DATABASE plan_journey TO readonly_user;
GRANT CONNECT ON DATABASE gamification TO readonly_user;
GRANT CONNECT ON DATABASE auth_service TO readonly_user;

\connect health_journey
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

\connect care_journey
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

\connect plan_journey
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

\connect gamification
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

\connect auth_service
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Create extensions for TimescaleDB in health_journey database for time-series health metrics data
\connect health_journey
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create additional extensions that might be needed
\connect health_journey
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect care_journey
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect plan_journey
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect gamification
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\connect auth_service
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up connection pooling parameters for better performance
-- These settings help optimize database connections across services
\connect health_journey
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '1GB';

-- Output confirmation message
\echo 'Database users and permissions have been created successfully.'
\echo 'Each service has its own dedicated user with appropriate permissions.'
\echo 'A read-only user has been created for reporting and monitoring purposes.'
\echo 'TimescaleDB extension has been enabled for health_journey database.'
\echo 'UUID extension has been enabled for all databases.'
\echo 'Connection pooling parameters have been optimized.'