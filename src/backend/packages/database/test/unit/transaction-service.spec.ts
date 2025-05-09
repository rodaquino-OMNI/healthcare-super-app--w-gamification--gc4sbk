import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../src/prisma.service';
import { TransactionService } from '../../src/transactions/transaction.service';
import {
  TransactionIsolationLevel,
  TransactionState,
  TransactionType,
  TransactionOptions,
} from '../../src/types/transaction.types';
import {
  TransactionError,
  TransactionTimeoutError,
  DeadlockError,
  DistributedTransactionError,
  SavepointError,
  TransactionAbortedError
} from '../../src/transactions/transaction.errors';

// Mock implementation of Prisma.TransactionClient
class MockPrismaTransactionClient {
  _clientId: string;
  _state: 'active' | 'committed' | 'rolledBack' = 'active';
  _savepoints: Set<string> = new Set();

  constructor() {
    this._clientId = uuidv4();
  }

  async $executeRaw(query: string, ...values: any[]): Promise<any> {
    return { count: 1 };
  }

  async $executeRawUnsafe(query: string, values?: Record<string, any>): Promise<any> {
    // Handle savepoint operations
    if (query.startsWith('SAVEPOINT ')) {
      const savepointName = query.replace('SAVEPOINT ', '');
      this._savepoints.add(savepointName);
      return { count: 1 };
    }
    
    // Handle rollback to savepoint operations
    if (query.startsWith('ROLLBACK TO SAVEPOINT ')) {
      const savepointName = query.replace('ROLLBACK TO SAVEPOINT ', '');
      if (!this._savepoints.has(savepointName)) {
        throw new Error(`Savepoint ${savepointName} does not exist`);
      }
      return { count: 1 };
    }
    
    return { count: 1 };
  }

  async $commit(): Promise<void> {
    if (this._state !== 'active') {
      throw new Error(`Cannot commit transaction in state ${this._state}`);
    }
    this._state = 'committed';
  }

  async $rollback(): Promise<void> {
    if (this._state !== 'active') {
      throw new Error(`Cannot rollback transaction in state ${this._state}`);
    }
    this._state = 'rolledBack';
  }
}

// Mock implementation of a distributed transaction participant
class MockDistributedTransactionParticipant {
  participantId: string;
  prepareResult: boolean = true;
  commitResult: boolean = true;
  prepareError: Error | null = null;
  commitError: Error | null = null;
  rollbackError: Error | null = null;
  prepareCount: number = 0;
  commitCount: number = 0;
  rollbackCount: number = 0;

  constructor(id: string) {
    this.participantId = id;
  }

  async prepare(): Promise<boolean> {
    this.prepareCount++;
    if (this.prepareError) {
      throw this.prepareError;
    }
    return this.prepareResult;
  }

  async commit(): Promise<boolean> {
    this.commitCount++;
    if (this.commitError) {
      throw this.commitError;
    }
    return this.commitResult;
  }

  async rollback(): Promise<void> {
    this.rollbackCount++;
    if (this.rollbackError) {
      throw this.rollbackError;
    }
  }
}

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;
  let mockTransactionClient: MockPrismaTransactionClient;

  beforeEach(async () => {
    // Create mock transaction client
    mockTransactionClient = new MockPrismaTransactionClient();

    // Create mock PrismaService
    const mockPrismaService = {
      $transaction: jest.fn().mockImplementation((options, config) => {
        return Promise.resolve(mockTransactionClient);
      }),
    } as unknown as PrismaService;

    // Create mock EventEmitter
    const mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
    } as unknown as EventEmitter2;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Call onModuleInit to initialize the service
    await service.onModuleInit();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Call onModuleDestroy to clean up resources
    await service.onModuleDestroy();
  });

  describe('createTransaction', () => {
    it('should create a transaction with default options', async () => {
      const transaction = await service.createTransaction();
      
      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.state).toBe(TransactionState.CREATED);
      expect(transaction.metadata.isolationLevel).toBe(TransactionIsolationLevel.READ_COMMITTED);
      expect(transaction.metadata.type).toBe(TransactionType.STANDARD);
      expect(transaction.metadata.journeyContext).toBe('default');
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.created', expect.any(Object));
    });

    it('should create a transaction with custom options', async () => {
      const options: Partial<TransactionOptions> = {
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        journeyContext: 'health',
        timeout: {
          timeoutMs: 10000,
          autoRollbackOnTimeout: true,
        },
      };

      const transaction = await service.createTransaction(options);
      
      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.state).toBe(TransactionState.CREATED);
      expect(transaction.metadata.isolationLevel).toBe(TransactionIsolationLevel.SERIALIZABLE);
      expect(transaction.metadata.journeyContext).toBe('health');
      expect(transaction.options.timeout.timeoutMs).toBe(10000);
      expect(transaction.options.timeout.autoRollbackOnTimeout).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.created', expect.any(Object));
    });

    it('should store the transaction in active transactions', async () => {
      const transaction = await service.createTransaction();
      const retrievedTransaction = await service.getTransaction(transaction.id);
      
      expect(retrievedTransaction).toBe(transaction);
    });

    it('should store the transaction in journey transactions', async () => {
      const journeyContext = 'care';
      const transaction = await service.createTransaction({ journeyContext });
      const journeyTransactions = await service.getJourneyTransactions(journeyContext);
      
      expect(journeyTransactions).toContainEqual(transaction);
    });
  });

  describe('transaction lifecycle', () => {
    it('should start a transaction successfully', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      expect(transaction.state).toBe(TransactionState.ACTIVE);
      expect(transaction.metadata.startedAt).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        { isolationLevel: 'ReadCommitted' },
        expect.any(Object)
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.started', expect.any(Object));
    });

    it('should commit a transaction successfully', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      await transaction.commit();
      
      expect(transaction.state).toBe(TransactionState.COMMITTED);
      expect(transaction.metadata.completedAt).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.committed', expect.any(Object));
    });

    it('should rollback a transaction successfully', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      await transaction.rollback();
      
      expect(transaction.state).toBe(TransactionState.ROLLED_BACK);
      expect(transaction.metadata.completedAt).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.rolledBack', expect.any(Object));
    });

    it('should execute a callback within a transaction', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      const result = await transaction.execute(client => Promise.resolve('test result'));
      
      expect(result).toBe('test result');
    });

    it('should throw an error when starting an already started transaction', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      await expect(transaction.start()).rejects.toThrow(TransactionError);
    });

    it('should throw an error when committing a non-active transaction', async () => {
      const transaction = await service.createTransaction();
      
      await expect(transaction.commit()).rejects.toThrow(TransactionError);
    });

    it('should throw an error when rolling back a non-active transaction', async () => {
      const transaction = await service.createTransaction();
      
      await expect(transaction.rollback()).rejects.toThrow(TransactionError);
    });

    it('should throw an error when executing in a non-active transaction', async () => {
      const transaction = await service.createTransaction();
      
      await expect(transaction.execute(() => Promise.resolve('test'))).rejects.toThrow(TransactionError);
    });
  });

  describe('executeTransaction', () => {
    it('should execute a callback within a transaction and commit automatically', async () => {
      const callback = jest.fn().mockResolvedValue('test result');
      const result = await service.executeTransaction(callback);
      
      expect(result).toBe('test result');
      expect(callback).toHaveBeenCalled();
    });

    it('should rollback the transaction if the callback throws an error', async () => {
      const error = new Error('Test error');
      const callback = jest.fn().mockRejectedValue(error);
      
      await expect(service.executeTransaction(callback)).rejects.toThrow(error);
    });

    it('should execute a transaction with custom options', async () => {
      const callback = jest.fn().mockResolvedValue('test result');
      const options: Partial<TransactionOptions> = {
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        journeyContext: 'health',
      };
      
      const result = await service.executeTransaction(callback, options);
      
      expect(result).toBe('test result');
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        { isolationLevel: 'Serializable' },
        expect.any(Object)
      );
    });
  });

  describe('executeTransactionWithRetry', () => {
    it('should retry a transaction on transient errors', async () => {
      // Mock implementation to fail once then succeed
      const callback = jest.fn()
        .mockRejectedValueOnce(new TransactionAbortedError('Aborted', 'Deadlock'))
        .mockResolvedValueOnce('test result');
      
      const result = await service.executeTransactionWithRetry(callback, {
        maxRetries: 3,
        baseDelayMs: 10,
        maxDelayMs: 100,
      });
      
      expect(result).toBe('test result');
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after maxRetries attempts', async () => {
      const error = new DeadlockError('Deadlock detected');
      const callback = jest.fn().mockRejectedValue(error);
      
      await expect(service.executeTransactionWithRetry(callback, {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 100,
      })).rejects.toThrow(DeadlockError);
      
      expect(callback).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
    });

    it('should not retry on non-retryable errors', async () => {
      const error = new Error('Non-retryable error');
      const callback = jest.fn().mockRejectedValue(error);
      
      await expect(service.executeTransactionWithRetry(callback)).rejects.toThrow(error);
      
      expect(callback).toHaveBeenCalledTimes(1); // Only the initial attempt
    });
  });

  describe('savepoint management', () => {
    it('should create a savepoint within a transaction', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      const savepointName = await transaction.createSavepoint('test_savepoint');
      
      expect(savepointName).toBe('test_savepoint');
      expect(mockTransactionClient._savepoints.has('test_savepoint')).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.savepoint.created', expect.any(Object));
    });

    it('should generate a savepoint name if not provided', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      const savepointName = await transaction.createSavepoint();
      
      expect(savepointName).toBeDefined();
      expect(savepointName.startsWith('SP_')).toBe(true);
      expect(mockTransactionClient._savepoints.has(savepointName)).toBe(true);
    });

    it('should rollback to a savepoint', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      const savepointName = await transaction.createSavepoint('test_savepoint');
      await transaction.rollbackToSavepoint(savepointName);
      
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.savepoint.rolledBack', expect.any(Object));
    });

    it('should throw an error when creating a savepoint in a non-active transaction', async () => {
      const transaction = await service.createTransaction();
      
      await expect(transaction.createSavepoint()).rejects.toThrow(TransactionError);
    });

    it('should throw an error when rolling back to a non-existent savepoint', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      await expect(transaction.rollbackToSavepoint('non_existent')).rejects.toThrow(SavepointError);
    });

    it('should throw an error when rolling back to a savepoint in a non-active transaction', async () => {
      const transaction = await service.createTransaction();
      
      await expect(transaction.rollbackToSavepoint('test')).rejects.toThrow(TransactionError);
    });

    it('should throw an error when savepoints are disabled', async () => {
      const transaction = await service.createTransaction({
        savepoint: {
          useSavepoints: false,
        },
      });
      await transaction.start();
      
      await expect(transaction.createSavepoint()).rejects.toThrow(SavepointError);
    });
  });

  describe('nested transactions', () => {
    it('should create a nested transaction', async () => {
      const parentTransaction = await service.createTransaction();
      await parentTransaction.start();
      
      const nestedTransaction = await parentTransaction.createNestedTransaction();
      
      expect(nestedTransaction).toBeDefined();
      expect(nestedTransaction.metadata.type).toBe(TransactionType.NESTED);
      expect(nestedTransaction.metadata.parentId).toBe(parentTransaction.id);
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.nested.created', expect.any(Object));
    });

    it('should create a savepoint for a nested transaction when savepoints are enabled', async () => {
      const parentTransaction = await service.createTransaction();
      await parentTransaction.start();
      
      const nestedTransaction = await parentTransaction.createNestedTransaction();
      
      // Check that a savepoint was created with a name that includes the nested transaction ID
      const savepointName = Array.from(mockTransactionClient._savepoints).find(name => 
        name.includes(`NESTED_${nestedTransaction.id}`)
      );
      expect(savepointName).toBeDefined();
    });

    it('should throw an error when creating a nested transaction in a non-active transaction', async () => {
      const transaction = await service.createTransaction();
      
      await expect(transaction.createNestedTransaction()).rejects.toThrow(TransactionError);
    });
  });

  describe('distributed transactions', () => {
    it('should create a distributed transaction', async () => {
      const transactionId = uuidv4();
      const transaction = await service.createDistributedTransaction(transactionId);
      
      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(transactionId);
      expect(transaction.metadata.type).toBe(TransactionType.DISTRIBUTED);
      expect(transaction.options.distributed.isDistributed).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.distributed.created', expect.any(Object));
    });

    it('should start a distributed transaction', async () => {
      const transactionId = uuidv4();
      const transaction = await service.createDistributedTransaction(transactionId);
      await transaction.start();
      
      expect(transaction.state).toBe(TransactionState.ACTIVE);
      expect(transaction.metadata.startedAt).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.distributed.started', expect.any(Object));
    });

    it('should register participants in a distributed transaction', async () => {
      const transactionId = uuidv4();
      const transaction = await service.createDistributedTransaction(transactionId);
      await transaction.start();
      
      // Access the private participants map using type assertion
      const distributedTransaction = transaction as any;
      
      // Register a participant
      const participant = new MockDistributedTransactionParticipant('participant1');
      distributedTransaction.registerParticipant('participant1', participant);
      
      // Check that the participant was registered
      expect(distributedTransaction.participants.get('participant1')).toBe(participant);
    });

    it('should commit a distributed transaction with two-phase commit', async () => {
      const transactionId = uuidv4();
      const transaction = await service.createDistributedTransaction(transactionId);
      await transaction.start();
      
      // Access the private participants map using type assertion
      const distributedTransaction = transaction as any;
      
      // Register participants
      const participant1 = new MockDistributedTransactionParticipant('participant1');
      const participant2 = new MockDistributedTransactionParticipant('participant2');
      distributedTransaction.registerParticipant('participant1', participant1);
      distributedTransaction.registerParticipant('participant2', participant2);
      
      // Commit the transaction
      await transaction.commit();
      
      // Check that prepare and commit were called on both participants
      expect(participant1.prepareCount).toBe(1);
      expect(participant1.commitCount).toBe(1);
      expect(participant2.prepareCount).toBe(1);
      expect(participant2.commitCount).toBe(1);
      
      // Check that the transaction was committed
      expect(transaction.state).toBe(TransactionState.COMMITTED);
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.distributed.committed', expect.any(Object));
    });

    it('should rollback a distributed transaction if any participant fails to prepare', async () => {
      const transactionId = uuidv4();
      const transaction = await service.createDistributedTransaction(transactionId);
      await transaction.start();
      
      // Access the private participants map using type assertion
      const distributedTransaction = transaction as any;
      
      // Register participants
      const participant1 = new MockDistributedTransactionParticipant('participant1');
      const participant2 = new MockDistributedTransactionParticipant('participant2');
      participant2.prepareResult = false; // Make participant2 fail to prepare
      
      distributedTransaction.registerParticipant('participant1', participant1);
      distributedTransaction.registerParticipant('participant2', participant2);
      
      // Attempt to commit the transaction
      await expect(transaction.commit()).rejects.toThrow(DistributedTransactionError);
      
      // Check that prepare was called on both participants
      expect(participant1.prepareCount).toBe(1);
      expect(participant2.prepareCount).toBe(1);
      
      // Check that commit was not called on any participant
      expect(participant1.commitCount).toBe(0);
      expect(participant2.commitCount).toBe(0);
      
      // Check that rollback was called on both participants
      expect(participant1.rollbackCount).toBe(1);
      expect(participant2.rollbackCount).toBe(1);
      
      // Check that the transaction was rolled back
      expect(transaction.state).toBe(TransactionState.ROLLED_BACK);
    });

    it('should rollback a distributed transaction if any participant fails to commit', async () => {
      const transactionId = uuidv4();
      const transaction = await service.createDistributedTransaction(transactionId);
      await transaction.start();
      
      // Access the private participants map using type assertion
      const distributedTransaction = transaction as any;
      
      // Register participants
      const participant1 = new MockDistributedTransactionParticipant('participant1');
      const participant2 = new MockDistributedTransactionParticipant('participant2');
      participant2.commitResult = false; // Make participant2 fail to commit
      
      distributedTransaction.registerParticipant('participant1', participant1);
      distributedTransaction.registerParticipant('participant2', participant2);
      
      // Attempt to commit the transaction
      await expect(transaction.commit()).rejects.toThrow(DistributedTransactionError);
      
      // Check that prepare was called on both participants
      expect(participant1.prepareCount).toBe(1);
      expect(participant2.prepareCount).toBe(1);
      
      // Check that commit was called on both participants
      expect(participant1.commitCount).toBe(1);
      expect(participant2.commitCount).toBe(1);
      
      // Check that rollback was called on both participants
      expect(participant1.rollbackCount).toBe(1);
      expect(participant2.rollbackCount).toBe(1);
      
      // Check that the transaction was rolled back
      expect(transaction.state).toBe(TransactionState.FAILED);
    });

    it('should explicitly rollback a distributed transaction', async () => {
      const transactionId = uuidv4();
      const transaction = await service.createDistributedTransaction(transactionId);
      await transaction.start();
      
      // Access the private participants map using type assertion
      const distributedTransaction = transaction as any;
      
      // Register participants
      const participant1 = new MockDistributedTransactionParticipant('participant1');
      const participant2 = new MockDistributedTransactionParticipant('participant2');
      
      distributedTransaction.registerParticipant('participant1', participant1);
      distributedTransaction.registerParticipant('participant2', participant2);
      
      // Rollback the transaction
      await transaction.rollback();
      
      // Check that rollback was called on both participants
      expect(participant1.rollbackCount).toBe(1);
      expect(participant2.rollbackCount).toBe(1);
      
      // Check that the transaction was rolled back
      expect(transaction.state).toBe(TransactionState.ROLLED_BACK);
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.distributed.rolledBack', expect.any(Object));
    });
  });

  describe('transaction timeout handling', () => {
    beforeEach(() => {
      // Mock setTimeout and clearTimeout
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set up a timeout when starting a transaction with a timeout', async () => {
      const transaction = await service.createTransaction({
        timeout: {
          timeoutMs: 5000,
          autoRollbackOnTimeout: true,
        },
      });
      
      // Spy on the handleTimeout method
      const handleTimeoutSpy = jest.spyOn(transaction as any, 'handleTimeout');
      
      await transaction.start();
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      // Check that handleTimeout was called
      expect(handleTimeoutSpy).toHaveBeenCalled();
      
      // Check that the transaction was marked as failed
      expect(transaction.state).toBe(TransactionState.FAILED);
      expect(transaction.metadata.error).toBeInstanceOf(TransactionTimeoutError);
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.timeout', expect.any(Object));
    });

    it('should clear the timeout when committing a transaction', async () => {
      const transaction = await service.createTransaction({
        timeout: {
          timeoutMs: 5000,
          autoRollbackOnTimeout: true,
        },
      });
      
      await transaction.start();
      
      // Spy on clearTimeout
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      await transaction.commit();
      
      // Check that clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear the timeout when rolling back a transaction', async () => {
      const transaction = await service.createTransaction({
        timeout: {
          timeoutMs: 5000,
          autoRollbackOnTimeout: true,
        },
      });
      
      await transaction.start();
      
      // Spy on clearTimeout
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      await transaction.rollback();
      
      // Check that clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should automatically rollback a transaction on timeout if configured', async () => {
      const transaction = await service.createTransaction({
        timeout: {
          timeoutMs: 5000,
          autoRollbackOnTimeout: true,
        },
      });
      
      // Spy on the rollback method
      const rollbackSpy = jest.spyOn(transaction, 'rollback');
      
      await transaction.start();
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      // Check that rollback was called
      expect(rollbackSpy).toHaveBeenCalled();
    });

    it('should not automatically rollback a transaction on timeout if not configured', async () => {
      const transaction = await service.createTransaction({
        timeout: {
          timeoutMs: 5000,
          autoRollbackOnTimeout: false,
        },
      });
      
      // Spy on the rollback method
      const rollbackSpy = jest.spyOn(transaction, 'rollback');
      
      await transaction.start();
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      // Check that rollback was not called
      expect(rollbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('transaction management utilities', () => {
    it('should get an active transaction by ID', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      const retrievedTransaction = await service.getTransaction(transaction.id);
      
      expect(retrievedTransaction).toBe(transaction);
    });

    it('should return null when getting a non-existent transaction', async () => {
      const retrievedTransaction = await service.getTransaction('non-existent');
      
      expect(retrievedTransaction).toBeNull();
    });

    it('should get all active transactions', async () => {
      const transaction1 = await service.createTransaction();
      const transaction2 = await service.createTransaction();
      
      await transaction1.start();
      await transaction2.start();
      
      const activeTransactions = await service.getActiveTransactions();
      
      expect(activeTransactions).toHaveLength(2);
      expect(activeTransactions).toContain(transaction1);
      expect(activeTransactions).toContain(transaction2);
    });

    it('should get all active transactions for a specific journey', async () => {
      const transaction1 = await service.createTransaction({ journeyContext: 'health' });
      const transaction2 = await service.createTransaction({ journeyContext: 'health' });
      const transaction3 = await service.createTransaction({ journeyContext: 'care' });
      
      await transaction1.start();
      await transaction2.start();
      await transaction3.start();
      
      const healthTransactions = await service.getJourneyTransactions('health');
      
      expect(healthTransactions).toHaveLength(2);
      expect(healthTransactions).toContain(transaction1);
      expect(healthTransactions).toContain(transaction2);
      expect(healthTransactions).not.toContain(transaction3);
    });

    it('should start a transaction with the startTransaction method', async () => {
      const client = await service.startTransaction({
        isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
      });
      
      expect(client).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        { isolationLevel: 'Serializable' },
        expect.any(Object)
      );
    });

    it('should commit a transaction with the commitTransaction method', async () => {
      const client = await service.startTransaction();
      await service.commitTransaction(client);
      
      expect(mockTransactionClient._state).toBe('committed');
    });

    it('should rollback a transaction with the rollbackTransaction method', async () => {
      const client = await service.startTransaction();
      await service.rollbackTransaction(client);
      
      expect(mockTransactionClient._state).toBe('rolledBack');
    });

    it('should create a savepoint with the createSavepoint method', async () => {
      const client = await service.startTransaction();
      const savepointName = await service.createSavepoint(client, 'test_savepoint');
      
      expect(savepointName).toBe('test_savepoint');
      expect(mockTransactionClient._savepoints.has('test_savepoint')).toBe(true);
    });

    it('should rollback to a savepoint with the rollbackToSavepoint method', async () => {
      const client = await service.startTransaction();
      const savepointName = await service.createSavepoint(client, 'test_savepoint');
      await service.rollbackToSavepoint(client, savepointName);
      
      // No assertion needed, just checking that it doesn't throw
    });
  });

  describe('cleanup and resource management', () => {
    it('should clean up abandoned transactions', async () => {
      // Create a transaction with a short timeout
      const transaction = await service.createTransaction({
        timeout: {
          timeoutMs: 100, // Very short timeout
          autoRollbackOnTimeout: false,
        },
      });
      
      await transaction.start();
      
      // Spy on the rollback method
      const rollbackSpy = jest.spyOn(transaction, 'rollback');
      
      // Mock Date.now to simulate passage of time
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalDateNow() + 300); // 300ms in the future
      
      // Call the private cleanupAbandonedTransactions method
      await (service as any).cleanupAbandonedTransactions();
      
      // Restore Date.now
      Date.now = originalDateNow;
      
      // Check that rollback was called
      expect(rollbackSpy).toHaveBeenCalled();
    });

    it('should remove transactions when they are committed', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      // Spy on the removeTransaction method
      const removeTransactionSpy = jest.spyOn(service as any, 'removeTransaction');
      
      await transaction.commit();
      
      // Check that removeTransaction was called
      expect(removeTransactionSpy).toHaveBeenCalledWith(transaction.id);
      
      // Check that the transaction is no longer in active transactions
      const retrievedTransaction = await service.getTransaction(transaction.id);
      expect(retrievedTransaction).toBeNull();
    });

    it('should remove transactions when they are rolled back', async () => {
      const transaction = await service.createTransaction();
      await transaction.start();
      
      // Spy on the removeTransaction method
      const removeTransactionSpy = jest.spyOn(service as any, 'removeTransaction');
      
      await transaction.rollback();
      
      // Check that removeTransaction was called
      expect(removeTransactionSpy).toHaveBeenCalledWith(transaction.id);
      
      // Check that the transaction is no longer in active transactions
      const retrievedTransaction = await service.getTransaction(transaction.id);
      expect(retrievedTransaction).toBeNull();
    });

    it('should remove transactions when they fail', async () => {
      // Mock PrismaService.$transaction to throw an error
      (prismaService.$transaction as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
      
      const transaction = await service.createTransaction();
      
      // Spy on the removeTransaction method
      const removeTransactionSpy = jest.spyOn(service as any, 'removeTransaction');
      
      // Start the transaction, which will fail
      await expect(transaction.start()).rejects.toThrow();
      
      // Emit the transaction.failed event to trigger removal
      eventEmitter.emit('transaction.failed', { transactionId: transaction.id });
      
      // Check that removeTransaction was called
      expect(removeTransactionSpy).toHaveBeenCalledWith(transaction.id);
    });

    it('should roll back all active transactions during shutdown', async () => {
      const transaction1 = await service.createTransaction();
      const transaction2 = await service.createTransaction();
      
      await transaction1.start();
      await transaction2.start();
      
      // Spy on the rollback methods
      const rollbackSpy1 = jest.spyOn(transaction1, 'rollback');
      const rollbackSpy2 = jest.spyOn(transaction2, 'rollback');
      
      // Call onModuleDestroy to simulate shutdown
      await service.onModuleDestroy();
      
      // Check that rollback was called on both transactions
      expect(rollbackSpy1).toHaveBeenCalled();
      expect(rollbackSpy2).toHaveBeenCalled();
    });
  });
});