/**
 * @file journey-context.mock.ts
 * @description Base mock implementation for journey-specific database contexts that provides common testing
 * utilities and mock functionality. Serves as the foundation for journey-specific context mocks with
 * customizable behavior for query responses, transaction handling, and error simulation.
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

import { JourneyType } from '../../src/contexts/care.context';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { FilterOptions, SortOptions, PaginationOptions } from '../../src/types/query.types';

/**
 * Base mock implementation for journey-specific database contexts.
 * Provides common testing utilities and mock functionality that can be extended
 * by journey-specific context mocks.
 */
export class BaseJourneyContextMock {
  // Common mock functions for all journey contexts
  public findById = jest.fn();
  public findMany = jest.fn();
  public create = jest.fn();
  public update = jest.fn();
  public delete = jest.fn();
  public count = jest.fn();
  public transaction = jest.fn();
  public executeJourneyOperation = jest.fn();
  public getPrismaClient = jest.fn();
  public sendDatabaseEvent = jest.fn();

  /**
   * Creates a new instance of BaseJourneyContextMock.
   * @param journeyType The type of journey this context is for
   */
  constructor(protected readonly journeyType: JourneyType) {
    this.setupBaseMockImplementations();
  }

  /**
   * Sets up mock implementations for base journey context methods.
   * @private
   */
  private setupBaseMockImplementations(): void {
    // Mock findById implementation
    this.findById.mockImplementation((id: string | number) => {
      if (!id) {
        throw new DatabaseException(
          'ID is required',
          DatabaseErrorType.VALIDATION,
          { id }
        );
      }
      return Promise.resolve({ id });
    });

    // Mock findMany implementation
    this.findMany.mockImplementation(
      (filter?: FilterOptions, sort?: SortOptions, pagination?: PaginationOptions) => {
        return Promise.resolve([{ id: '1' }, { id: '2' }]);
      }
    );

    // Mock create implementation
    this.create.mockImplementation((data: Record<string, any>) => {
      if (!data) {
        throw new DatabaseException(
          'Data is required',
          DatabaseErrorType.VALIDATION,
          { data }
        );
      }
      return Promise.resolve({ id: 'new-id', ...data, createdAt: new Date() });
    });

    // Mock update implementation
    this.update.mockImplementation((id: string | number, data: Record<string, any>) => {
      if (!id) {
        throw new DatabaseException(
          'ID is required',
          DatabaseErrorType.VALIDATION,
          { id }
        );
      }
      if (!data) {
        throw new DatabaseException(
          'Data is required',
          DatabaseErrorType.VALIDATION,
          { data }
        );
      }
      return Promise.resolve({ id, ...data, updatedAt: new Date() });
    });

    // Mock delete implementation
    this.delete.mockImplementation((id: string | number) => {
      if (!id) {
        throw new DatabaseException(
          'ID is required',
          DatabaseErrorType.VALIDATION,
          { id }
        );
      }
      return Promise.resolve({ id, deleted: true });
    });

    // Mock count implementation
    this.count.mockImplementation((filter?: FilterOptions) => {
      return Promise.resolve(10);
    });

    // Mock transaction implementation
    this.transaction.mockImplementation(
      async <T>(fn: (tx: PrismaClient) => Promise<T>, options?: any) => {
        // Create a mock transaction object
        const mockTx = {
          $transaction: jest.fn(),
          $connect: jest.fn(),
          $disconnect: jest.fn(),
          // Add other Prisma models as needed
          user: {
            findUnique: jest.fn().mockResolvedValue({ id: 'user1', name: 'Test User' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'user1', name: 'Test User' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'user1', name: 'Test User' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-user', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(5),
          },
          // Add journey-specific models
          appointment: {
            findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'user1', providerId: 'provider1' }),
            findFirst: jest.fn().mockResolvedValue({ id: '1', userId: 'user1', providerId: 'provider1' }),
            findMany: jest.fn().mockResolvedValue([{ id: '1', userId: 'user1', providerId: 'provider1' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-appointment', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(3),
          },
          provider: {
            findUnique: jest.fn().mockResolvedValue({ id: 'provider1', name: 'Dr. Test' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'provider1', name: 'Dr. Test' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'provider1', name: 'Dr. Test' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-provider', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(2),
          },
          medication: {
            findUnique: jest.fn().mockResolvedValue({ id: 'med1', name: 'Test Medication' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'med1', name: 'Test Medication' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'med1', name: 'Test Medication' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-med', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(4),
          },
          telemedicineSession: {
            findUnique: jest.fn().mockResolvedValue({ id: 'tele1', appointmentId: '1' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'tele1', appointmentId: '1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'tele1', appointmentId: '1' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-tele', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(1),
          },
          treatmentPlan: {
            findUnique: jest.fn().mockResolvedValue({ id: 'plan1', name: 'Test Plan' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'plan1', name: 'Test Plan' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'plan1', name: 'Test Plan' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-plan', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(1),
          },
          treatmentItem: {
            findUnique: jest.fn().mockResolvedValue({ id: 'item1', treatmentPlanId: 'plan1' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'item1', treatmentPlanId: 'plan1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'item1', treatmentPlanId: 'plan1' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-item', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(3),
          },
          treatmentProgress: {
            findUnique: jest.fn().mockResolvedValue({ id: 'progress1', treatmentItemId: 'item1' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'progress1', treatmentItemId: 'item1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'progress1', treatmentItemId: 'item1' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-progress', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(2),
          },
          careActivity: {
            findUnique: jest.fn().mockResolvedValue({ id: 'care1', userId: 'user1', providerId: 'provider1' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'care1', userId: 'user1', providerId: 'provider1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'care1', userId: 'user1', providerId: 'provider1' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-care', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(1),
          },
          symptomCheckerSession: {
            findUnique: jest.fn().mockResolvedValue({ id: 'symptom1', userId: 'user1' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'symptom1', userId: 'user1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'symptom1', userId: 'user1' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-symptom', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(1),
          },
          medicationIntake: {
            findUnique: jest.fn().mockResolvedValue({ id: 'intake1', medicationId: 'med1' }),
            findFirst: jest.fn().mockResolvedValue({ id: 'intake1', medicationId: 'med1' }),
            findMany: jest.fn().mockResolvedValue([{ id: 'intake1', medicationId: 'med1' }]),
            create: jest.fn().mockImplementation(data => ({ id: 'new-intake', ...data.data })),
            update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
            delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
            count: jest.fn().mockResolvedValue(5),
          },
        } as unknown as PrismaClient;

        try {
          // Execute the function with the mock transaction
          return await fn(mockTx);
        } catch (error) {
          // Re-throw the error to simulate transaction failure
          throw error;
        }
      }
    );

    // Mock executeJourneyOperation implementation
    this.executeJourneyOperation.mockImplementation(
      async <T>(operationName: string, operation: () => Promise<T>, options?: any) => {
        try {
          return await operation();
        } catch (error) {
          // Re-throw the error
          throw error;
        }
      }
    );

    // Mock getPrismaClient implementation
    this.getPrismaClient.mockImplementation(() => {
      // Return a mock PrismaClient
      return {
        $transaction: jest.fn(),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        // Add other Prisma models as needed
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'user1', name: 'Test User' }),
          findFirst: jest.fn().mockResolvedValue({ id: 'user1', name: 'Test User' }),
          findMany: jest.fn().mockResolvedValue([{ id: 'user1', name: 'Test User' }]),
          create: jest.fn().mockImplementation(data => ({ id: 'new-user', ...data.data })),
          update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
          delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
          count: jest.fn().mockResolvedValue(5),
        },
        // Add journey-specific models (same as in transaction mock)
        appointment: {
          findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'user1', providerId: 'provider1' }),
          findFirst: jest.fn().mockResolvedValue({ id: '1', userId: 'user1', providerId: 'provider1' }),
          findMany: jest.fn().mockResolvedValue([{ id: '1', userId: 'user1', providerId: 'provider1' }]),
          create: jest.fn().mockImplementation(data => ({ id: 'new-appointment', ...data.data })),
          update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
          delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
          count: jest.fn().mockResolvedValue(3),
        },
        provider: {
          findUnique: jest.fn().mockResolvedValue({ id: 'provider1', name: 'Dr. Test' }),
          findFirst: jest.fn().mockResolvedValue({ id: 'provider1', name: 'Dr. Test' }),
          findMany: jest.fn().mockResolvedValue([{ id: 'provider1', name: 'Dr. Test' }]),
          create: jest.fn().mockImplementation(data => ({ id: 'new-provider', ...data.data })),
          update: jest.fn().mockImplementation(data => ({ id: data.where.id, ...data.data })),
          delete: jest.fn().mockImplementation(data => ({ id: data.where.id, deleted: true })),
          count: jest.fn().mockResolvedValue(2),
        },
        // Add other journey-specific models as needed
      } as unknown as PrismaClient;
    });

    // Mock sendDatabaseEvent implementation
    this.sendDatabaseEvent.mockImplementation(
      (eventType: string, payload: Record<string, any>) => {
        console.log(`[MOCK] Database Event: ${eventType}`, payload);
        return Promise.resolve();
      }
    );
  }

  /**
   * Configure a mock function to throw an error
   * @param methodName Name of the method to configure
   * @param errorType Type of error to throw
   * @param message Error message
   * @param metadata Additional error metadata
   */
  public mockMethodToThrowError(
    methodName: string,
    errorType: DatabaseErrorType,
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (this[methodName] && typeof this[methodName].mockImplementation === 'function') {
      this[methodName].mockImplementation(() => {
        throw new DatabaseException(message, errorType, metadata);
      });
    }
  }

  /**
   * Configure a mock function to return a specific value
   * @param methodName Name of the method to configure
   * @param returnValue Value to return
   */
  public mockMethodToReturn<T>(
    methodName: string,
    returnValue: T
  ): void {
    if (this[methodName] && typeof this[methodName].mockImplementation === 'function') {
      this[methodName].mockImplementation(() => Promise.resolve(returnValue));
    }
  }

  /**
   * Configure a mock function with a custom implementation
   * @param methodName Name of the method to configure
   * @param implementation Custom implementation function
   */
  public mockMethodWithImplementation<T>(
    methodName: string,
    implementation: (...args: any[]) => Promise<T>
  ): void {
    if (this[methodName] && typeof this[methodName].mockImplementation === 'function') {
      this[methodName].mockImplementation(implementation);
    }
  }

  /**
   * Reset all mock implementations to their defaults
   */
  public resetAllMocks(): void {
    // Reset all mock implementations
    Object.keys(this).forEach(key => {
      if (this[key] && typeof this[key].mockReset === 'function') {
        this[key].mockReset();
      }
    });

    // Re-setup base mock implementations
    this.setupBaseMockImplementations();
  }

  /**
   * Simulate a database connection error
   */
  public simulateConnectionError(): void {
    this.getPrismaClient.mockImplementation(() => {
      throw new DatabaseException(
        'Failed to connect to database',
        DatabaseErrorType.CONNECTION,
        { journeyType: this.journeyType }
      );
    });
  }

  /**
   * Simulate a transaction error
   */
  public simulateTransactionError(): void {
    this.transaction.mockImplementation(() => {
      throw new DatabaseException(
        'Transaction failed',
        DatabaseErrorType.TRANSACTION,
        { journeyType: this.journeyType }
      );
    });
  }

  /**
   * Simulate a query timeout
   */
  public simulateQueryTimeout(): void {
    this.executeJourneyOperation.mockImplementation(() => {
      throw new DatabaseException(
        'Query timeout',
        DatabaseErrorType.TIMEOUT,
        { journeyType: this.journeyType }
      );
    });
  }
}