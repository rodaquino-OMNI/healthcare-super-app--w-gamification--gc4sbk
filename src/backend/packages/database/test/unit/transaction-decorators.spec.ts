/**
 * @file transaction-decorators.spec.ts
 * @description Unit tests for transaction decorators that provide declarative transaction management in service classes.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Transactional, ReadOnly, Serializable } from '../../src/transactions/transaction.decorators';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { TransactionError } from '../../src/transactions/transaction.errors';

// Mock PrismaService
class MockPrismaService {
  // Mock transaction method
  $transaction = jest.fn().mockImplementation(async (callback, options) => {
    // Create a mock transaction client
    const tx = this;
    // Execute the callback with the transaction client
    return await callback(tx);
  });

  // Mock database operations
  user = {
    create: jest.fn().mockImplementation(data => ({ id: 1, ...data.data })),
    findUnique: jest.fn().mockImplementation(query => ({ id: 1, name: 'Test User' })),
    update: jest.fn().mockImplementation((query, data) => ({ id: query.where.id, ...data.data })),
    delete: jest.fn().mockImplementation(query => ({ id: query.where.id, name: 'Deleted User' })),
  };

  profile = {
    create: jest.fn().mockImplementation(data => ({ id: 1, userId: data.data.userId })),
    findUnique: jest.fn().mockImplementation(query => ({ id: 1, userId: query.where.userId })),
    update: jest.fn().mockImplementation((query, data) => ({ id: query.where.id, ...data.data })),
    delete: jest.fn().mockImplementation(query => ({ id: query.where.id })),
  };
}

// Mock TracingService
class MockTracingService {
  private static instance: MockTracingService;

  startSpan = jest.fn().mockReturnValue({
    end: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
  });

  static getInstance(): MockTracingService {
    if (!MockTracingService.instance) {
      MockTracingService.instance = new MockTracingService();
    }
    return MockTracingService.instance;
  }
}

// Mock the @austa/tracing module
jest.mock('@austa/tracing', () => ({
  TracingService: MockTracingService,
}));

// Test service with transactional methods
@Injectable()
class TestService {
  constructor(public readonly prismaService: MockPrismaService) {}

  @Transactional()
  async createUser(name: string): Promise<any> {
    const user = await this.prismaService.user.create({ data: { name } });
    await this.prismaService.profile.create({ data: { userId: user.id } });
    return user;
  }

  @Transactional()
  async createUserWithError(name: string): Promise<any> {
    const user = await this.prismaService.user.create({ data: { name } });
    // Simulate an error
    throw new Error('Test error');
  }

  @Transactional({ isolationLevel: TransactionIsolationLevel.SERIALIZABLE })
  async updateUserWithSerializableIsolation(id: number, name: string): Promise<any> {
    return await this.prismaService.user.update({ where: { id } }, { data: { name } });
  }

  @ReadOnly()
  async getUserById(id: number): Promise<any> {
    return await this.prismaService.user.findUnique({ where: { id } });
  }

  @Serializable()
  async transferFunds(fromId: number, toId: number, amount: number): Promise<void> {
    // This would normally update account balances
    // For testing, we just verify the isolation level
    await this.prismaService.user.update({ where: { id: fromId } }, { data: { balance: { decrement: amount } } });
    await this.prismaService.user.update({ where: { id: toId } }, { data: { balance: { increment: amount } } });
  }

  @Transactional({ collectMetrics: true, createTraceSpan: true, spanName: 'custom-span-name' })
  async createUserWithCustomOptions(name: string): Promise<any> {
    return await this.prismaService.user.create({ data: { name } });
  }
}

describe('Transaction Decorators', () => {
  let service: TestService;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    // Create a fresh instance of MockPrismaService for each test
    prismaService = new MockPrismaService();
    service = new TestService(prismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('@Transactional decorator', () => {
    it('should wrap method execution in a transaction', async () => {
      // Arrange
      const userName = 'Test User';

      // Act
      const result = await service.createUser(userName);

      // Assert
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: { name: userName } });
      expect(prismaService.profile.create).toHaveBeenCalledWith({ data: { userId: result.id } });
      expect(result).toEqual({ id: 1, name: userName });
    });

    it('should automatically roll back the transaction on error', async () => {
      // Arrange
      const userName = 'Test User';

      // Act & Assert
      await expect(service.createUserWithError(userName)).rejects.toThrow('Test error');
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: { name: userName } });
      // The profile.create should not be called due to the error
      expect(prismaService.profile.create).not.toHaveBeenCalled();
    });

    it('should support configurable isolation levels', async () => {
      // Arrange
      const userId = 1;
      const userName = 'Updated User';

      // Act
      await service.updateUserWithSerializableIsolation(userId, userName);

      // Assert
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: 'SERIALIZABLE' }
      );
      expect(prismaService.user.update).toHaveBeenCalledWith(
        { where: { id: userId } },
        { data: { name: userName } }
      );
    });

    it('should use READ COMMITTED isolation level for @ReadOnly decorator', async () => {
      // Arrange
      const userId = 1;

      // Act
      await service.getUserById(userId);

      // Assert
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: 'READ COMMITTED' }
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should use SERIALIZABLE isolation level for @Serializable decorator', async () => {
      // Arrange
      const fromId = 1;
      const toId = 2;
      const amount = 100;

      // Act
      await service.transferFunds(fromId, toId, amount);

      // Assert
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: 'SERIALIZABLE' }
      );
      expect(prismaService.user.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tracing integration', () => {
    it('should create a trace span for the transaction', async () => {
      // Arrange
      const userName = 'Test User';
      const tracingService = MockTracingService.getInstance();

      // Act
      await service.createUserWithCustomOptions(userName);

      // Assert
      expect(tracingService.startSpan).toHaveBeenCalledWith('transaction.custom-span-name', {
        attributes: expect.objectContaining({
          'transaction.isolation_level': TransactionIsolationLevel.READ_COMMITTED,
        }),
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: { name: userName } });
    });

    it('should record exceptions in the trace span', async () => {
      // Arrange
      const userName = 'Test User';
      const tracingService = MockTracingService.getInstance();
      const mockSpan = {
        end: jest.fn(),
        recordException: jest.fn(),
        setStatus: jest.fn(),
      };
      tracingService.startSpan.mockReturnValue(mockSpan);

      // Act & Assert
      await expect(service.createUserWithError(userName)).rejects.toThrow('Test error');
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 'ERROR' });
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe('Metrics collection', () => {
    // Since we can't easily test the internal metrics collector directly,
    // we'll verify that the code paths for metrics collection are executed

    it('should collect metrics for successful transactions', async () => {
      // Arrange
      const userName = 'Test User';
      // We'll spy on console.debug which is used by the metrics collector
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();

      // Act
      await service.createUserWithCustomOptions(userName);

      // Assert
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: { name: userName } });
      // The metrics collector should log the transaction duration
      // We can't directly test the metrics collector, but we can verify the code path is executed
      expect(debugSpy).toHaveBeenCalled();

      // Clean up
      debugSpy.mockRestore();
    });

    it('should collect metrics for failed transactions', async () => {
      // Arrange
      const userName = 'Test User';
      // We'll spy on console.warn which is used by the metrics collector for errors
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act & Assert
      await expect(service.createUserWithError(userName)).rejects.toThrow('Test error');
      expect(prismaService.$transaction).toHaveBeenCalled();
      // The metrics collector should log the transaction error
      // We can't directly test the metrics collector, but we can verify the code path is executed
      expect(warnSpy).toHaveBeenCalled();

      // Clean up
      warnSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should throw an error if prismaService is not available', async () => {
      // Arrange
      const serviceWithoutPrisma = new TestService(null as any);

      // Act & Assert
      await expect(serviceWithoutPrisma.createUser('Test User')).rejects.toThrow(
        "@Transactional decorator requires the class to have a 'prismaService' property"
      );
    });

    it('should wrap non-TransactionError errors in a TransactionError', async () => {
      // Arrange
      const userName = 'Test User';
      // Mock the transaction to throw a non-TransactionError
      prismaService.$transaction.mockImplementationOnce(async () => {
        throw new Error('Database error');
      });

      // Act & Assert
      await expect(service.createUser(userName)).rejects.toThrow(TransactionError);
    });
  });
});