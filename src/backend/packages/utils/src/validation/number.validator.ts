/**
 * Number Validation Utilities
 * 
 * This module provides comprehensive number validation utilities for ensuring numeric integrity
 * across all backend services. It includes validation for ranges, integers, positive/negative numbers,
 * Brazilian Real currency, and statistical ranges.
 * 
 * @module number.validator
 */

/**
 * Options for number validation with customizable boundaries
 */
export interface NumberRangeOptions {
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Whether to include the minimum value in the valid range (default: true) */
  inclusiveMin?: boolean;
  /** Whether to include the maximum value in the valid range (default: true) */
  inclusiveMax?: boolean;
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Custom error message to use when validation fails */
  errorMessage?: string;
  /** Whether to allow null values (treats null as valid) */
  allowNull?: boolean;
  /** Whether to allow undefined values (treats undefined as valid) */
  allowUndefined?: boolean;
}

/**
 * Options for integer validation
 */
export interface IntegerValidationOptions {
  /** Precision to use for floating point comparisons to handle floating-point errors */
  precision?: number;
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Custom error message to use when validation fails */
  errorMessage?: string;
  /** Whether to allow null values (treats null as valid) */
  allowNull?: boolean;
  /** Whether to allow undefined values (treats undefined as valid) */
  allowUndefined?: boolean;
}

/**
 * Options for positive/negative number validation
 */
export interface SignedNumberOptions {
  /** Whether to consider zero as positive (default: false) */
  zeroIsPositive?: boolean;
  /** Whether to consider zero as negative (default: false) */
  zeroIsNegative?: boolean;
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Custom error message to use when validation fails */
  errorMessage?: string;
  /** Whether to allow null values (treats null as valid) */
  allowNull?: boolean;
  /** Whether to allow undefined values (treats undefined as valid) */
  allowUndefined?: boolean;
}

/**
 * Options for Brazilian Real currency validation
 */
export interface BRLValidationOptions {
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Whether to allow negative values (default: false) */
  allowNegative?: boolean;
  /** Whether to validate the format of the string representation */
  validateFormat?: boolean;
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Custom error message to use when validation fails */
  errorMessage?: string;
  /** Whether to allow null values (treats null as valid) */
  allowNull?: boolean;
  /** Whether to allow undefined values (treats undefined as valid) */
  allowUndefined?: boolean;
}

/**
 * Options for statistical range validation
 */
export interface StatisticalRangeOptions {
  /** Array of values to calculate statistics from */
  dataSet: number[];
  /** Number of standard deviations for the range (default: 2) */
  standardDeviations?: number;
  /** Percentile range (e.g., [25, 75] for interquartile range) */
  percentileRange?: [number, number];
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Custom error message to use when validation fails */
  errorMessage?: string;
  /** Whether to allow null values (treats null as valid) */
  allowNull?: boolean;
  /** Whether to allow undefined values (treats undefined as valid) */
  allowUndefined?: boolean;
}

/**
 * Result of a validation operation that includes detailed information
 */
export interface NumberValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  message?: string;
  /** Additional validation details */
  details?: Record<string, any>;
  /** Original value that was validated */
  value: any;
}

/**
 * Validates if a value is a number
 * 
 * @param value - The value to validate
 * @returns True if the value is a valid number, false otherwise
 */
export const isNumber = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  // Check if it's a number type or a string that can be converted to a number
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  if (typeof value === 'string') {
    // Remove common formatting characters for numbers
    const cleanValue = value.replace(/[\s,.]/g, '');
    return !isNaN(Number(cleanValue)) && isFinite(Number(cleanValue));
  }
  
  return false;
};

/**
 * Validates if a value is a valid number within specified range
 * 
 * @param value - The number to validate
 * @param options - Options for range validation
 * @returns True if the number is valid and within range, false otherwise
 * 
 * @example
 * // Check if value is between 0 and 100 (inclusive)
 * isValidNumber(42, { min: 0, max: 100 });
 * 
 * // Check if value is between 0 (inclusive) and 100 (exclusive)
 * isValidNumber(42, { min: 0, max: 100, inclusiveMax: false });
 */
export const isValidNumber = (value: any, options: NumberRangeOptions = {}): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid number
  if (!isNumber(value)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // Check minimum value if specified
  if (options.min !== undefined) {
    const minCheck = options.inclusiveMin !== false ? numValue >= options.min : numValue > options.min;
    if (!minCheck) {
      if (options.throwOnError) {
        throw new Error(
          options.errorMessage || 
          `Value ${numValue} is ${options.inclusiveMin !== false ? 'less than' : 'less than or equal to'} minimum allowed value ${options.min}`
        );
      }
      return false;
    }
  }
  
  // Check maximum value if specified
  if (options.max !== undefined) {
    const maxCheck = options.inclusiveMax !== false ? numValue <= options.max : numValue < options.max;
    if (!maxCheck) {
      if (options.throwOnError) {
        throw new Error(
          options.errorMessage || 
          `Value ${numValue} is ${options.inclusiveMax !== false ? 'greater than' : 'greater than or equal to'} maximum allowed value ${options.max}`
        );
      }
      return false;
    }
  }
  
  return true;
};

/**
 * Validates if a value is an integer
 * 
 * @param value - The value to validate
 * @param options - Options for integer validation
 * @returns True if the value is a valid integer, false otherwise
 * 
 * @example
 * // Basic integer check
 * isInteger(42); // true
 * isInteger(42.5); // false
 * 
 * // With precision to handle floating-point errors
 * isInteger(42.0000000001, { precision: 10 }); // true
 */
export const isInteger = (value: any, options: IntegerValidationOptions = {}): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid number first
  if (!isNumber(value)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // If precision is specified, round to that precision before checking
  if (options.precision !== undefined) {
    const multiplier = Math.pow(10, options.precision);
    const rounded = Math.round(numValue * multiplier) / multiplier;
    const isInt = Number.isInteger(rounded);
    
    if (!isInt && options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not an integer: ${value}`);
    }
    
    return isInt;
  }
  
  // Standard integer check
  const isInt = Number.isInteger(numValue);
  
  if (!isInt && options.throwOnError) {
    throw new Error(options.errorMessage || `Value is not an integer: ${value}`);
  }
  
  return isInt;
};

/**
 * Validates if a value is a positive number
 * 
 * @param value - The value to validate
 * @param options - Options for positive number validation
 * @returns True if the value is a positive number, false otherwise
 * 
 * @example
 * // Basic positive check (zero is not positive)
 * isPositive(42); // true
 * isPositive(0); // false
 * isPositive(-42); // false
 * 
 * // Consider zero as positive
 * isPositive(0, { zeroIsPositive: true }); // true
 */
export const isPositive = (value: any, options: SignedNumberOptions = {}): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid number first
  if (!isNumber(value)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // Check if it's positive based on options
  const isPositiveValue = options.zeroIsPositive === true ? numValue >= 0 : numValue > 0;
  
  if (!isPositiveValue && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Value ${numValue} is not a positive number${options.zeroIsPositive === true ? ' (zero is considered positive)' : ''}`
    );
  }
  
  return isPositiveValue;
};

/**
 * Validates if a value is a negative number
 * 
 * @param value - The value to validate
 * @param options - Options for negative number validation
 * @returns True if the value is a negative number, false otherwise
 * 
 * @example
 * // Basic negative check (zero is not negative)
 * isNegative(-42); // true
 * isNegative(0); // false
 * isNegative(42); // false
 * 
 * // Consider zero as negative
 * isNegative(0, { zeroIsNegative: true }); // true
 */
export const isNegative = (value: any, options: SignedNumberOptions = {}): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid number first
  if (!isNumber(value)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // Check if it's negative based on options
  const isNegativeValue = options.zeroIsNegative === true ? numValue <= 0 : numValue < 0;
  
  if (!isNegativeValue && options.throwOnError) {
    throw new Error(
      options.errorMessage || 
      `Value ${numValue} is not a negative number${options.zeroIsNegative === true ? ' (zero is considered negative)' : ''}`
    );
  }
  
  return isNegativeValue;
};

/**
 * Validates if a value is zero
 * 
 * @param value - The value to validate
 * @param options - Options for validation with precision handling
 * @returns True if the value is zero, false otherwise
 * 
 * @example
 * // Basic zero check
 * isZero(0); // true
 * isZero(0.00); // true
 * isZero(42); // false
 * 
 * // With precision to handle floating-point errors
 * isZero(0.0000000001, { precision: 10 }); // true
 */
export const isZero = (value: any, options: IntegerValidationOptions = {}): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid number first
  if (!isNumber(value)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // If precision is specified, use it for comparison
  if (options.precision !== undefined) {
    const epsilon = Math.pow(10, -options.precision);
    const isZeroValue = Math.abs(numValue) < epsilon;
    
    if (!isZeroValue && options.throwOnError) {
      throw new Error(options.errorMessage || `Value ${numValue} is not zero (within precision ${options.precision})`);
    }
    
    return isZeroValue;
  }
  
  // Standard zero check
  const isZeroValue = numValue === 0;
  
  if (!isZeroValue && options.throwOnError) {
    throw new Error(options.errorMessage || `Value ${numValue} is not zero`);
  }
  
  return isZeroValue;
};

/**
 * Validates if a value is a valid Brazilian Real (BRL) currency amount
 * 
 * @param value - The value to validate (number or string in BRL format)
 * @param options - Options for BRL validation
 * @returns True if the value is a valid BRL amount, false otherwise
 * 
 * @example
 * // Validate numeric value
 * isValidBRL(42.50); // true
 * 
 * // Validate formatted string
 * isValidBRL('R$ 42,50'); // true
 * 
 * // With range validation
 * isValidBRL(42.50, { min: 10, max: 100 }); // true
 */
export const isValidBRL = (value: any, options: BRLValidationOptions = {}): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // If it's a string, validate format and extract numeric value
  let numValue: number;
  
  if (typeof value === 'string') {
    // Check format if required
    if (options.validateFormat === true) {
      // BRL format: R$ followed by digits, with comma as decimal separator
      // Examples: R$ 42,50 | R$ 1.042,50 | R$ 1.042.123,50
      const brlRegex = /^R\$\s?([0-9]{1,3}(\.?[0-9]{3})*)(,[0-9]{2})?$/;
      
      if (!brlRegex.test(value.trim())) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Value is not in valid BRL format: ${value}`);
        }
        return false;
      }
    }
    
    // Extract numeric value from string
    // Remove 'R$', spaces, and replace comma with dot for decimal point
    const cleanValue = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
    numValue = Number(cleanValue);
    
    if (isNaN(numValue) || !isFinite(numValue)) {
      if (options.throwOnError) {
        throw new Error(options.errorMessage || `Value cannot be converted to a valid number: ${value}`);
      }
      return false;
    }
  } else if (typeof value === 'number') {
    // If it's already a number, use it directly
    numValue = value;
    
    if (isNaN(numValue) || !isFinite(numValue)) {
      if (options.throwOnError) {
        throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
      }
      return false;
    }
  } else {
    // Not a string or number
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid BRL amount: ${value}`);
    }
    return false;
  }
  
  // Check if negative values are allowed
  if (numValue < 0 && options.allowNegative !== true) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Negative values are not allowed: ${value}`);
    }
    return false;
  }
  
  // Check minimum value if specified
  if (options.min !== undefined && numValue < options.min) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value ${numValue} is less than minimum allowed value ${options.min}`);
    }
    return false;
  }
  
  // Check maximum value if specified
  if (options.max !== undefined && numValue > options.max) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value ${numValue} is greater than maximum allowed value ${options.max}`);
    }
    return false;
  }
  
  return true;
};

/**
 * Formats a number as Brazilian Real (BRL) currency
 * 
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted BRL string or empty string if invalid
 * 
 * @example
 * // Basic formatting
 * formatBRL(42.5); // 'R$ 42,50'
 * formatBRL(1042.5); // 'R$ 1.042,50'
 * 
 * // Without currency symbol
 * formatBRL(42.5, { includeCurrencySymbol: false }); // '42,50'
 */
export const formatBRL = (value: number | string, options: { includeCurrencySymbol?: boolean } = {}): string => {
  // Default options
  const includeCurrencySymbol = options.includeCurrencySymbol !== false;
  
  // Convert to number if it's a string
  let numValue: number;
  if (typeof value === 'string') {
    // Remove 'R$', spaces, and replace comma with dot for decimal point
    const cleanValue = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
    numValue = Number(cleanValue);
  } else {
    numValue = value;
  }
  
  // Check if it's a valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return '';
  }
  
  // Format the number using Intl.NumberFormat
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const formatted = formatter.format(numValue);
  
  // Remove currency symbol if not required
  if (!includeCurrencySymbol) {
    return formatted.replace(/R\$\s?/g, '');
  }
  
  return formatted;
};

/**
 * Calculates the mean (average) of an array of numbers
 * 
 * @param values - Array of numbers
 * @returns The mean value or NaN if the array is empty
 */
export const calculateMean = (values: number[]): number => {
  if (!values || values.length === 0) {
    return NaN;
  }
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculates the standard deviation of an array of numbers
 * 
 * @param values - Array of numbers
 * @param population - Whether to calculate population (true) or sample (false) standard deviation
 * @returns The standard deviation or NaN if the array has fewer than 2 elements
 */
export const calculateStandardDeviation = (values: number[], population = false): number => {
  if (!values || values.length < 2) {
    return NaN;
  }
  
  const mean = calculateMean(values);
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const sumSquaredDiff = squaredDifferences.reduce((acc, val) => acc + val, 0);
  
  // Population standard deviation uses n, sample uses (n-1)
  const divisor = population ? values.length : values.length - 1;
  
  return Math.sqrt(sumSquaredDiff / divisor);
};

/**
 * Calculates the percentile value from an array of numbers
 * 
 * @param values - Array of numbers
 * @param percentile - The percentile to calculate (0-100)
 * @returns The percentile value or NaN if the array is empty
 */
export const calculatePercentile = (values: number[], percentile: number): number => {
  if (!values || values.length === 0 || percentile < 0 || percentile > 100) {
    return NaN;
  }
  
  // Sort the array
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate the index
  const index = (percentile / 100) * (sortedValues.length - 1);
  
  // If index is an integer, return the value at that index
  if (Number.isInteger(index)) {
    return sortedValues[index];
  }
  
  // Otherwise, interpolate between the two nearest values
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const weight = index - lowerIndex;
  
  return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
};

/**
 * Validates if a value is within a statistical range of a dataset
 * 
 * @param value - The value to validate
 * @param options - Options for statistical range validation
 * @returns True if the value is within the statistical range, false otherwise
 * 
 * @example
 * // Check if value is within 2 standard deviations of the mean
 * const dataSet = [10, 12, 15, 18, 20, 22, 25, 28, 30];
 * isWithinStatisticalRange(21, { dataSet, standardDeviations: 2 }); // true
 * 
 * // Check if value is within interquartile range (25th to 75th percentile)
 * isWithinStatisticalRange(21, { dataSet, percentileRange: [25, 75] }); // true
 */
export const isWithinStatisticalRange = (value: any, options: StatisticalRangeOptions): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid number first
  if (!isNumber(value)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // Check if dataset is valid
  if (!options.dataSet || !Array.isArray(options.dataSet) || options.dataSet.length === 0) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || 'Invalid or empty dataset provided');
    }
    return false;
  }
  
  // Standard deviation based range check
  if (options.standardDeviations !== undefined) {
    const mean = calculateMean(options.dataSet);
    const stdDev = calculateStandardDeviation(options.dataSet, true); // Use population std dev
    
    const lowerBound = mean - (options.standardDeviations * stdDev);
    const upperBound = mean + (options.standardDeviations * stdDev);
    
    const isWithinRange = numValue >= lowerBound && numValue <= upperBound;
    
    if (!isWithinRange && options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Value ${numValue} is outside the range of ${options.standardDeviations} standard deviations from the mean (${lowerBound.toFixed(2)} to ${upperBound.toFixed(2)})`
      );
    }
    
    return isWithinRange;
  }
  
  // Percentile based range check
  if (options.percentileRange !== undefined) {
    const [lowerPercentile, upperPercentile] = options.percentileRange;
    
    if (lowerPercentile >= upperPercentile || lowerPercentile < 0 || upperPercentile > 100) {
      if (options.throwOnError) {
        throw new Error(options.errorMessage || `Invalid percentile range: [${lowerPercentile}, ${upperPercentile}]`);
      }
      return false;
    }
    
    const lowerBound = calculatePercentile(options.dataSet, lowerPercentile);
    const upperBound = calculatePercentile(options.dataSet, upperPercentile);
    
    const isWithinRange = numValue >= lowerBound && numValue <= upperBound;
    
    if (!isWithinRange && options.throwOnError) {
      throw new Error(
        options.errorMessage || 
        `Value ${numValue} is outside the ${lowerPercentile}th to ${upperPercentile}th percentile range (${lowerBound.toFixed(2)} to ${upperBound.toFixed(2)})`
      );
    }
    
    return isWithinRange;
  }
  
  // If neither standard deviation nor percentile range is specified, consider it valid
  return true;
};

/**
 * Validates if a value is within a specified number of standard deviations from the mean
 * 
 * @param value - The value to validate
 * @param dataSet - Array of numbers to calculate mean and standard deviation
 * @param standardDeviations - Number of standard deviations for the range (default: 2)
 * @param options - Additional validation options
 * @returns True if the value is within the specified standard deviations, false otherwise
 * 
 * @example
 * const dataSet = [10, 12, 15, 18, 20, 22, 25, 28, 30];
 * isWithinStandardDeviations(21, dataSet, 2); // true
 */
export const isWithinStandardDeviations = (
  value: any,
  dataSet: number[],
  standardDeviations = 2,
  options: { throwOnError?: boolean; errorMessage?: string; allowNull?: boolean; allowUndefined?: boolean } = {}
): boolean => {
  return isWithinStatisticalRange(value, {
    dataSet,
    standardDeviations,
    throwOnError: options.throwOnError,
    errorMessage: options.errorMessage,
    allowNull: options.allowNull,
    allowUndefined: options.allowUndefined
  });
};

/**
 * Validates if a value is within a specified percentile range
 * 
 * @param value - The value to validate
 * @param dataSet - Array of numbers to calculate percentiles
 * @param percentileRange - Percentile range (e.g., [25, 75] for interquartile range)
 * @param options - Additional validation options
 * @returns True if the value is within the specified percentile range, false otherwise
 * 
 * @example
 * const dataSet = [10, 12, 15, 18, 20, 22, 25, 28, 30];
 * isWithinPercentileRange(21, dataSet, [25, 75]); // true
 */
export const isWithinPercentileRange = (
  value: any,
  dataSet: number[],
  percentileRange: [number, number],
  options: { throwOnError?: boolean; errorMessage?: string; allowNull?: boolean; allowUndefined?: boolean } = {}
): boolean => {
  return isWithinStatisticalRange(value, {
    dataSet,
    percentileRange,
    throwOnError: options.throwOnError,
    errorMessage: options.errorMessage,
    allowNull: options.allowNull,
    allowUndefined: options.allowUndefined
  });
};

/**
 * Validates if a value is a valid number and returns a detailed validation result
 * 
 * @param value - The value to validate
 * @param options - Options for number validation
 * @returns Detailed validation result
 * 
 * @example
 * const result = validateNumber(42, { min: 0, max: 100 });
 * if (result.valid) {
 *   // Use the validated number
 * } else {
 *   console.error(result.message);
 * }
 */
export const validateNumber = (value: any, options: NumberRangeOptions = {}): NumberValidationResult => {
  // Handle null and undefined based on options
  if (value === null) {
    return {
      valid: options.allowNull === true,
      message: options.allowNull === true ? undefined : 'Value is null',
      value
    };
  }
  
  if (value === undefined) {
    return {
      valid: options.allowUndefined === true,
      message: options.allowUndefined === true ? undefined : 'Value is undefined',
      value
    };
  }
  
  // Check if it's a valid number
  if (!isNumber(value)) {
    return {
      valid: false,
      message: options.errorMessage || `Value is not a valid number: ${value}`,
      value
    };
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // Check minimum value if specified
  if (options.min !== undefined) {
    const minCheck = options.inclusiveMin !== false ? numValue >= options.min : numValue > options.min;
    if (!minCheck) {
      return {
        valid: false,
        message: options.errorMessage || 
          `Value ${numValue} is ${options.inclusiveMin !== false ? 'less than' : 'less than or equal to'} minimum allowed value ${options.min}`,
        details: {
          min: options.min,
          inclusiveMin: options.inclusiveMin !== false,
          value: numValue
        },
        value
      };
    }
  }
  
  // Check maximum value if specified
  if (options.max !== undefined) {
    const maxCheck = options.inclusiveMax !== false ? numValue <= options.max : numValue < options.max;
    if (!maxCheck) {
      return {
        valid: false,
        message: options.errorMessage || 
          `Value ${numValue} is ${options.inclusiveMax !== false ? 'greater than' : 'greater than or equal to'} maximum allowed value ${options.max}`,
        details: {
          max: options.max,
          inclusiveMax: options.inclusiveMax !== false,
          value: numValue
        },
        value
      };
    }
  }
  
  // All checks passed
  return {
    valid: true,
    details: {
      value: numValue,
      ...(options.min !== undefined && { min: options.min }),
      ...(options.max !== undefined && { max: options.max })
    },
    value
  };
};

/**
 * Validates if a value is a valid Brazilian Real (BRL) currency amount and returns a detailed validation result
 * 
 * @param value - The value to validate
 * @param options - Options for BRL validation
 * @returns Detailed validation result
 * 
 * @example
 * const result = validateBRL('R$ 42,50', { min: 10, max: 100 });
 * if (result.valid) {
 *   // Use the validated amount
 *   const amount = result.details.value;
 * } else {
 *   console.error(result.message);
 * }
 */
export const validateBRL = (value: any, options: BRLValidationOptions = {}): NumberValidationResult => {
  // Handle null and undefined based on options
  if (value === null) {
    return {
      valid: options.allowNull === true,
      message: options.allowNull === true ? undefined : 'Value is null',
      value
    };
  }
  
  if (value === undefined) {
    return {
      valid: options.allowUndefined === true,
      message: options.allowUndefined === true ? undefined : 'Value is undefined',
      value
    };
  }
  
  // If it's a string, validate format and extract numeric value
  let numValue: number;
  let formattedValue: string;
  
  if (typeof value === 'string') {
    // Check format if required
    if (options.validateFormat === true) {
      // BRL format: R$ followed by digits, with comma as decimal separator
      // Examples: R$ 42,50 | R$ 1.042,50 | R$ 1.042.123,50
      const brlRegex = /^R\$\s?([0-9]{1,3}(\.?[0-9]{3})*)(,[0-9]{2})?$/;
      
      if (!brlRegex.test(value.trim())) {
        return {
          valid: false,
          message: options.errorMessage || `Value is not in valid BRL format: ${value}`,
          value
        };
      }
    }
    
    // Extract numeric value from string
    // Remove 'R$', spaces, and replace comma with dot for decimal point
    const cleanValue = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
    numValue = Number(cleanValue);
    formattedValue = value;
    
    if (isNaN(numValue) || !isFinite(numValue)) {
      return {
        valid: false,
        message: options.errorMessage || `Value cannot be converted to a valid number: ${value}`,
        value
      };
    }
  } else if (typeof value === 'number') {
    // If it's already a number, use it directly
    numValue = value;
    formattedValue = formatBRL(value);
    
    if (isNaN(numValue) || !isFinite(numValue)) {
      return {
        valid: false,
        message: options.errorMessage || `Value is not a valid number: ${value}`,
        value
      };
    }
  } else {
    // Not a string or number
    return {
      valid: false,
      message: options.errorMessage || `Value is not a valid BRL amount: ${value}`,
      value
    };
  }
  
  // Check if negative values are allowed
  if (numValue < 0 && options.allowNegative !== true) {
    return {
      valid: false,
      message: options.errorMessage || `Negative values are not allowed: ${value}`,
      details: {
        value: numValue,
        formatted: formattedValue,
        allowNegative: false
      },
      value
    };
  }
  
  // Check minimum value if specified
  if (options.min !== undefined && numValue < options.min) {
    return {
      valid: false,
      message: options.errorMessage || `Value ${numValue} is less than minimum allowed value ${options.min}`,
      details: {
        value: numValue,
        formatted: formattedValue,
        min: options.min
      },
      value
    };
  }
  
  // Check maximum value if specified
  if (options.max !== undefined && numValue > options.max) {
    return {
      valid: false,
      message: options.errorMessage || `Value ${numValue} is greater than maximum allowed value ${options.max}`,
      details: {
        value: numValue,
        formatted: formattedValue,
        max: options.max
      },
      value
    };
  }
  
  // All checks passed
  return {
    valid: true,
    details: {
      value: numValue,
      formatted: formattedValue,
      ...(options.min !== undefined && { min: options.min }),
      ...(options.max !== undefined && { max: options.max })
    },
    value
  };
};

/**
 * Journey-specific number validation for health metrics
 * 
 * @param value - The value to validate
 * @param metricType - Type of health metric (e.g., 'weight', 'blood_pressure', 'heart_rate')
 * @param options - Additional validation options
 * @returns True if the value is valid for the specified metric type, false otherwise
 * 
 * @example
 * // Validate weight in kilograms
 * isValidHealthMetric(75.5, 'weight'); // true
 * 
 * // Validate heart rate
 * isValidHealthMetric(72, 'heart_rate'); // true
 */
export const isValidHealthMetric = (
  value: any,
  metricType: string,
  options: { throwOnError?: boolean; errorMessage?: string; allowNull?: boolean; allowUndefined?: boolean } = {}
): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid number first
  if (!isNumber(value)) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid number: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? Number(value.replace(/[\s,.]/g, '')) : value;
  
  // Metric-specific validation
  switch (metricType.toLowerCase()) {
    case 'weight': // Weight in kilograms
      if (numValue <= 0 || numValue > 500) { // Maximum human weight record is ~450kg
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Weight value ${numValue} kg is outside valid range (0-500 kg)`);
        }
        return false;
      }
      break;
      
    case 'height': // Height in centimeters
      if (numValue <= 0 || numValue > 300) { // Maximum human height record is ~272cm
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Height value ${numValue} cm is outside valid range (0-300 cm)`);
        }
        return false;
      }
      break;
      
    case 'blood_pressure_systolic': // Systolic blood pressure in mmHg
      if (numValue < 40 || numValue > 300) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Systolic blood pressure ${numValue} mmHg is outside valid range (40-300 mmHg)`);
        }
        return false;
      }
      break;
      
    case 'blood_pressure_diastolic': // Diastolic blood pressure in mmHg
      if (numValue < 20 || numValue > 200) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Diastolic blood pressure ${numValue} mmHg is outside valid range (20-200 mmHg)`);
        }
        return false;
      }
      break;
      
    case 'heart_rate': // Heart rate in bpm
      if (numValue < 20 || numValue > 250) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Heart rate ${numValue} bpm is outside valid range (20-250 bpm)`);
        }
        return false;
      }
      break;
      
    case 'blood_glucose': // Blood glucose in mg/dL
      if (numValue < 20 || numValue > 600) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Blood glucose ${numValue} mg/dL is outside valid range (20-600 mg/dL)`);
        }
        return false;
      }
      break;
      
    case 'oxygen_saturation': // Oxygen saturation in percentage
      if (numValue < 50 || numValue > 100) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Oxygen saturation ${numValue}% is outside valid range (50-100%)`);
        }
        return false;
      }
      break;
      
    case 'temperature': // Body temperature in Celsius
      if (numValue < 30 || numValue > 45) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Body temperature ${numValue}°C is outside valid range (30-45°C)`);
        }
        return false;
      }
      break;
      
    case 'steps': // Step count
      if (!isInteger(numValue) || numValue < 0 || numValue > 100000) { // Max steps in a day is typically under 100,000
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Step count ${numValue} is outside valid range (0-100,000) or not an integer`);
        }
        return false;
      }
      break;
      
    case 'sleep_duration': // Sleep duration in minutes
      if (!isInteger(numValue) || numValue < 0 || numValue > 1440) { // Max 24 hours (1440 minutes)
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Sleep duration ${numValue} minutes is outside valid range (0-1440) or not an integer`);
        }
        return false;
      }
      break;
      
    default:
      // For unknown metric types, just check if it's positive
      if (numValue < 0) {
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Value ${numValue} for metric type ${metricType} cannot be negative`);
        }
        return false;
      }
  }
  
  return true;
};

/**
 * Journey-specific number validation for insurance claims
 * 
 * @param value - The value to validate
 * @param claimType - Type of insurance claim (e.g., 'medical', 'dental', 'pharmacy')
 * @param options - Additional validation options
 * @returns True if the value is valid for the specified claim type, false otherwise
 * 
 * @example
 * // Validate medical claim amount
 * isValidClaimAmount(1500.75, 'medical'); // true
 */
export const isValidClaimAmount = (
  value: any,
  claimType: string,
  options: { throwOnError?: boolean; errorMessage?: string; allowNull?: boolean; allowUndefined?: boolean } = {}
): boolean => {
  // Handle null and undefined based on options
  if (value === null) {
    return options.allowNull === true;
  }
  
  if (value === undefined) {
    return options.allowUndefined === true;
  }
  
  // Check if it's a valid BRL amount
  if (!isValidBRL(value, { allowNegative: false })) {
    if (options.throwOnError) {
      throw new Error(options.errorMessage || `Value is not a valid BRL amount: ${value}`);
    }
    return false;
  }
  
  // Convert to number if it's a string
  let numValue: number;
  if (typeof value === 'string') {
    // Extract numeric value from string
    // Remove 'R$', spaces, and replace comma with dot for decimal point
    const cleanValue = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
    numValue = Number(cleanValue);
  } else {
    numValue = value;
  }
  
  // Claim-specific validation
  switch (claimType.toLowerCase()) {
    case 'medical':
      // Medical claims typically have higher limits
      if (numValue <= 0 || numValue > 1000000) { // 1 million BRL upper limit
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Medical claim amount ${formatBRL(numValue)} is outside valid range (R$ 0,01 - R$ 1.000.000,00)`);
        }
        return false;
      }
      break;
      
    case 'dental':
      // Dental claims typically have lower limits
      if (numValue <= 0 || numValue > 50000) { // 50,000 BRL upper limit
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Dental claim amount ${formatBRL(numValue)} is outside valid range (R$ 0,01 - R$ 50.000,00)`);
        }
        return false;
      }
      break;
      
    case 'pharmacy':
      // Pharmacy claims typically have lower limits
      if (numValue <= 0 || numValue > 10000) { // 10,000 BRL upper limit
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Pharmacy claim amount ${formatBRL(numValue)} is outside valid range (R$ 0,01 - R$ 10.000,00)`);
        }
        return false;
      }
      break;
      
    case 'vision':
      // Vision claims typically have lower limits
      if (numValue <= 0 || numValue > 5000) { // 5,000 BRL upper limit
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Vision claim amount ${formatBRL(numValue)} is outside valid range (R$ 0,01 - R$ 5.000,00)`);
        }
        return false;
      }
      break;
      
    case 'therapy':
      // Therapy claims (physical, occupational, etc.)
      if (numValue <= 0 || numValue > 20000) { // 20,000 BRL upper limit
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Therapy claim amount ${formatBRL(numValue)} is outside valid range (R$ 0,01 - R$ 20.000,00)`);
        }
        return false;
      }
      break;
      
    default:
      // For unknown claim types, use a general limit
      if (numValue <= 0 || numValue > 100000) { // 100,000 BRL general upper limit
        if (options.throwOnError) {
          throw new Error(options.errorMessage || `Claim amount ${formatBRL(numValue)} for type ${claimType} is outside valid range (R$ 0,01 - R$ 100.000,00)`);
        }
        return false;
      }
  }
  
  return true;
};