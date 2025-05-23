/**
 * Mock implementations of string utility functions for testing purposes.
 * These mocks provide configurable behavior and spy functionality to facilitate testing
 * of components that use string utilities.
 */

/**
 * Configuration interface for capitalizeFirstLetter mock
 */
export interface CapitalizeFirstLetterMockConfig {
  /** Custom implementation to override default behavior */
  implementation?: (str: string) => string;
  /** Force return value regardless of input */
  returnValue?: string;
  /** Simulate an error being thrown */
  throwError?: boolean;
  /** Custom error to throw if throwError is true */
  errorToThrow?: Error;
  /** Journey-specific formatting rules */
  journeyFormatting?: {
    health?: (str: string) => string;
    care?: (str: string) => string;
    plan?: (str: string) => string;
  };
}

/**
 * Configuration interface for truncate mock
 */
export interface TruncateMockConfig {
  /** Custom implementation to override default behavior */
  implementation?: (str: string, length: number) => string;
  /** Force return value regardless of input */
  returnValue?: string;
  /** Simulate an error being thrown */
  throwError?: boolean;
  /** Custom error to throw if throwError is true */
  errorToThrow?: Error;
  /** Journey-specific truncation rules */
  journeyTruncation?: {
    health?: (str: string, length: number) => string;
    care?: (str: string, length: number) => string;
    plan?: (str: string, length: number) => string;
  };
}

/**
 * Configuration interface for isValidCPF mock
 */
export interface IsValidCPFMockConfig {
  /** Custom implementation to override default behavior */
  implementation?: (cpf: string) => boolean;
  /** Force return value regardless of input */
  returnValue?: boolean;
  /** Simulate an error being thrown */
  throwError?: boolean;
  /** Custom error to throw if throwError is true */
  errorToThrow?: Error;
  /** Special case CPF values and their validation results */
  specialCases?: Record<string, boolean>;
  /** Journey-specific validation rules */
  journeyValidation?: {
    health?: (cpf: string) => boolean;
    care?: (cpf: string) => boolean;
    plan?: (cpf: string) => boolean;
  };
}

/**
 * Call history entry for tracking function calls
 */
interface CallHistoryEntry<T extends any[], R> {
  /** Arguments passed to the function */
  args: T;
  /** Return value from the function */
  returnValue: R;
  /** Timestamp when the function was called */
  timestamp: number;
  /** Journey context if provided */
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * Mock for capitalizeFirstLetter function with spy capabilities
 */
export class CapitalizeFirstLetterMock {
  private config: CapitalizeFirstLetterMockConfig = {};
  private callHistory: CallHistoryEntry<[string], string>[] = [];

  /**
   * Creates a new instance of CapitalizeFirstLetterMock
   * @param config - Initial configuration
   */
  constructor(config: CapitalizeFirstLetterMockConfig = {}) {
    this.config = config;
  }

  /**
   * Updates the mock configuration
   * @param config - New configuration to apply
   */
  configure(config: Partial<CapitalizeFirstLetterMockConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Resets the mock to its initial state
   */
  reset(): void {
    this.config = {};
    this.callHistory = [];
  }

  /**
   * Clears the call history without resetting configuration
   */
  clearHistory(): void {
    this.callHistory = [];
  }

  /**
   * Gets the call history
   */
  getCallHistory(): ReadonlyArray<CallHistoryEntry<[string], string>> {
    return this.callHistory;
  }

  /**
   * Gets the number of times the mock was called
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Mock implementation of capitalizeFirstLetter
   * @param str - The input string to capitalize
   * @param journeyContext - Optional journey context for journey-specific formatting
   * @returns The string with the first letter capitalized
   */
  capitalizeFirstLetter(str: string, journeyContext?: 'health' | 'care' | 'plan'): string {
    try {
      // Handle error simulation
      if (this.config.throwError) {
        throw this.config.errorToThrow || new Error('Simulated error in capitalizeFirstLetter');
      }

      // Determine the return value
      let returnValue: string;

      // Use forced return value if configured
      if (this.config.returnValue !== undefined) {
        returnValue = this.config.returnValue;
      }
      // Use journey-specific formatting if available and journey context is provided
      else if (journeyContext && this.config.journeyFormatting && this.config.journeyFormatting[journeyContext]) {
        returnValue = this.config.journeyFormatting[journeyContext]!(str);
      }
      // Use custom implementation if provided
      else if (this.config.implementation) {
        returnValue = this.config.implementation(str);
      }
      // Default implementation
      else {
        if (!str || str.length === 0) {
          returnValue = '';
        } else {
          returnValue = str.charAt(0).toUpperCase() + str.slice(1);
        }
      }

      // Record the call
      this.callHistory.push({
        args: [str],
        returnValue,
        timestamp: Date.now(),
        journeyContext
      });

      return returnValue;
    } catch (error) {
      // Record the call with error
      this.callHistory.push({
        args: [str],
        returnValue: null as any,
        timestamp: Date.now(),
        journeyContext
      });
      throw error;
    }
  }
}

/**
 * Mock for truncate function with spy capabilities
 */
export class TruncateMock {
  private config: TruncateMockConfig = {};
  private callHistory: CallHistoryEntry<[string, number], string>[] = [];

  /**
   * Creates a new instance of TruncateMock
   * @param config - Initial configuration
   */
  constructor(config: TruncateMockConfig = {}) {
    this.config = config;
  }

  /**
   * Updates the mock configuration
   * @param config - New configuration to apply
   */
  configure(config: Partial<TruncateMockConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Resets the mock to its initial state
   */
  reset(): void {
    this.config = {};
    this.callHistory = [];
  }

  /**
   * Clears the call history without resetting configuration
   */
  clearHistory(): void {
    this.callHistory = [];
  }

  /**
   * Gets the call history
   */
  getCallHistory(): ReadonlyArray<CallHistoryEntry<[string, number], string>> {
    return this.callHistory;
  }

  /**
   * Gets the number of times the mock was called
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Mock implementation of truncate
   * @param str - The input string to truncate
   * @param length - The maximum length of the returned string
   * @param journeyContext - Optional journey context for journey-specific truncation
   * @returns The truncated string with ellipsis if needed
   */
  truncate(str: string, length: number, journeyContext?: 'health' | 'care' | 'plan'): string {
    try {
      // Handle error simulation
      if (this.config.throwError) {
        throw this.config.errorToThrow || new Error('Simulated error in truncate');
      }

      // Determine the return value
      let returnValue: string;

      // Use forced return value if configured
      if (this.config.returnValue !== undefined) {
        returnValue = this.config.returnValue;
      }
      // Use journey-specific truncation if available and journey context is provided
      else if (journeyContext && this.config.journeyTruncation && this.config.journeyTruncation[journeyContext]) {
        returnValue = this.config.journeyTruncation[journeyContext]!(str, length);
      }
      // Use custom implementation if provided
      else if (this.config.implementation) {
        returnValue = this.config.implementation(str, length);
      }
      // Default implementation
      else {
        if (str === null || str === undefined) {
          returnValue = '';
        } else if (str.length <= length) {
          returnValue = str;
        } else {
          returnValue = str.slice(0, length) + '...';
        }
      }

      // Record the call
      this.callHistory.push({
        args: [str, length],
        returnValue,
        timestamp: Date.now(),
        journeyContext
      });

      return returnValue;
    } catch (error) {
      // Record the call with error
      this.callHistory.push({
        args: [str, length],
        returnValue: null as any,
        timestamp: Date.now(),
        journeyContext
      });
      throw error;
    }
  }
}

/**
 * Mock for isValidCPF function with spy capabilities
 */
export class IsValidCPFMock {
  private config: IsValidCPFMockConfig = {};
  private callHistory: CallHistoryEntry<[string], boolean>[] = [];

  /**
   * Creates a new instance of IsValidCPFMock
   * @param config - Initial configuration
   */
  constructor(config: IsValidCPFMockConfig = {}) {
    this.config = config;
  }

  /**
   * Updates the mock configuration
   * @param config - New configuration to apply
   */
  configure(config: Partial<IsValidCPFMockConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Resets the mock to its initial state
   */
  reset(): void {
    this.config = {};
    this.callHistory = [];
  }

  /**
   * Clears the call history without resetting configuration
   */
  clearHistory(): void {
    this.callHistory = [];
  }

  /**
   * Gets the call history
   */
  getCallHistory(): ReadonlyArray<CallHistoryEntry<[string], boolean>> {
    return this.callHistory;
  }

  /**
   * Gets the number of times the mock was called
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Mock implementation of isValidCPF
   * @param cpf - The CPF string to validate
   * @param journeyContext - Optional journey context for journey-specific validation
   * @returns True if the CPF is valid, false otherwise
   */
  isValidCPF(cpf: string, journeyContext?: 'health' | 'care' | 'plan'): boolean {
    try {
      // Handle error simulation
      if (this.config.throwError) {
        throw this.config.errorToThrow || new Error('Simulated error in isValidCPF');
      }

      // Determine the return value
      let returnValue: boolean;

      // Use forced return value if configured
      if (this.config.returnValue !== undefined) {
        returnValue = this.config.returnValue;
      }
      // Check special cases
      else if (this.config.specialCases && cpf in this.config.specialCases) {
        returnValue = this.config.specialCases[cpf];
      }
      // Use journey-specific validation if available and journey context is provided
      else if (journeyContext && this.config.journeyValidation && this.config.journeyValidation[journeyContext]) {
        returnValue = this.config.journeyValidation[journeyContext]!(cpf);
      }
      // Use custom implementation if provided
      else if (this.config.implementation) {
        returnValue = this.config.implementation(cpf);
      }
      // Default implementation (simplified for mock purposes)
      else {
        // Remove non-digit characters
        const cleanCPF = cpf.replace(/\D/g, '');
        
        // CPF must have 11 digits
        if (cleanCPF.length !== 11) {
          returnValue = false;
        }
        // Check if all digits are the same (invalid CPF)
        else if (/^(\d)\1+$/.test(cleanCPF)) {
          returnValue = false;
        }
        // For mock purposes, we'll consider some common test CPFs as valid
        else if (['12345678909', '98765432109'].includes(cleanCPF)) {
          returnValue = true;
        }
        // For other CPFs, we'll do a simplified validation
        else {
          // This is a simplified validation for testing purposes
          // In a real implementation, we would calculate verification digits
          returnValue = true;
        }
      }

      // Record the call
      this.callHistory.push({
        args: [cpf],
        returnValue,
        timestamp: Date.now(),
        journeyContext
      });

      return returnValue;
    } catch (error) {
      // Record the call with error
      this.callHistory.push({
        args: [cpf],
        returnValue: null as any,
        timestamp: Date.now(),
        journeyContext
      });
      throw error;
    }
  }
}

/**
 * Creates a pre-configured mock for capitalizeFirstLetter
 * @param config - Configuration for the mock
 * @returns A configured mock instance
 */
export const createCapitalizeFirstLetterMock = (config: CapitalizeFirstLetterMockConfig = {}): CapitalizeFirstLetterMock => {
  return new CapitalizeFirstLetterMock(config);
};

/**
 * Creates a pre-configured mock for truncate
 * @param config - Configuration for the mock
 * @returns A configured mock instance
 */
export const createTruncateMock = (config: TruncateMockConfig = {}): TruncateMock => {
  return new TruncateMock(config);
};

/**
 * Creates a pre-configured mock for isValidCPF
 * @param config - Configuration for the mock
 * @returns A configured mock instance
 */
export const createIsValidCPFMock = (config: IsValidCPFMockConfig = {}): IsValidCPFMock => {
  return new IsValidCPFMock(config);
};

/**
 * Default mock instances for direct import
 */
export const capitalizeFirstLetterMock = createCapitalizeFirstLetterMock();
export const truncateMock = createTruncateMock();
export const isValidCPFMock = createIsValidCPFMock();

/**
 * Convenience function to reset all string utility mocks
 */
export const resetAllStringMocks = (): void => {
  capitalizeFirstLetterMock.reset();
  truncateMock.reset();
  isValidCPFMock.reset();
};

/**
 * Convenience function to clear history for all string utility mocks
 */
export const clearAllStringMocksHistory = (): void => {
  capitalizeFirstLetterMock.clearHistory();
  truncateMock.clearHistory();
  isValidCPFMock.clearHistory();
};