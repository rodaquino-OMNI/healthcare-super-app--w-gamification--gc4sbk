/**
 * Test fixtures for journey-specific environment variables
 * 
 * This module provides test fixtures for testing the journey-specific environment
 * variable utilities in src/env/journey.ts. It includes test cases for Health, Care,
 * and Plan journeys, as well as shared variables and feature flags.
 */

import { JourneyType } from '../../../src/env/journey';

/**
 * Basic environment variable test cases for each journey
 */
export const basicJourneyEnvCases = {
  // Health journey test cases
  health: {
    // Environment variables to set for testing
    envVars: {
      'AUSTA_HEALTH_API_URL': 'https://health-api.austa.com.br',
      'AUSTA_HEALTH_API_VERSION': 'v1',
      'AUSTA_HEALTH_MAX_METRICS': '100',
      'AUSTA_HEALTH_METRICS_ENABLED': 'true',
      'AUSTA_HEALTH_INSIGHTS_ENABLED': 'true',
      'AUSTA_HEALTH_WEARABLES_SYNC_INTERVAL': '15',
    },
    // Expected values when retrieving these variables
    expected: {
      'API_URL': 'https://health-api.austa.com.br',
      'API_VERSION': 'v1',
      'MAX_METRICS': '100',
      'METRICS_ENABLED': 'true',
      'INSIGHTS_ENABLED': 'true',
      'WEARABLES_SYNC_INTERVAL': '15',
    },
    // Expected boolean values
    booleans: {
      'METRICS_ENABLED': true,
      'INSIGHTS_ENABLED': true,
      'DEBUG_MODE': false, // Not set, should default to false
    },
    // Expected numeric values
    numbers: {
      'MAX_METRICS': 100,
      'WEARABLES_SYNC_INTERVAL': 15,
      'MAX_GOALS': 0, // Not set, should default to 0
    }
  },
  
  // Care journey test cases
  care: {
    // Environment variables to set for testing
    envVars: {
      'AUSTA_CARE_API_URL': 'https://care-api.austa.com.br',
      'AUSTA_CARE_API_VERSION': 'v2',
      'AUSTA_CARE_MAX_APPOINTMENTS': '5',
      'AUSTA_CARE_TELEMEDICINE_ENABLED': 'true',
      'AUSTA_CARE_PROVIDER_SEARCH_RADIUS': '50',
      'AUSTA_CARE_APPOINTMENT_REMINDER_HOURS': '24',
    },
    // Expected values when retrieving these variables
    expected: {
      'API_URL': 'https://care-api.austa.com.br',
      'API_VERSION': 'v2',
      'MAX_APPOINTMENTS': '5',
      'TELEMEDICINE_ENABLED': 'true',
      'PROVIDER_SEARCH_RADIUS': '50',
      'APPOINTMENT_REMINDER_HOURS': '24',
    },
    // Expected boolean values
    booleans: {
      'TELEMEDICINE_ENABLED': true,
      'SYMPTOM_CHECKER_ENABLED': false, // Not set, should default to false
    },
    // Expected numeric values
    numbers: {
      'MAX_APPOINTMENTS': 5,
      'PROVIDER_SEARCH_RADIUS': 50,
      'APPOINTMENT_REMINDER_HOURS': 24,
    }
  },
  
  // Plan journey test cases
  plan: {
    // Environment variables to set for testing
    envVars: {
      'AUSTA_PLAN_API_URL': 'https://plan-api.austa.com.br',
      'AUSTA_PLAN_API_VERSION': 'v1',
      'AUSTA_PLAN_MAX_CLAIMS': '20',
      'AUSTA_PLAN_CLAIM_AUTO_PROCESSING': 'true',
      'AUSTA_PLAN_DOCUMENT_EXPIRY_DAYS': '90',
      'AUSTA_PLAN_BENEFIT_CATEGORIES': '["medical","dental","vision","pharmacy"]',
    },
    // Expected values when retrieving these variables
    expected: {
      'API_URL': 'https://plan-api.austa.com.br',
      'API_VERSION': 'v1',
      'MAX_CLAIMS': '20',
      'CLAIM_AUTO_PROCESSING': 'true',
      'DOCUMENT_EXPIRY_DAYS': '90',
      'BENEFIT_CATEGORIES': '["medical","dental","vision","pharmacy"]',
    },
    // Expected boolean values
    booleans: {
      'CLAIM_AUTO_PROCESSING': true,
      'DIGITAL_ID_CARD': false, // Not set, should default to false
    },
    // Expected numeric values
    numbers: {
      'MAX_CLAIMS': 20,
      'DOCUMENT_EXPIRY_DAYS': 90,
    },
    // Expected JSON values
    json: {
      'BENEFIT_CATEGORIES': ['medical', 'dental', 'vision', 'pharmacy'],
    }
  }
};

/**
 * Shared environment variable test cases
 */
export const sharedEnvCases = {
  // Environment variables to set for testing
  envVars: {
    // Shared variables (no journey prefix)
    'AUSTA_API_BASE_URL': 'https://api.austa.com.br',
    'AUSTA_LOG_LEVEL': 'info',
    'AUSTA_ENABLE_METRICS': 'true',
    'AUSTA_CACHE_TTL': '300',
    'AUSTA_DEFAULT_LANGUAGE': 'pt-BR',
    'AUSTA_ALLOWED_ORIGINS': '["https://app.austa.com.br","https://admin.austa.com.br"]',
    
    // Journey-specific overrides
    'AUSTA_HEALTH_LOG_LEVEL': 'debug',
    'AUSTA_CARE_CACHE_TTL': '60',
    'AUSTA_PLAN_ENABLE_METRICS': 'false',
  },
  
  // Expected values when retrieving shared variables
  expected: {
    // For health journey
    health: {
      'API_BASE_URL': 'https://api.austa.com.br',
      'LOG_LEVEL': 'debug', // Overridden
      'ENABLE_METRICS': 'true',
      'CACHE_TTL': '300',
      'DEFAULT_LANGUAGE': 'pt-BR',
    },
    
    // For care journey
    care: {
      'API_BASE_URL': 'https://api.austa.com.br',
      'LOG_LEVEL': 'info',
      'ENABLE_METRICS': 'true',
      'CACHE_TTL': '60', // Overridden
      'DEFAULT_LANGUAGE': 'pt-BR',
    },
    
    // For plan journey
    plan: {
      'API_BASE_URL': 'https://api.austa.com.br',
      'LOG_LEVEL': 'info',
      'ENABLE_METRICS': 'false', // Overridden
      'CACHE_TTL': '300',
      'DEFAULT_LANGUAGE': 'pt-BR',
    },
    
    // For shared context
    shared: {
      'API_BASE_URL': 'https://api.austa.com.br',
      'LOG_LEVEL': 'info',
      'ENABLE_METRICS': 'true',
      'CACHE_TTL': '300',
      'DEFAULT_LANGUAGE': 'pt-BR',
      'ALLOWED_ORIGINS': '["https://app.austa.com.br","https://admin.austa.com.br"]',
    }
  },
  
  // Expected JSON values
  json: {
    'ALLOWED_ORIGINS': ['https://app.austa.com.br', 'https://admin.austa.com.br'],
  }
};

/**
 * Feature flag test cases
 */
export const featureFlagCases = {
  // Environment variables to set for testing
  envVars: {
    // Global feature flags
    'AUSTA_FEATURE_GAMIFICATION': 'true',
    'AUSTA_FEATURE_DARK_MODE': 'true',
    
    // Journey-specific feature flags
    'AUSTA_HEALTH_FEATURE_WEARABLE_SYNC': 'true',
    'AUSTA_HEALTH_FEATURE_HEALTH_INSIGHTS': 'true',
    'AUSTA_HEALTH_FEATURE_GAMIFICATION': 'false', // Override global flag
    
    'AUSTA_CARE_FEATURE_TELEMEDICINE': 'true',
    'AUSTA_CARE_FEATURE_SYMPTOM_CHECKER': 'true',
    
    'AUSTA_PLAN_FEATURE_CLAIM_AUTO_PROCESSING': 'true',
    'AUSTA_PLAN_FEATURE_DIGITAL_ID_CARD': 'true',
    'AUSTA_PLAN_FEATURE_DARK_MODE': 'false', // Override global flag
  },
  
  // Expected feature flag values
  expected: {
    // For health journey
    health: {
      'GAMIFICATION': false, // Overridden
      'DARK_MODE': true, // From global
      'WEARABLE_SYNC': true,
      'HEALTH_INSIGHTS': true,
      'TELEMEDICINE': false, // Not set for this journey
    },
    
    // For care journey
    care: {
      'GAMIFICATION': true, // From global
      'DARK_MODE': true, // From global
      'TELEMEDICINE': true,
      'SYMPTOM_CHECKER': true,
      'WEARABLE_SYNC': false, // Not set for this journey
    },
    
    // For plan journey
    plan: {
      'GAMIFICATION': true, // From global
      'DARK_MODE': false, // Overridden
      'CLAIM_AUTO_PROCESSING': true,
      'DIGITAL_ID_CARD': true,
      'TELEMEDICINE': false, // Not set for this journey
    }
  }
};

/**
 * Service endpoint and connection string test cases
 */
export const serviceEndpointCases = {
  // Environment variables to set for testing
  envVars: {
    // Database connection strings
    'AUSTA_DATABASE_URL': 'postgresql://postgres:password@db:5432/austa',
    'AUSTA_HEALTH_DATABASE_URL': 'postgresql://postgres:password@db:5432/austa_health',
    'AUSTA_CARE_DATABASE_URL': 'postgresql://postgres:password@db:5432/austa_care',
    'AUSTA_PLAN_DATABASE_URL': 'postgresql://postgres:password@db:5432/austa_plan',
    
    // Redis connection strings
    'AUSTA_REDIS_URL': 'redis://redis:6379/0',
    'AUSTA_HEALTH_REDIS_URL': 'redis://redis:6379/1',
    'AUSTA_CARE_REDIS_URL': 'redis://redis:6379/2',
    'AUSTA_PLAN_REDIS_URL': 'redis://redis:6379/3',
    
    // API endpoints
    'AUSTA_API_URL': 'https://api.austa.com.br',
    'AUSTA_HEALTH_API_URL': 'https://health-api.austa.com.br',
    'AUSTA_CARE_API_URL': 'https://care-api.austa.com.br',
    'AUSTA_PLAN_API_URL': 'https://plan-api.austa.com.br',
    
    // Kafka topics
    'AUSTA_KAFKA_BROKERS': 'kafka:9092',
    'AUSTA_HEALTH_KAFKA_TOPIC': 'austa.health.events',
    'AUSTA_CARE_KAFKA_TOPIC': 'austa.care.events',
    'AUSTA_PLAN_KAFKA_TOPIC': 'austa.plan.events',
  },
  
  // Expected values when retrieving these variables
  expected: {
    // For health journey
    health: {
      'DATABASE_URL': 'postgresql://postgres:password@db:5432/austa_health',
      'REDIS_URL': 'redis://redis:6379/1',
      'API_URL': 'https://health-api.austa.com.br',
      'KAFKA_BROKERS': 'kafka:9092', // From shared
      'KAFKA_TOPIC': 'austa.health.events',
    },
    
    // For care journey
    care: {
      'DATABASE_URL': 'postgresql://postgres:password@db:5432/austa_care',
      'REDIS_URL': 'redis://redis:6379/2',
      'API_URL': 'https://care-api.austa.com.br',
      'KAFKA_BROKERS': 'kafka:9092', // From shared
      'KAFKA_TOPIC': 'austa.care.events',
    },
    
    // For plan journey
    plan: {
      'DATABASE_URL': 'postgresql://postgres:password@db:5432/austa_plan',
      'REDIS_URL': 'redis://redis:6379/3',
      'API_URL': 'https://plan-api.austa.com.br',
      'KAFKA_BROKERS': 'kafka:9092', // From shared
      'KAFKA_TOPIC': 'austa.plan.events',
    },
    
    // For shared context
    shared: {
      'DATABASE_URL': 'postgresql://postgres:password@db:5432/austa',
      'REDIS_URL': 'redis://redis:6379/0',
      'API_URL': 'https://api.austa.com.br',
      'KAFKA_BROKERS': 'kafka:9092',
    }
  }
};

/**
 * Cross-journey inheritance test cases
 */
export const crossJourneyInheritanceCases = {
  // Environment variables to set for testing
  envVars: {
    // Shared variables
    'AUSTA_LOG_LEVEL': 'info',
    'AUSTA_TIMEOUT_MS': '5000',
    'AUSTA_MAX_RETRIES': '3',
    'AUSTA_CACHE_TTL': '300',
    
    // Some journeys override shared variables
    'AUSTA_HEALTH_LOG_LEVEL': 'debug',
    'AUSTA_CARE_TIMEOUT_MS': '10000',
    'AUSTA_PLAN_MAX_RETRIES': '5',
    
    // Some variables only exist for specific journeys
    'AUSTA_HEALTH_METRICS_RETENTION_DAYS': '730',
    'AUSTA_CARE_PROVIDER_SEARCH_RADIUS': '50',
    'AUSTA_PLAN_DOCUMENT_EXPIRY_DAYS': '90',
  },
  
  // Test cases for getJourneyEnv with shared=true
  sharedInheritance: {
    // Variable name, journey, expected value
    cases: [
      // Variables that exist for the specific journey
      { name: 'LOG_LEVEL', journey: JourneyType.HEALTH, expected: 'debug' },
      { name: 'TIMEOUT_MS', journey: JourneyType.CARE, expected: '10000' },
      { name: 'MAX_RETRIES', journey: JourneyType.PLAN, expected: '5' },
      
      // Variables that fall back to shared
      { name: 'TIMEOUT_MS', journey: JourneyType.HEALTH, expected: '5000' },
      { name: 'LOG_LEVEL', journey: JourneyType.CARE, expected: 'info' },
      { name: 'CACHE_TTL', journey: JourneyType.PLAN, expected: '300' },
      
      // Journey-specific variables (no fallback)
      { name: 'METRICS_RETENTION_DAYS', journey: JourneyType.HEALTH, expected: '730' },
      { name: 'PROVIDER_SEARCH_RADIUS', journey: JourneyType.CARE, expected: '50' },
      { name: 'DOCUMENT_EXPIRY_DAYS', journey: JourneyType.PLAN, expected: '90' },
      
      // Variables that don't exist anywhere
      { name: 'NONEXISTENT_VAR', journey: JourneyType.HEALTH, expected: '' },
      { name: 'ANOTHER_NONEXISTENT', journey: JourneyType.CARE, expected: 'default-value', defaultValue: 'default-value' },
    ]
  },
  
  // Test cases for getAllJourneyEnvs
  allEnvsInheritance: {
    // Expected results for getAllJourneyEnvs with includeShared=true
    withShared: {
      // For health journey
      [JourneyType.HEALTH]: {
        'LOG_LEVEL': 'debug', // Overridden
        'TIMEOUT_MS': '5000', // From shared
        'MAX_RETRIES': '3', // From shared
        'CACHE_TTL': '300', // From shared
        'METRICS_RETENTION_DAYS': '730', // Journey-specific
      },
      
      // For care journey
      [JourneyType.CARE]: {
        'LOG_LEVEL': 'info', // From shared
        'TIMEOUT_MS': '10000', // Overridden
        'MAX_RETRIES': '3', // From shared
        'CACHE_TTL': '300', // From shared
        'PROVIDER_SEARCH_RADIUS': '50', // Journey-specific
      },
      
      // For plan journey
      [JourneyType.PLAN]: {
        'LOG_LEVEL': 'info', // From shared
        'TIMEOUT_MS': '5000', // From shared
        'MAX_RETRIES': '5', // Overridden
        'CACHE_TTL': '300', // From shared
        'DOCUMENT_EXPIRY_DAYS': '90', // Journey-specific
      }
    },
    
    // Expected results for getAllJourneyEnvs with includeShared=false
    withoutShared: {
      // For health journey
      [JourneyType.HEALTH]: {
        'LOG_LEVEL': 'debug', // Overridden
        'METRICS_RETENTION_DAYS': '730', // Journey-specific
      },
      
      // For care journey
      [JourneyType.CARE]: {
        'TIMEOUT_MS': '10000', // Overridden
        'PROVIDER_SEARCH_RADIUS': '50', // Journey-specific
      },
      
      // For plan journey
      [JourneyType.PLAN]: {
        'MAX_RETRIES': '5', // Overridden
        'DOCUMENT_EXPIRY_DAYS': '90', // Journey-specific
      }
    }
  }
};

/**
 * Required environment variable test cases
 */
export const requiredEnvCases = {
  // Environment variables to set for testing
  envVars: {
    // Set some required variables
    'AUSTA_HEALTH_DATABASE_URL': 'postgresql://postgres:password@db:5432/austa_health',
    'AUSTA_CARE_API_KEY': 'care-api-key-12345',
    'AUSTA_PLAN_S3_BUCKET': 'austa-plan-documents',
    
    // Shared variables that might be required
    'AUSTA_JWT_SECRET': 'super-secret-jwt-key',
    'AUSTA_API_URL': 'https://api.austa.com.br',
  },
  
  // Test cases for required variables
  cases: [
    // Variables that exist and are required
    { name: 'DATABASE_URL', journey: JourneyType.HEALTH, required: true, shouldThrow: false },
    { name: 'API_KEY', journey: JourneyType.CARE, required: true, shouldThrow: false },
    { name: 'S3_BUCKET', journey: JourneyType.PLAN, required: true, shouldThrow: false },
    { name: 'JWT_SECRET', journey: JourneyType.HEALTH, required: true, shared: true, shouldThrow: false },
    
    // Variables that don't exist but are required
    { name: 'API_KEY', journey: JourneyType.HEALTH, required: true, shouldThrow: true },
    { name: 'DATABASE_URL', journey: JourneyType.CARE, required: true, shouldThrow: true },
    { name: 'JWT_SECRET_KEY', journey: JourneyType.PLAN, required: true, shared: true, shouldThrow: true },
    
    // Variables that don't exist but have default values
    { name: 'LOG_LEVEL', journey: JourneyType.HEALTH, required: true, defaultValue: 'info', shouldThrow: false },
    { name: 'TIMEOUT_MS', journey: JourneyType.CARE, required: true, defaultValue: '5000', shouldThrow: false },
    { name: 'MAX_RETRIES', journey: JourneyType.PLAN, required: true, defaultValue: '3', shouldThrow: false },
  ]
};