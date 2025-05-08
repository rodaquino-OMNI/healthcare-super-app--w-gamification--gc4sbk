import { registerAs } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

/**
 * Redis Configuration Module for the Gamification Engine
 * 
 * This module provides a comprehensive Redis configuration for the Gamification Engine,
 * extracted from the main configuration to improve modularity and maintainability.
 * 
 * Key features:
 * - Enhanced connection resilience with automatic reconnect strategies
 * - Exponential backoff with jitter for retry attempts
 * - Optimized Sorted Sets configuration for leaderboards
 * - Granular cache invalidation policies for different data types
 * - Comprehensive TTL management for various cached entities
 * - Support for Redis Cluster configuration
 * - Pub/Sub configuration for real-time updates
 * 
 * Usage:
 * 1. Import this module in your app.module.ts:
 *    ```
 *    import { redisConfig } from '@app/common/config/redis.config';
 *    ```
 * 
 * 2. Add it to the ConfigModule.forRoot() configuration:
 *    ```
 *    ConfigModule.forRoot({
 *      load: [redisConfig],
 *      // other config options
 *    })
 *    ```
 * 
 * 3. Inject the configuration where needed:
 *    ```
 *    constructor(
 *      @Inject(redisConfig.KEY)
 *      private readonly redisConfiguration: ConfigType<typeof redisConfig>,
 *    ) {}
 *    ```
 * 
 * @module RedisConfig
 */
export const redisConfig = registerAs('redis', () => {
  // Create the configuration object
  const config = {
  // Connection settings with enhanced resilience
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    family: parseInt(process.env.REDIS_FAMILY, 10) || 4, // 4 (IPv4) or 6 (IPv6)
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    username: process.env.REDIS_USERNAME || undefined, // For Redis 6+ ACL support
    
    // Enhanced connection resilience with exponential backoff
    retryStrategy: (times: number): number | null => {
      // Maximum retry attempts
      const maxRetryAttempts = parseInt(process.env.REDIS_MAX_RETRY_ATTEMPTS, 10) || 10;
      if (times > maxRetryAttempts) {
        console.error(`[Redis] Maximum retry attempts (${maxRetryAttempts}) reached. Giving up.`);
        return null; // Stop retrying
      }
      
      // Log retry attempt
      console.warn(`[Redis] Connection attempt failed. Retrying (${times}/${maxRetryAttempts})...`);
      
      // Exponential backoff with jitter for retry delay
      const delay = Math.min(
        1000 * Math.pow(2, times), // Exponential backoff
        parseInt(process.env.REDIS_MAX_RETRY_DELAY, 10) || 30000 // Max 30 seconds
      );
      
      // Add jitter to prevent thundering herd problem
      const jitter = Math.random() * 100;
      return delay + jitter;
    },
    
    // Reconnect on error if appropriate
    reconnectOnError: (err: Error): boolean | 1 | 2 => {
      // Log the error
      console.error(`[Redis] Connection error: ${err.message}`);
      
      // Handle specific error conditions
      if (err.message.includes('READONLY')) {
        // Redis is in read-only mode (possibly a replica)
        console.warn('[Redis] Server in READONLY mode, reconnecting...');
        return 1; // Reconnect using the same connection
      }
      
      if (err.message.includes('LOADING')) {
        // Redis is loading the dataset into memory
        console.warn('[Redis] Server is loading dataset, reconnecting...');
        return 2; // Reconnect with a new connection
      }
      
      if (err.message.includes('MASTERDOWN')) {
        // Redis sentinel reports master is down
        console.warn('[Redis] Master is down, reconnecting...');
        return 2; // Reconnect with a new connection
      }
      
      // Don't reconnect for other errors
      return false;
    },
    
    // Connection events handling
    enableReadyCheck: true,
    enableOfflineQueue: true,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10) || 3,
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 10000, // 10 seconds
    disconnectTimeout: parseInt(process.env.REDIS_DISCONNECT_TIMEOUT, 10) || 2000, // 2 seconds
    keepAlive: parseInt(process.env.REDIS_KEEPALIVE, 10) || 5000, // 5 seconds
    noDelay: true, // Disable Nagle's algorithm for lower latency
    autoResubscribe: true, // Auto resubscribe to channels after reconnection
    autoResendUnfulfilledCommands: true, // Resend unfulfilled commands after reconnection
    lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true', // Connect only when needed
    readOnly: process.env.REDIS_READ_ONLY === 'true', // Read-only mode for replicas
  } as RedisOptions,
  
  // Key prefixes for different data types
  keyPrefix: {
    base: process.env.REDIS_KEY_PREFIX || 'game:',
    achievements: 'achievements:',
    userProfile: 'user:',
    leaderboard: 'leaderboard:',
    rules: 'rules:',
    events: 'events:',
    quests: 'quests:',
    rewards: 'rewards:',
    notifications: 'notifications:',
  },
  
  // TTL values (in seconds) for different data types
  ttl: {
    achievements: parseInt(process.env.ACHIEVEMENTS_TTL, 10) || 3600, // 1 hour
    userProfile: parseInt(process.env.USER_PROFILE_TTL, 10) || 300, // 5 minutes
    leaderboard: parseInt(process.env.LEADERBOARD_TTL, 10) || 900, // 15 minutes
    rules: parseInt(process.env.RULES_TTL, 10) || 600, // 10 minutes
    events: parseInt(process.env.EVENTS_TTL, 10) || 86400, // 24 hours
    quests: parseInt(process.env.QUESTS_TTL, 10) || 1800, // 30 minutes
    rewards: parseInt(process.env.REWARDS_TTL, 10) || 7200, // 2 hours
    notifications: parseInt(process.env.NOTIFICATIONS_TTL, 10) || 86400, // 24 hours
  },
  
  // Enhanced cache invalidation policies with granular control
  invalidation: {
    // Strategies: 'all', 'pattern', 'individual', 'selective', 'tiered'
    strategy: process.env.REDIS_INVALIDATION_STRATEGY || 'tiered',
    // Batch size for pattern invalidation
    batchSize: parseInt(process.env.REDIS_INVALIDATION_BATCH_SIZE, 10) || 100,
    // Patterns for different data types - using function to ensure proper interpolation
    getPatterns: (keyPrefix) => ({
      achievements: `${keyPrefix.base}${keyPrefix.achievements}*`,
      userProfile: `${keyPrefix.base}${keyPrefix.userProfile}*`,
      leaderboard: `${keyPrefix.base}${keyPrefix.leaderboard}*`,
      rules: `${keyPrefix.base}${keyPrefix.rules}*`,
      events: `${keyPrefix.base}${keyPrefix.events}*`,
      quests: `${keyPrefix.base}${keyPrefix.quests}*`,
      rewards: `${keyPrefix.base}${keyPrefix.rewards}*`,
      notifications: `${keyPrefix.base}${keyPrefix.notifications}*`,
    }),
    // More specific patterns for granular invalidation - using function to ensure proper interpolation
    getSpecificPatterns: (keyPrefix) => ({
      // User-specific patterns
      userAchievements: `${keyPrefix.base}${keyPrefix.achievements}user:*`,
      userLeaderboard: `${keyPrefix.base}${keyPrefix.leaderboard}user:*`,
      userQuests: `${keyPrefix.base}${keyPrefix.quests}user:*`,
      userRewards: `${keyPrefix.base}${keyPrefix.rewards}user:*`,
      // Journey-specific patterns
      healthJourney: `${keyPrefix.base}${keyPrefix.achievements}journey:health:*`,
      careJourney: `${keyPrefix.base}${keyPrefix.achievements}journey:care:*`,
      planJourney: `${keyPrefix.base}${keyPrefix.achievements}journey:plan:*`,
      // Time-based patterns
      dailyEvents: `${keyPrefix.base}${keyPrefix.events}daily:*`,
      weeklyEvents: `${keyPrefix.base}${keyPrefix.events}weekly:*`,
      monthlyEvents: `${keyPrefix.base}${keyPrefix.events}monthly:*`,
    }),
    // For backward compatibility, initialize with empty patterns
    // These will be populated at runtime using the getter functions
    patterns: {},
    specificPatterns: {},
    
    // Tiered invalidation configuration
    tiered: {
      // High-frequency invalidation (short TTL, frequent updates)
      highFrequency: {
        patternKeys: ['userProfile', 'events', 'leaderboard'],
        interval: parseInt(process.env.REDIS_HIGH_FREQ_INVALIDATION_INTERVAL, 10) || 300000, // 5 minutes
      },
      // Medium-frequency invalidation
      mediumFrequency: {
        patternKeys: ['quests', 'rewards', 'notifications'],
        interval: parseInt(process.env.REDIS_MED_FREQ_INVALIDATION_INTERVAL, 10) || 1800000, // 30 minutes
      },
      // Low-frequency invalidation (long TTL, infrequent updates)
      lowFrequency: {
        patternKeys: ['achievements', 'rules'],
        interval: parseInt(process.env.REDIS_LOW_FREQ_INVALIDATION_INTERVAL, 10) || 3600000, // 1 hour
      },
      // Helper function to get actual patterns from keys at runtime
      getPatterns: (tier, patterns) => {
        const config = tier === 'high' ? this.tiered.highFrequency :
                      tier === 'medium' ? this.tiered.mediumFrequency :
                      this.tiered.lowFrequency;
        
        return config.patternKeys.map(key => patterns[key]);
      },
    },
    // Selective invalidation triggers (using pattern keys)
    triggers: {
      // Event-based triggers
      onAchievementEarned: {
        patternKeys: ['userAchievements', 'userProfile', 'leaderboard'],
        description: 'Triggered when a user earns an achievement',
      },
      onQuestCompleted: {
        patternKeys: ['userQuests', 'userProfile', 'leaderboard'],
        description: 'Triggered when a user completes a quest',
      },
      onRewardClaimed: {
        patternKeys: ['userRewards', 'userProfile'],
        description: 'Triggered when a user claims a reward',
      },
      onRuleChanged: {
        patternKeys: ['rules'],
        description: 'Triggered when a gamification rule is changed',
      },
      onUserLevelUp: {
        patternKeys: ['userProfile', 'leaderboard'],
        description: 'Triggered when a user levels up',
      },
      // Journey-specific triggers
      onHealthMetricRecorded: {
        patternKeys: ['healthJourney', 'userProfile', 'dailyEvents'],
        description: 'Triggered when a health metric is recorded',
      },
      onAppointmentBooked: {
        patternKeys: ['careJourney', 'userProfile', 'dailyEvents'],
        description: 'Triggered when an appointment is booked',
      },
      onClaimSubmitted: {
        patternKeys: ['planJourney', 'userProfile', 'dailyEvents'],
        description: 'Triggered when an insurance claim is submitted',
      },
      // Helper function to get actual patterns from keys at runtime
      getPatterns: (triggerName, patterns, specificPatterns) => {
        const trigger = this.triggers[triggerName];
        if (!trigger) return [];
        
        return trigger.patternKeys.map(key => {
          return patterns[key] || specificPatterns[key] || key;
        });
      },
    },
    // Performance optimization
    performance: {
      // Use SCAN instead of KEYS for pattern matching
      useScan: true,
      // Use pipelining for batch operations
      usePipelining: true,
      // Maximum keys to process in a single operation
      maxKeysPerOperation: parseInt(process.env.REDIS_MAX_KEYS_PER_OPERATION, 10) || 1000,
      // Use LUA scripts for atomic operations
      useLuaScripts: process.env.REDIS_USE_LUA_SCRIPTS !== 'false', // Enabled by default
    },
  },
  
  // Sorted Sets configuration for leaderboards with enhanced resilience
  sortedSets: {
    // Maximum number of entries in leaderboards
    maxEntries: parseInt(process.env.LEADERBOARD_MAX_ENTRIES, 10) || 100,
    // Update interval for leaderboards (in milliseconds)
    updateInterval: parseInt(process.env.LEADERBOARD_UPDATE_INTERVAL, 10) || 900000, // 15 minutes
    // Batch size for bulk operations
    batchSize: parseInt(process.env.LEADERBOARD_BATCH_SIZE, 10) || 50,
    // Leaderboard types
    types: {
      global: 'global',
      weekly: 'weekly',
      monthly: 'monthly',
      daily: 'daily',
      journey: {
        health: 'journey:health',
        care: 'journey:care',
        plan: 'journey:plan',
      },
      achievement: 'achievement',
      quest: 'quest',
      challenge: 'challenge',
    },
    // Leaderboard expiration (in seconds)
    expiration: {
      global: 86400 * 30, // 30 days
      weekly: 86400 * 7, // 7 days
      monthly: 86400 * 30, // 30 days
      daily: 86400, // 1 day
      journey: 86400 * 14, // 14 days
      achievement: 86400 * 60, // 60 days
      quest: 86400 * 30, // 30 days
      challenge: 86400 * 14, // 14 days
    },
    // Score aggregation methods
    aggregation: {
      default: 'sum', // sum, max, min, avg
      weekly: 'sum',
      monthly: 'sum',
      daily: 'sum',
      journey: 'sum',
      achievement: 'max',
      quest: 'sum',
      challenge: 'max',
    },
    // Performance optimization
    performance: {
      // Use ZUNIONSTORE for combining leaderboards
      useUnionStore: true,
      // Use pipelining for batch operations
      usePipelining: true,
      // Cache leaderboard results in memory (with TTL)
      cacheResults: process.env.LEADERBOARD_CACHE_RESULTS !== 'false', // Enabled by default
      // TTL for in-memory cache (in milliseconds)
      cacheResultsTtl: parseInt(process.env.LEADERBOARD_CACHE_RESULTS_TTL, 10) || 60000, // 1 minute
      // Use LUA scripts for atomic operations
      useLuaScripts: process.env.LEADERBOARD_USE_LUA_SCRIPTS !== 'false', // Enabled by default
    },
    // Resilience configuration
    resilience: {
      // Backup frequency (in milliseconds)
      backupInterval: parseInt(process.env.LEADERBOARD_BACKUP_INTERVAL, 10) || 3600000, // 1 hour
      // Automatic recovery on failure
      autoRecover: process.env.LEADERBOARD_AUTO_RECOVER !== 'false', // Enabled by default
      // Maximum number of recovery attempts
      maxRecoveryAttempts: parseInt(process.env.LEADERBOARD_MAX_RECOVERY_ATTEMPTS, 10) || 3,
      // Delay between recovery attempts (in milliseconds)
      recoveryDelay: parseInt(process.env.LEADERBOARD_RECOVERY_DELAY, 10) || 5000, // 5 seconds
      // Persistence strategy: 'rdb', 'aof', 'hybrid', 'none'
      persistenceStrategy: process.env.LEADERBOARD_PERSISTENCE_STRATEGY || 'hybrid',
      // Snapshot frequency (in operations)
      snapshotFrequency: parseInt(process.env.LEADERBOARD_SNAPSHOT_FREQUENCY, 10) || 1000,
      // Database backup before major operations
      backupBeforeOperation: process.env.LEADERBOARD_BACKUP_BEFORE_OPERATION !== 'false', // Enabled by default
      // Fallback to database on Redis failure
      databaseFallback: process.env.LEADERBOARD_DATABASE_FALLBACK !== 'false', // Enabled by default
    },
    // Consistency configuration
    consistency: {
      // Verify leaderboard integrity periodically
      verifyIntegrity: process.env.LEADERBOARD_VERIFY_INTEGRITY !== 'false', // Enabled by default
      // Verification interval (in milliseconds)
      verifyInterval: parseInt(process.env.LEADERBOARD_VERIFY_INTERVAL, 10) || 86400000, // 24 hours
      // Auto-repair inconsistencies
      autoRepair: process.env.LEADERBOARD_AUTO_REPAIR !== 'false', // Enabled by default
      // Consistency model: 'eventual', 'strong'
      model: process.env.LEADERBOARD_CONSISTENCY_MODEL || 'eventual',
      // Lock timeout for operations (in milliseconds)
      lockTimeout: parseInt(process.env.LEADERBOARD_LOCK_TIMEOUT, 10) || 5000, // 5 seconds
    },
  },
  
  // Pub/Sub configuration for real-time updates
  pubSub: {
    enabled: process.env.REDIS_PUBSUB_ENABLED !== 'false', // Enabled by default
    channels: {
      achievements: 'achievements',
      leaderboard: 'leaderboard',
      userProfile: 'user-profile',
      quests: 'quests',
      rewards: 'rewards',
    },
    // Maximum number of subscribers per channel
    maxSubscribers: parseInt(process.env.REDIS_PUBSUB_MAX_SUBSCRIBERS, 10) || 1000,
  },
  
  // Cluster configuration (if using Redis Cluster)
  cluster: {
    enabled: process.env.REDIS_CLUSTER_ENABLED === 'true', // Disabled by default
    nodes: process.env.REDIS_CLUSTER_NODES
      ? process.env.REDIS_CLUSTER_NODES.split(',')
          .map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port, 10) };
          })
      : [{ host: 'localhost', port: 6379 }],
    options: {
      redisOptions: {
        password: process.env.REDIS_PASSWORD || '',
      },
      // Cluster-specific retry strategy
      clusterRetryStrategy: (times: number): number | null => {
        const maxRetryAttempts = parseInt(process.env.REDIS_CLUSTER_MAX_RETRY_ATTEMPTS, 10) || 5;
        if (times > maxRetryAttempts) {
          return null; // Stop retrying
        }
        return Math.min(100 + Math.random() * 100, 2000); // Random delay between 100-2000ms
      },
    },
  },
  
  // Monitoring and observability configuration
  monitoring: {
    enabled: process.env.REDIS_MONITORING_ENABLED !== 'false', // Enabled by default
    // Metrics collection interval (in milliseconds)
    metricsInterval: parseInt(process.env.REDIS_METRICS_INTERVAL, 10) || 60000, // 1 minute
    // Metrics to collect
    metrics: {
      // Memory usage metrics
      memory: process.env.REDIS_MONITOR_MEMORY !== 'false', // Enabled by default
      // Command statistics
      commands: process.env.REDIS_MONITOR_COMMANDS !== 'false', // Enabled by default
      // Connection metrics
      connections: process.env.REDIS_MONITOR_CONNECTIONS !== 'false', // Enabled by default
      // Key space metrics
      keyspace: process.env.REDIS_MONITOR_KEYSPACE !== 'false', // Enabled by default
      // Latency metrics
      latency: process.env.REDIS_MONITOR_LATENCY !== 'false', // Enabled by default
    },
    // Alerting thresholds
    alertThresholds: {
      // Memory usage threshold (percentage)
      memoryUsage: parseInt(process.env.REDIS_MEMORY_THRESHOLD, 10) || 80,
      // Connection count threshold
      connectionCount: parseInt(process.env.REDIS_CONNECTION_THRESHOLD, 10) || 1000,
      // Command latency threshold (milliseconds)
      commandLatency: parseInt(process.env.REDIS_LATENCY_THRESHOLD, 10) || 100,
      // Error rate threshold (percentage)
      errorRate: parseInt(process.env.REDIS_ERROR_THRESHOLD, 10) || 5,
    },
    // Health check configuration
    healthCheck: {
      enabled: process.env.REDIS_HEALTH_CHECK_ENABLED !== 'false', // Enabled by default
      // Health check interval (in milliseconds)
      interval: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL, 10) || 30000, // 30 seconds
      // Timeout for health check (in milliseconds)
      timeout: parseInt(process.env.REDIS_HEALTH_CHECK_TIMEOUT, 10) || 5000, // 5 seconds
      // Number of consecutive failures before marking unhealthy
      failureThreshold: parseInt(process.env.REDIS_HEALTH_CHECK_FAILURE_THRESHOLD, 10) || 3,
      // Number of consecutive successes before marking healthy
      successThreshold: parseInt(process.env.REDIS_HEALTH_CHECK_SUCCESS_THRESHOLD, 10) || 1,
    },
    // Tracing configuration
    tracing: {
      enabled: process.env.REDIS_TRACING_ENABLED !== 'false', // Enabled by default
      // Sample rate for tracing (0-1)
      sampleRate: parseFloat(process.env.REDIS_TRACING_SAMPLE_RATE) || 0.1, // 10% of commands
      // Minimum duration to trace (milliseconds)
      minDuration: parseInt(process.env.REDIS_TRACING_MIN_DURATION, 10) || 50,
    },
  },
  };
  
  // Initialize patterns with proper interpolation
  config.invalidation.patterns = config.invalidation.getPatterns(config.keyPrefix);
  config.invalidation.specificPatterns = config.invalidation.getSpecificPatterns(config.keyPrefix);
  
  // Helper method to initialize Redis with this configuration
  config.createRedisClient = () => {
    const Redis = require('ioredis');
    let client;
    
    // Create cluster client if enabled, otherwise create standard client
    if (config.cluster.enabled) {
      client = new Redis.Cluster(config.cluster.nodes, config.cluster.options);
    } else {
      client = new Redis(config.connection);
    }
    
    // Set up event handlers
    client.on('connect', () => console.log('[Redis] Connected'));
    client.on('ready', () => console.log('[Redis] Ready'));
    client.on('error', (err) => console.error(`[Redis] Error: ${err.message}`));
    client.on('close', () => console.warn('[Redis] Connection closed'));
    client.on('reconnecting', (time) => console.warn(`[Redis] Reconnecting in ${time}ms...`));
    
    return client;
  };
  
  return config;
});