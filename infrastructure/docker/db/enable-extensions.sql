-- enable-extensions.sql
-- Enables required PostgreSQL extensions for all databases in the AUSTA SuperApp

-- Common extensions for all databases
\c postgres;

-- Create extension if it doesn't exist in template1 so new databases get it automatically
\c template1;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    END IF;
END
$$;

-- Health Journey Database - Requires TimescaleDB for time-series health metrics
\c health_journey;
DO $$
BEGIN
    -- Enable UUID generation for primary keys
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Enable cryptographic functions for secure data handling
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    END IF;
    
    -- Enable TimescaleDB for time-series health metrics data
    -- This is critical for the Health Service to efficiently store and query time-based health data
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        CREATE EXTENSION IF NOT EXISTS "timescaledb";
    END IF;
    
    -- Enable query performance monitoring
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    END IF;
END
$$;

-- Care Journey Database
\c care_journey;
DO $$
BEGIN
    -- Enable UUID generation for primary keys
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Enable cryptographic functions for secure data handling
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    END IF;
    
    -- Enable query performance monitoring
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    END IF;
END
$$;

-- Plan Journey Database
\c plan_journey;
DO $$
BEGIN
    -- Enable UUID generation for primary keys
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Enable cryptographic functions for secure data handling
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    END IF;
    
    -- Enable hstore for storing key-value pairs (useful for flexible plan attributes)
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'hstore') THEN
        CREATE EXTENSION IF NOT EXISTS "hstore";
    END IF;
    
    -- Enable query performance monitoring
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    END IF;
END
$$;

-- Gamification Database
\c gamification;
DO $$
BEGIN
    -- Enable UUID generation for primary keys
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Enable cryptographic functions for secure data handling
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    END IF;
    
    -- Enable query performance monitoring
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    END IF;
END
$$;

-- Auth Database
\c auth;
DO $$
BEGIN
    -- Enable UUID generation for primary keys
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Enable cryptographic functions for secure data handling (essential for auth service)
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    END IF;
    
    -- Enable query performance monitoring
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    END IF;
END
$$;

-- Return to default database
\c postgres;

SELECT current_database(), 'PostgreSQL extensions successfully configured for all AUSTA SuperApp databases' as status;