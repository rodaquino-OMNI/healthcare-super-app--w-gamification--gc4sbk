# Auth Package Test Mocks

This directory contains mock implementations of various dependencies used by the auth package. These mocks are designed to facilitate testing without requiring actual external dependencies like databases, Redis, or external OAuth providers.

## Redis Mock

The `redis.mock.ts` file provides a mock implementation of the Redis client used for token blacklisting and storage in the auth package. This mock simulates Redis operations like `get`, `set`, and `del` with an in-memory store, avoiding the need for an actual Redis instance during testing.

### Features

- In-memory key-value storage with TTL support
- Simulation of Redis commands: get, set, setex, del, exists, ttl, ping, quit
- Support for pub/sub functionality
- Configurable error simulation for testing error scenarios
- Test helper methods for controlling cache behavior

### Usage

```typescript
import { createRedisMock } from '../mocks/redis.mock';

// Create a Redis mock instance
const redisMock = createRedisMock();

// Basic operations
await redisMock.set('key', 'value');
const value = await redisMock.get('key'); // 'value'

// Set with expiration
await redisMock.set('key', 'value', 'EX', 60); // Expires in 60 seconds
// or
await redisMock.setex('key', 60, 'value'); // Expires in 60 seconds

// Check TTL
const ttl = await redisMock.ttl('key'); // Remaining time in seconds

// Delete a key
await redisMock.del('key');

// Check if a key exists
const exists = await redisMock.exists('key'); // 1 if exists, 0 if not

// Simulate errors
const errorMock = createRedisMock({
  commandErrors: {
    get: true, // Simulate error on get operations
    set: false // No error on set operations
  },
  errorMessage: 'Custom error message'
});

// Test helper methods
redisMock.forceExpire('key'); // Manually expire a key
redisMock.forceSetExpiry('key', 10); // Set TTL to 10 seconds
redisMock.getAllKeys(); // Get all keys in the store
redisMock.flushAll(); // Clear all keys
redisMock.simulateConnectionError(); // Simulate connection error
redisMock.simulateReconnection(); // Simulate reconnection
```

### Pub/Sub Support

The Redis mock also supports pub/sub functionality for testing token invalidation and real-time events:

```typescript
// Subscribe to a channel
await redisMock.subscribe('channel');

// Listen for messages
redisMock.on('message', (channel, message) => {
  console.log(`Received message from ${channel}: ${message}`);
});

// Publish a message
await redisMock.publish('channel', 'Hello world');

// Unsubscribe from a channel
await redisMock.unsubscribe('channel');
```

### Integration with JwtRedisProvider

The Redis mock is designed to work seamlessly with the `JwtRedisProvider` for testing token blacklisting:

```typescript
import { Test } from '@nestjs/testing';
import { JwtRedisProvider } from '../../src/providers/jwt/jwt-redis.provider';
import { createRedisMock } from '../mocks/redis.mock';

describe('JwtRedisProvider', () => {
  let provider: JwtRedisProvider<any>;
  let redisMock: any;

  beforeEach(async () => {
    redisMock = createRedisMock();
    
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtRedisProvider,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisMock
        },
        // Other required providers...
      ],
    }).compile();

    provider = moduleRef.get<JwtRedisProvider<any>>(JwtRedisProvider);
  });

  it('should blacklist a token', async () => {
    const token = 'valid.jwt.token';
    await provider.revokeToken(token);
    
    // Verify token is blacklisted
    const isValid = await provider.validateToken(token);
    expect(isValid).toBeNull();
  });
});
```

## Other Mocks

This directory also contains other mock implementations for testing the auth package:

- `auth.service.mock.ts` - Mock implementation of the AuthService
- `config.mock.ts` - Mock implementation of the ConfigService
- `database-auth-provider.mock.ts` - Mock implementation of the DatabaseAuthProvider
- `jwt-provider.mock.ts` - Mock implementation of the JwtProvider
- `logger.mock.ts` - Mock implementation of the LoggerService
- `oauth-provider.mock.ts` - Base mock for OAuth providers
- `prisma.mock.ts` - Mock implementation of the PrismaService
- `token.service.mock.ts` - Mock implementation of the TokenService

All mocks are exported from the `index.ts` file for easy importing in tests.