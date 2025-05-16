import { RedisMock, createRedisMock } from '../mocks/redis.mock';

describe('RedisMock', () => {
  let redisMock: RedisMock;

  beforeEach(() => {
    redisMock = createRedisMock();
  });

  afterEach(async () => {
    await redisMock.quit();
  });

  describe('Basic operations', () => {
    it('should set and get a value', async () => {
      await redisMock.set('test-key', 'test-value');
      const value = await redisMock.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent keys', async () => {
      const value = await redisMock.get('non-existent-key');
      expect(value).toBeNull();
    });

    it('should delete a key', async () => {
      await redisMock.set('test-key', 'test-value');
      await redisMock.del('test-key');
      const value = await redisMock.get('test-key');
      expect(value).toBeNull();
    });

    it('should check if a key exists', async () => {
      await redisMock.set('test-key', 'test-value');
      const exists = await redisMock.exists('test-key');
      expect(exists).toBe(1);

      const notExists = await redisMock.exists('non-existent-key');
      expect(notExists).toBe(0);
    });
  });

  describe('Expiration', () => {
    it('should set a key with expiration using EX parameter', async () => {
      await redisMock.set('test-key', 'test-value', 'EX', 1);
      let value = await redisMock.get('test-key');
      expect(value).toBe('test-value');

      // Force expiration check
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      value = await redisMock.get('test-key');
      expect(value).toBeNull();
    });

    it('should set a key with expiration using setex', async () => {
      await redisMock.setex('test-key', 1, 'test-value');
      let value = await redisMock.get('test-key');
      expect(value).toBe('test-value');

      // Force expiration check
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      value = await redisMock.get('test-key');
      expect(value).toBeNull();
    });

    it('should get the TTL of a key', async () => {
      await redisMock.setex('test-key', 10, 'test-value');
      const ttl = await redisMock.ttl('test-key');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);

      const nonExistentTtl = await redisMock.ttl('non-existent-key');
      expect(nonExistentTtl).toBe(-2);

      await redisMock.set('no-ttl-key', 'value');
      const noTtlKeyTtl = await redisMock.ttl('no-ttl-key');
      expect(noTtlKeyTtl).toBe(-1);
    });

    it('should manually expire a key using forceExpire', async () => {
      await redisMock.set('test-key', 'test-value');
      const expired = redisMock.forceExpire('test-key');
      expect(expired).toBe(true);

      const value = await redisMock.get('test-key');
      expect(value).toBeNull();
    });

    it('should manually set expiry using forceSetExpiry', async () => {
      await redisMock.set('test-key', 'test-value');
      const set = redisMock.forceSetExpiry('test-key', 1);
      expect(set).toBe(true);

      const ttl = await redisMock.ttl('test-key');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(1);
    });
  });

  describe('Error simulation', () => {
    it('should simulate connection error', async () => {
      const errorMock = createRedisMock({ connectionError: true });
      
      await new Promise<void>(resolve => {
        errorMock.on('error', (err) => {
          expect(err.message).toContain('Redis connection error');
          resolve();
        });
      });
    });

    it('should simulate command errors', async () => {
      const errorMock = createRedisMock({
        commandErrors: {
          get: true,
          set: true
        },
        errorMessage: 'Command failed'
      });

      await expect(errorMock.get('test-key')).rejects.toThrow('Command failed');
      await expect(errorMock.set('test-key', 'value')).rejects.toThrow('Command failed');
    });

    it('should simulate disconnection and reconnection', async () => {
      redisMock.simulateConnectionError('Disconnected');
      
      await expect(redisMock.get('test-key')).rejects.toThrow('Redis connection closed');
      
      const reconnectPromise = new Promise<void>(resolve => {
        redisMock.on('connect', () => {
          resolve();
        });
      });
      
      redisMock.simulateReconnection();
      await reconnectPromise;
      
      // Should work after reconnection
      await redisMock.set('test-key', 'test-value');
      const value = await redisMock.get('test-key');
      expect(value).toBe('test-value');
    });
  });

  describe('Pub/Sub functionality', () => {
    it('should publish and receive messages', async () => {
      const messagePromise = new Promise<{ channel: string, message: string }>(resolve => {
        redisMock.on('message', (channel, message) => {
          resolve({ channel, message });
        });
      });

      await redisMock.subscribe('test-channel');
      await redisMock.publish('test-channel', 'test-message');
      
      const result = await messagePromise;
      expect(result.channel).toBe('test-channel');
      expect(result.message).toBe('test-message');
    });

    it('should handle unsubscribe', async () => {
      await redisMock.subscribe('test-channel');
      const count = await redisMock.unsubscribe('test-channel');
      expect(count).toBe(0);

      // Publishing to an unsubscribed channel should not trigger message event
      let messageReceived = false;
      redisMock.on('message', () => {
        messageReceived = true;
      });

      await redisMock.publish('test-channel', 'test-message');
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(messageReceived).toBe(false);
    });
  });

  describe('Utility methods', () => {
    it('should get all keys', async () => {
      await redisMock.set('key1', 'value1');
      await redisMock.set('key2', 'value2');
      await redisMock.set('key3', 'value3');
      
      const keys = redisMock.getAllKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should flush all keys', async () => {
      await redisMock.set('key1', 'value1');
      await redisMock.set('key2', 'value2');
      
      redisMock.flushAll();
      
      const keys = redisMock.getAllKeys();
      expect(keys).toHaveLength(0);
    });

    it('should update error options', async () => {
      // Initially no errors
      await redisMock.set('test-key', 'test-value');
      
      // Update to simulate errors
      redisMock.setErrorOptions({
        commandErrors: {
          get: true
        }
      });
      
      await expect(redisMock.get('test-key')).rejects.toThrow();
      
      // Update to disable errors
      redisMock.setErrorOptions({});
      
      // Should work now
      const value = await redisMock.get('test-key');
      expect(value).toBe('test-value');
    });
  });
});