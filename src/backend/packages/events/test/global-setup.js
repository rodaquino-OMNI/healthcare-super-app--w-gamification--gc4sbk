/**
 * Global setup script for event tests.
 * 
 * This script prepares the testing environment before any tests run.
 * It sets up Kafka topics, initializes test databases, and configures
 * any other resources needed for event-related testing.
 *
 * @module global-setup
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Import KafkaJS directly to avoid potential circular dependencies
let kafkajs;
try {
  kafkajs = require('kafkajs');
} catch (error) {
  console.warn('KafkaJS not available, some setup operations may be skipped:', error.message);
  kafkajs = { Kafka: class MockKafka {} };
}

// Path to store test resources state
const TEST_RESOURCES_PATH = path.join(__dirname, '.test-resources.json');

/**
 * Initializes Kafka topics needed for testing
 * @param {Object} kafkaConfig Kafka configuration
 * @returns {Promise<Array<string>>} Array of created topic names
 */
async function initializeKafkaTopics(kafkaConfig = {}) {
  // If KafkaJS is not available, we can't initialize topics
  if (!kafkajs || !kafkajs.Kafka) {
    console.warn('KafkaJS not available, skipping topic initialization');
    return [];
  }
  
  console.log('Initializing Kafka topics for testing...');
  
  try {
    // Create an admin client to manage topics
    const kafka = new kafkajs.Kafka({
      clientId: 'test-setup-admin',
      brokers: kafkaConfig.brokers || ['localhost:9092'],
      ssl: kafkaConfig.ssl,
      sasl: kafkaConfig.sasl,
      connectionTimeout: 10000, // 10 seconds timeout for connection
      retry: {
        initialRetryTime: 100,
        retries: 3
      }
    });
    
    const admin = kafka.admin();
    await admin.connect();
    
    // Define test topics to create
    const topicPrefix = kafkaConfig.topicPrefix || 'test-';
    const dlqTopicPrefix = kafkaConfig.dlqTopicPrefix || 'dlq-';
    
    const baseTopics = [
      'health.events',
      'care.events',
      'plan.events',
      'gamification.events',
      'notification.events',
    ];
    
    // Create topics with unique names for this test run
    const uniqueSuffix = Date.now().toString();
    const testTopics = baseTopics.map(topic => `${topicPrefix}${topic}-${uniqueSuffix}`);
    const dlqTopics = baseTopics.map(topic => `${dlqTopicPrefix}${topicPrefix}${topic}-${uniqueSuffix}`);
    
    // Combine regular and DLQ topics
    const allTopics = [...testTopics, ...dlqTopics];
    
    // Create all topics
    await admin.createTopics({
      topics: allTopics.map(topic => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      })),
      timeout: 10000, // 10 seconds timeout
    });
    
    console.log(`Created ${allTopics.length} Kafka topics for testing`);
    
    // Store the created topics in the test resources file
    const resources = getTestResources();
    resources.testTopics = allTopics;
    resources.kafkaConfig = kafkaConfig;
    saveTestResources(resources);
    
    // Store the topic mapping for tests to use
    const topicMapping = {};
    baseTopics.forEach((baseTopic, index) => {
      topicMapping[baseTopic] = testTopics[index];
      topicMapping[`${dlqTopicPrefix}${baseTopic}`] = dlqTopics[index];
    });
    
    // Save the topic mapping to a file for tests to use
    const topicMappingPath = path.join(__dirname, '.topic-mapping.json');
    fs.writeFileSync(topicMappingPath, JSON.stringify(topicMapping, null, 2));
    
    await admin.disconnect();
    
    return allTopics;
  } catch (error) {
    console.error('Failed to initialize Kafka topics:', error.message);
    // Try to disconnect admin client even if topic creation failed
    try {
      const kafka = new kafkajs.Kafka({
        clientId: 'test-setup-admin-cleanup',
        brokers: kafkaConfig.brokers || ['localhost:9092'],
      });
      const admin = kafka.admin();
      await admin.disconnect().catch(() => {});
    } catch (e) {
      // Ignore errors during cleanup
    }
    
    return [];
  }
}

/**
 * Initializes test database for event tests
 * @param {Object} dbConfig Database configuration
 * @returns {Promise<boolean>} True if database was initialized successfully
 */
async function initializeTestDatabase(dbConfig = {}) {
  if (!dbConfig || !dbConfig.url) {
    console.log('No database configuration provided, skipping database initialization');
    return false;
  }
  
  console.log('Initializing test database...');
  
  try {
    // Check if we have the necessary tools to manage the database
    try {
      execSync('which psql', { stdio: 'ignore' });
    } catch (error) {
      console.warn('PostgreSQL client not available, skipping database initialization');
      return false;
    }
    
    // Parse the database URL to get connection details
    const dbUrl = new URL(dbConfig.url);
    const dbName = dbUrl.pathname.substring(1);
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port || '5432';
    
    // Set environment variables for psql commands
    const env = {
      ...process.env,
      PGPASSWORD: dbPassword,
      PGUSER: dbUser,
      PGHOST: dbHost,
      PGPORT: dbPort,
    };
    
    // Check if the database exists
    try {
      execSync(`psql -lqt | cut -d \| -f 1 | grep -qw ${dbName}`, { env });
      console.log(`Database ${dbName} already exists, dropping and recreating...`);
      
      // Drop connections to the database
      execSync(`psql -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbName}' AND pid <> pg_backend_pid();"`, { env });
      
      // Drop the database
      execSync(`dropdb ${dbName}`, { env });
    } catch (error) {
      // Database doesn't exist, which is fine
      console.log(`Database ${dbName} doesn't exist, creating...`);
    }
    
    // Create the database
    execSync(`createdb ${dbName}`, { env });
    
    // Create the schema if specified
    if (dbConfig.schema) {
      execSync(`psql -d ${dbName} -c "CREATE SCHEMA IF NOT EXISTS ${dbConfig.schema};"`, { env });
      console.log(`Created schema ${dbConfig.schema} in database ${dbName}`);
    }
    
    console.log(`Successfully initialized test database ${dbName}`);
    return true;
  } catch (error) {
    console.error('Failed to initialize test database:', error.message);
    return false;
  }
}

/**
 * Reads the test resources state file if it exists
 * @returns {Object} The test resources state or an empty object if file doesn't exist
 */
function getTestResources() {
  try {
    if (fs.existsSync(TEST_RESOURCES_PATH)) {
      return JSON.parse(fs.readFileSync(TEST_RESOURCES_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading test resources file:', error);
  }
  return { kafkaClients: [], testTopics: [], dockerContainers: [] };
}

/**
 * Saves the test resources state to a file
 * @param {Object} resources The test resources state
 */
function saveTestResources(resources) {
  try {
    fs.writeFileSync(TEST_RESOURCES_PATH, JSON.stringify(resources, null, 2));
  } catch (error) {
    console.error('Error saving test resources file:', error);
  }
}

/**
 * Ensures Kafka is available for testing
 * @param {Object} kafkaConfig Kafka configuration
 * @returns {Promise<boolean>} True if Kafka is available
 */
async function ensureKafkaAvailable(kafkaConfig = {}) {
  // If KafkaJS is not available, we can't check Kafka availability
  if (!kafkajs || !kafkajs.Kafka) {
    console.warn('KafkaJS not available, skipping Kafka availability check');
    return false;
  }
  
  console.log('Checking Kafka availability...');
  
  try {
    // Create a Kafka client to check connection
    const kafka = new kafkajs.Kafka({
      clientId: 'test-setup-checker',
      brokers: kafkaConfig.brokers || ['localhost:9092'],
      ssl: kafkaConfig.ssl,
      sasl: kafkaConfig.sasl,
      connectionTimeout: 5000, // 5 seconds timeout for connection
    });
    
    const admin = kafka.admin();
    await admin.connect();
    
    // Try to list topics to verify connection
    await admin.listTopics();
    
    await admin.disconnect();
    console.log('Kafka is available');
    return true;
  } catch (error) {
    console.error('Kafka is not available:', error.message);
    
    // If we're in CI environment, fail the tests
    if (process.env.CI === 'true') {
      throw new Error('Kafka is required for tests in CI environment');
    }
    
    return false;
  }
}

/**
 * Main setup function that orchestrates the initialization process
 * @returns {Promise<void>}
 */
async function setup() {
  console.log('Starting global setup for event tests...');
  const startTime = Date.now();
  
  try {
    // Get Jest configuration from environment
    const jestConfig = JSON.parse(process.env.JEST_CONFIG || '{}');
    const globals = jestConfig.globals || {};
    
    // Check Kafka availability
    const kafkaAvailable = await ensureKafkaAvailable(globals.kafkaConfig);
    
    if (kafkaAvailable) {
      // Initialize Kafka topics
      await initializeKafkaTopics(globals.kafkaConfig);
    }
    
    // Initialize test database
    await initializeTestDatabase(globals.testDatabase);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Global setup completed in ${duration}s`);
  } catch (error) {
    console.error('Error during global setup:', error);
    // Rethrow to fail the tests if setup fails
    throw error;
  }
}

module.exports = setup;