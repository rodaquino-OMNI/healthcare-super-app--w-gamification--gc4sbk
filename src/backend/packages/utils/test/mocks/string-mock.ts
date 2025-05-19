/**
 * @file String Utility Mocks
 * @description Provides mock implementations of string utility functions for testing purposes.
 * These mocks enable testing of string manipulation and validation code with configurable behavior.
 * 
 * @module @austa/utils/test/mocks/string
 * @version 1.0.0
 */

import { ValidationResult } from '../../src/string';

/**
 * Mock configuration interface for string utility functions
 */
export interface StringMockConfig {
  /**
   * Configuration for capitalizeFirstLetter function
   */
  capitalizeFirstLetter?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (str: string | null | undefined) => string;
    /**
     * Fixed return value regardless of input
     */
    returnValue?: string;
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
  };

  /**
   * Configuration for truncate function
   */
  truncate?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (str: string | null | undefined, length: number, ellipsis?: string) => string;
    /**
     * Fixed return value regardless of input
     */
    returnValue?: string;
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
  };

  /**
   * Configuration for isValidCPF function
   */
  isValidCPF?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (cpf: unknown, detailed?: boolean) => boolean | { valid: boolean; error?: string };
    /**
     * Fixed return value regardless of input
     */
    returnValue?: boolean | { valid: boolean; error?: string };
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
    /**
     * Map of specific inputs to their corresponding outputs
     */
    inputOutputMap?: Record<string, boolean | { valid: boolean; error?: string }>;
  };

  /**
   * Configuration for isValidCNPJ function
   */
  isValidCNPJ?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (cnpj: unknown, detailed?: boolean) => boolean | { valid: boolean; error?: string };
    /**
     * Fixed return value regardless of input
     */
    returnValue?: boolean | { valid: boolean; error?: string };
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
    /**
     * Map of specific inputs to their corresponding outputs
     */
    inputOutputMap?: Record<string, boolean | { valid: boolean; error?: string }>;
  };

  /**
   * Configuration for isValidCEP function
   */
  isValidCEP?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (cep: unknown, detailed?: boolean) => boolean | { valid: boolean; error?: string };
    /**
     * Fixed return value regardless of input
     */
    returnValue?: boolean | { valid: boolean; error?: string };
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
    /**
     * Map of specific inputs to their corresponding outputs
     */
    inputOutputMap?: Record<string, boolean | { valid: boolean; error?: string }>;
  };

  /**
   * Configuration for isValidBrazilianPhone function
   */
  isValidBrazilianPhone?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (phone: unknown, detailed?: boolean) => boolean | { valid: boolean; error?: string };
    /**
     * Fixed return value regardless of input
     */
    returnValue?: boolean | { valid: boolean; error?: string };
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
    /**
     * Map of specific inputs to their corresponding outputs
     */
    inputOutputMap?: Record<string, boolean | { valid: boolean; error?: string }>;
  };

  /**
   * Configuration for formatCPF function
   */
  formatCPF?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (cpf: string) => string;
    /**
     * Fixed return value regardless of input
     */
    returnValue?: string;
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
    /**
     * Map of specific inputs to their corresponding outputs
     */
    inputOutputMap?: Record<string, string>;
  };

  /**
   * Configuration for formatCNPJ function
   */
  formatCNPJ?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (cnpj: string) => string;
    /**
     * Fixed return value regardless of input
     */
    returnValue?: string;
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
    /**
     * Map of specific inputs to their corresponding outputs
     */
    inputOutputMap?: Record<string, string>;
  };

  /**
   * Configuration for formatCEP function
   */
  formatCEP?: {
    /**
     * Custom implementation to override default behavior
     */
    implementation?: (cep: string) => string;
    /**
     * Fixed return value regardless of input
     */
    returnValue?: string;
    /**
     * If true, the function will throw an error when called
     */
    shouldThrow?: boolean;
    /**
     * Error to throw when shouldThrow is true
     */
    errorToThrow?: Error;
    /**
     * Map of specific inputs to their corresponding outputs
     */
    inputOutputMap?: Record<string, string>;
  };
}

/**
 * Function call tracking interface for spy functionality
 */
export interface FunctionCallTracker {
  /**
   * Number of times the function was called
   */
  callCount: number;
  
  /**
   * Array of all arguments passed to the function
   */
  calls: any[][];
  
  /**
   * Array of all return values from the function
   */
  returns: any[];
  
  /**
   * Last arguments passed to the function
   */
  lastCall: any[] | null;
  
  /**
   * Last return value from the function
   */
  lastReturn: any | null;
  
  /**
   * Reset all tracking data
   */
  reset: () => void;
}

/**
 * Creates a new function call tracker for spy functionality
 * @returns A new function call tracker
 */
const createCallTracker = (): FunctionCallTracker => ({
  callCount: 0,
  calls: [],
  returns: [],
  lastCall: null,
  lastReturn: null,
  reset() {
    this.callCount = 0;
    this.calls = [];
    this.returns = [];
    this.lastCall = null;
    this.lastReturn = null;
  }
});

/**
 * String utility mocks with spy functionality and configurable behavior
 */
export class StringMock {
  /**
   * Configuration for all string utility functions
   */
  private config: StringMockConfig = {};

  /**
   * Call trackers for spy functionality
   */
  private trackers: Record<string, FunctionCallTracker> = {
    capitalizeFirstLetter: createCallTracker(),
    truncate: createCallTracker(),
    isValidCPF: createCallTracker(),
    isValidCNPJ: createCallTracker(),
    isValidCEP: createCallTracker(),
    isValidBrazilianPhone: createCallTracker(),
    formatCPF: createCallTracker(),
    formatCNPJ: createCallTracker(),
    formatCEP: createCallTracker(),
  };

  /**
   * Creates a new StringMock instance with the provided configuration
   * @param config - Configuration for string utility functions
   */
  constructor(config: StringMockConfig = {}) {
    this.config = config;
  }

  /**
   * Updates the configuration for string utility functions
   * @param config - New configuration to apply
   */
  configure(config: StringMockConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Resets all call trackers
   */
  resetAllTrackers(): void {
    Object.values(this.trackers).forEach(tracker => tracker.reset());
  }

  /**
   * Gets the call tracker for a specific function
   * @param functionName - Name of the function to get the tracker for
   * @returns The call tracker for the specified function
   */
  getTracker(functionName: keyof typeof this.trackers): FunctionCallTracker {
    return this.trackers[functionName];
  }

  /**
   * Mock implementation of capitalizeFirstLetter
   * @param str - The input string to capitalize
   * @returns The string with the first letter capitalized
   */
  capitalizeFirstLetter = (str: string | null | undefined): string => {
    const tracker = this.trackers.capitalizeFirstLetter;
    tracker.callCount++;
    tracker.lastCall = [str];
    tracker.calls.push([str]);

    const config = this.config.capitalizeFirstLetter;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in capitalizeFirstLetter');
      }

      let result: string;

      if (config?.implementation) {
        result = config.implementation(str);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation
        if (!str || typeof str !== 'string' || str.length === 0) {
          result = '';
        } else {
          result = str.charAt(0).toUpperCase() + str.slice(1);
        }
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of truncate
   * @param str - The input string to truncate
   * @param length - The maximum length of the returned string
   * @param ellipsis - Optional custom ellipsis string
   * @returns The truncated string with ellipsis if needed
   */
  truncate = (str: string | null | undefined, length: number, ellipsis: string = '...'): string => {
    const tracker = this.trackers.truncate;
    tracker.callCount++;
    tracker.lastCall = [str, length, ellipsis];
    tracker.calls.push([str, length, ellipsis]);

    const config = this.config.truncate;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in truncate');
      }

      let result: string;

      if (config?.implementation) {
        result = config.implementation(str, length, ellipsis);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation
        if (str === null || str === undefined || typeof str !== 'string') {
          result = '';
        } else if (typeof length !== 'number' || length < 0) {
          result = '';
        } else if (str.length <= length) {
          result = str;
        } else {
          result = str.slice(0, length) + ellipsis;
        }
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of isValidCPF
   * @param cpf - The CPF string to validate
   * @param detailed - If true, returns a detailed validation result object
   * @returns Boolean indicating if the CPF is valid, or a detailed validation result
   */
  isValidCPF = (cpf: unknown, detailed = false): boolean | { valid: boolean; error?: string } => {
    const tracker = this.trackers.isValidCPF;
    tracker.callCount++;
    tracker.lastCall = [cpf, detailed];
    tracker.calls.push([cpf, detailed]);

    const config = this.config.isValidCPF;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in isValidCPF');
      }

      let result: boolean | { valid: boolean; error?: string };

      // Check for specific input mapping
      if (config?.inputOutputMap && typeof cpf === 'string' && cpf in config.inputOutputMap) {
        result = config.inputOutputMap[cpf];
      } else if (config?.implementation) {
        result = config.implementation(cpf, detailed);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation - simplified for testing purposes
        const isValid = typeof cpf === 'string' && 
                       cpf.replace(/\D/g, '').length === 11 && 
                       !/^(\d)\1+$/.test(cpf.replace(/\D/g, ''));
        
        result = detailed 
          ? { valid: isValid, ...(!isValid ? { error: 'Invalid CPF number' } : {}) }
          : isValid;
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of isValidCNPJ
   * @param cnpj - The CNPJ string to validate
   * @param detailed - If true, returns a detailed validation result object
   * @returns Boolean indicating if the CNPJ is valid, or a detailed validation result
   */
  isValidCNPJ = (cnpj: unknown, detailed = false): boolean | { valid: boolean; error?: string } => {
    const tracker = this.trackers.isValidCNPJ;
    tracker.callCount++;
    tracker.lastCall = [cnpj, detailed];
    tracker.calls.push([cnpj, detailed]);

    const config = this.config.isValidCNPJ;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in isValidCNPJ');
      }

      let result: boolean | { valid: boolean; error?: string };

      // Check for specific input mapping
      if (config?.inputOutputMap && typeof cnpj === 'string' && cnpj in config.inputOutputMap) {
        result = config.inputOutputMap[cnpj];
      } else if (config?.implementation) {
        result = config.implementation(cnpj, detailed);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation - simplified for testing purposes
        const isValid = typeof cnpj === 'string' && 
                       cnpj.replace(/\D/g, '').length === 14 && 
                       !/^(\d)\1+$/.test(cnpj.replace(/\D/g, ''));
        
        result = detailed 
          ? { valid: isValid, ...(!isValid ? { error: 'Invalid CNPJ number' } : {}) }
          : isValid;
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of isValidCEP
   * @param cep - The CEP string to validate
   * @param detailed - If true, returns a detailed validation result object
   * @returns Boolean indicating if the CEP is valid, or a detailed validation result
   */
  isValidCEP = (cep: unknown, detailed = false): boolean | { valid: boolean; error?: string } => {
    const tracker = this.trackers.isValidCEP;
    tracker.callCount++;
    tracker.lastCall = [cep, detailed];
    tracker.calls.push([cep, detailed]);

    const config = this.config.isValidCEP;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in isValidCEP');
      }

      let result: boolean | { valid: boolean; error?: string };

      // Check for specific input mapping
      if (config?.inputOutputMap && typeof cep === 'string' && cep in config.inputOutputMap) {
        result = config.inputOutputMap[cep];
      } else if (config?.implementation) {
        result = config.implementation(cep, detailed);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation - simplified for testing purposes
        const isValid = typeof cep === 'string' && 
                       cep.replace(/\D/g, '').length === 8;
        
        result = detailed 
          ? { valid: isValid, ...(!isValid ? { error: 'Invalid CEP format' } : {}) }
          : isValid;
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of isValidBrazilianPhone
   * @param phone - The phone number string to validate
   * @param detailed - If true, returns a detailed validation result object
   * @returns Boolean indicating if the phone number is valid, or a detailed validation result
   */
  isValidBrazilianPhone = (phone: unknown, detailed = false): boolean | { valid: boolean; error?: string } => {
    const tracker = this.trackers.isValidBrazilianPhone;
    tracker.callCount++;
    tracker.lastCall = [phone, detailed];
    tracker.calls.push([phone, detailed]);

    const config = this.config.isValidBrazilianPhone;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in isValidBrazilianPhone');
      }

      let result: boolean | { valid: boolean; error?: string };

      // Check for specific input mapping
      if (config?.inputOutputMap && typeof phone === 'string' && phone in config.inputOutputMap) {
        result = config.inputOutputMap[phone];
      } else if (config?.implementation) {
        result = config.implementation(phone, detailed);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation - simplified for testing purposes
        const cleanPhone = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
        const isValid = (
          // Without country code: 10 digits (landline) or 11 digits (mobile)
          (cleanPhone.length === 10 || cleanPhone.length === 11) ||
          // With country code: 12 digits (landline with 55) or 13 digits (mobile with 55)
          (cleanPhone.length === 12 && cleanPhone.startsWith('55')) ||
          (cleanPhone.length === 13 && cleanPhone.startsWith('55'))
        );
        
        result = detailed 
          ? { valid: isValid, ...(!isValid ? { error: 'Invalid phone number format' } : {}) }
          : isValid;
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of formatCPF
   * @param cpf - The CPF string to format
   * @returns The formatted CPF string
   */
  formatCPF = (cpf: string): string => {
    const tracker = this.trackers.formatCPF;
    tracker.callCount++;
    tracker.lastCall = [cpf];
    tracker.calls.push([cpf]);

    const config = this.config.formatCPF;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in formatCPF');
      }

      let result: string;

      // Check for specific input mapping
      if (config?.inputOutputMap && cpf in config.inputOutputMap) {
        result = config.inputOutputMap[cpf];
      } else if (config?.implementation) {
        result = config.implementation(cpf);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation
        if (typeof cpf !== 'string') {
          result = '';
        } else {
          const digits = cpf.replace(/\D/g, '');
          if (digits.length !== 11) {
            result = cpf; // Return original if not valid
          } else {
            result = digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
          }
        }
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of formatCNPJ
   * @param cnpj - The CNPJ string to format
   * @returns The formatted CNPJ string
   */
  formatCNPJ = (cnpj: string): string => {
    const tracker = this.trackers.formatCNPJ;
    tracker.callCount++;
    tracker.lastCall = [cnpj];
    tracker.calls.push([cnpj]);

    const config = this.config.formatCNPJ;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in formatCNPJ');
      }

      let result: string;

      // Check for specific input mapping
      if (config?.inputOutputMap && cnpj in config.inputOutputMap) {
        result = config.inputOutputMap[cnpj];
      } else if (config?.implementation) {
        result = config.implementation(cnpj);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation
        if (typeof cnpj !== 'string') {
          result = '';
        } else {
          const digits = cnpj.replace(/\D/g, '');
          if (digits.length !== 14) {
            result = cnpj; // Return original if not valid
          } else {
            result = digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
          }
        }
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Mock implementation of formatCEP
   * @param cep - The CEP string to format
   * @returns The formatted CEP string
   */
  formatCEP = (cep: string): string => {
    const tracker = this.trackers.formatCEP;
    tracker.callCount++;
    tracker.lastCall = [cep];
    tracker.calls.push([cep]);

    const config = this.config.formatCEP;

    try {
      if (config?.shouldThrow) {
        throw config.errorToThrow || new Error('Mock error in formatCEP');
      }

      let result: string;

      // Check for specific input mapping
      if (config?.inputOutputMap && cep in config.inputOutputMap) {
        result = config.inputOutputMap[cep];
      } else if (config?.implementation) {
        result = config.implementation(cep);
      } else if (config?.returnValue !== undefined) {
        result = config.returnValue;
      } else {
        // Default implementation
        if (typeof cep !== 'string') {
          result = '';
        } else {
          const digits = cep.replace(/\D/g, '');
          if (digits.length !== 8) {
            result = cep; // Return original if not valid
          } else {
            result = digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
          }
        }
      }

      tracker.lastReturn = result;
      tracker.returns.push(result);
      return result;
    } catch (error) {
      tracker.lastReturn = error;
      tracker.returns.push(error);
      throw error;
    }
  };

  /**
   * Creates a pre-configured instance with journey-specific validation rules
   * @param journey - The journey to configure for ('health', 'care', or 'plan')
   * @returns A new StringMock instance configured for the specified journey
   */
  static forJourney(journey: 'health' | 'care' | 'plan'): StringMock {
    const config: StringMockConfig = {};
    
    switch (journey) {
      case 'health':
        // Health journey has stricter CPF validation for medical records
        config.isValidCPF = {
          implementation: (cpf: unknown, detailed = false) => {
            if (typeof cpf !== 'string') {
              return detailed ? { valid: false, error: 'Input must be a string' } : false;
            }
            
            // Health journey requires properly formatted CPF with dots and dash
            const hasCorrectFormat = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
            if (!hasCorrectFormat) {
              return detailed ? { valid: false, error: 'CPF must be in format XXX.XXX.XXX-XX' } : false;
            }
            
            // Simplified validation for testing
            const cleanCPF = cpf.replace(/\D/g, '');
            const isValid = cleanCPF.length === 11 && !/^(\d)\1+$/.test(cleanCPF);
            
            return detailed 
              ? { valid: isValid, ...(!isValid ? { error: 'Invalid CPF number' } : {}) }
              : isValid;
          }
        };
        break;
        
      case 'care':
        // Care journey needs special phone validation for appointment reminders
        config.isValidBrazilianPhone = {
          implementation: (phone: unknown, detailed = false) => {
            if (typeof phone !== 'string') {
              return detailed ? { valid: false, error: 'Input must be a string' } : false;
            }
            
            // Care journey requires mobile numbers (11 digits) for SMS notifications
            const cleanPhone = phone.replace(/\D/g, '');
            const isMobile = cleanPhone.length === 11 || (cleanPhone.length === 13 && cleanPhone.startsWith('55'));
            
            if (!isMobile) {
              return detailed ? { valid: false, error: 'Care journey requires a mobile number' } : false;
            }
            
            return detailed ? { valid: true } : true;
          }
        };
        break;
        
      case 'plan':
        // Plan journey needs both CPF and CNPJ validation for insurance plans
        config.isValidCPF = {
          implementation: (cpf: unknown, detailed = false) => {
            // Standard CPF validation is sufficient for plan journey
            if (typeof cpf !== 'string') {
              return detailed ? { valid: false, error: 'Input must be a string' } : false;
            }
            
            const cleanCPF = cpf.replace(/\D/g, '');
            const isValid = cleanCPF.length === 11 && !/^(\d)\1+$/.test(cleanCPF);
            
            return detailed 
              ? { valid: isValid, ...(!isValid ? { error: 'Invalid CPF number' } : {}) }
              : isValid;
          }
        };
        
        config.isValidCNPJ = {
          implementation: (cnpj: unknown, detailed = false) => {
            // Plan journey has special CNPJ validation for corporate plans
            if (typeof cnpj !== 'string') {
              return detailed ? { valid: false, error: 'Input must be a string' } : false;
            }
            
            const cleanCNPJ = cnpj.replace(/\D/g, '');
            const isValid = cleanCNPJ.length === 14 && !/^(\d)\1+$/.test(cleanCNPJ);
            
            return detailed 
              ? { valid: isValid, ...(!isValid ? { error: 'Invalid CNPJ number' } : {}) }
              : isValid;
          }
        };
        break;
    }
    
    return new StringMock(config);
  }
}

/**
 * Default export for easier importing
 */
export default StringMock;

/**
 * Example usage:
 * 
 * ```typescript
 * import StringMock from '@austa/utils/test/mocks/string-mock';
 * 
 * // Create a mock with default behavior
 * const stringMock = new StringMock();
 * 
 * // Configure specific behavior
 * stringMock.configure({
 *   isValidCPF: {
 *     returnValue: true // Always return true for isValidCPF
 *   },
 *   capitalizeFirstLetter: {
 *     implementation: (str) => str ? str.toUpperCase() : '' // Custom implementation
 *   }
 * });
 * 
 * // Use the mock in tests
 * const result = stringMock.isValidCPF('123.456.789-09');
 * console.log(result); // true
 * 
 * // Check call tracking
 * console.log(stringMock.getTracker('isValidCPF').callCount); // 1
 * console.log(stringMock.getTracker('isValidCPF').lastCall); // ['123.456.789-09']
 * 
 * // Create a journey-specific mock
 * const healthMock = StringMock.forJourney('health');
 * ```
 */