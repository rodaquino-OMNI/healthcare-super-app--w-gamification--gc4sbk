/**
 * Number validation utilities for validating numeric values across all backend services.
 * Provides functions for range validation, integer validation, positive/negative number validation,
 * and Brazilian Real currency validation.
 * 
 * These validators help ensure consistent number handling throughout the application,
 * especially for financial transactions and health metrics.
 */

/**
 * Options for range validation
 */
export interface RangeValidationOptions {
  /** Minimum value for the range */
  min?: number;
  /** Maximum value for the range */
  max?: number;
  /** Whether the minimum value is inclusive (default: true) */
  minInclusive?: boolean;
  /** Whether the maximum value is inclusive (default: true) */
  maxInclusive?: boolean;
  /** Custom error message for validation failure */
  message?: string;
}

/**
 * Options for integer validation
 */
export interface IntegerValidationOptions {
  /** Whether to allow floating point numbers that are mathematically integers (e.g., 1.0) */
  allowFloatingPoint?: boolean;
  /** Epsilon value for floating point comparison (default: Number.EPSILON) */
  epsilon?: number;
  /** Custom error message for validation failure */
  message?: string;
}

/**
 * Options for positive/negative number validation
 */
export interface SignValidationOptions {
  /** Whether to allow zero (default: false) */
  allowZero?: boolean;
  /** Custom error message for validation failure */
  message?: string;
}

/**
 * Options for Brazilian Real currency validation
 */
export interface CurrencyValidationOptions {
  /** Minimum value allowed (default: 0) */
  min?: number;
  /** Maximum value allowed (default: no maximum) */
  max?: number;
  /** Whether to allow negative values (default: false) */
  allowNegative?: boolean;
  /** Number of decimal places to validate (default: 2) */
  decimalPlaces?: number;
  /** Custom error message for validation failure */
  message?: string;
}

/**
 * Options for statistical range validation
 */
export interface StatisticalRangeOptions {
  /** Reference values for percentile or standard deviation calculation */
  referenceValues: number[];
  /** Custom error message for validation failure */
  message?: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  message?: string;
}

/**
 * Validates if a number is within a specified range.
 * 
 * @param value - The number to validate
 * @param options - Range validation options
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value is between 1 and 10 (inclusive)
 * const result = isInRange(5, { min: 1, max: 10 });
 * 
 * @example
 * // Check if value is between 1 (exclusive) and 10 (inclusive)
 * const result = isInRange(5, { min: 1, max: 10, minInclusive: false });
 */
export function isInRange(value: number, options: RangeValidationOptions): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: options.message || 'Value must be a valid number'
    };
  }

  const {
    min,
    max,
    minInclusive = true,
    maxInclusive = true,
    message
  } = options;

  // Check minimum value if specified
  if (min !== undefined) {
    const minValid = minInclusive ? value >= min : value > min;
    if (!minValid) {
      return {
        valid: false,
        message: message || `Value must be ${minInclusive ? 'greater than or equal to' : 'greater than'} ${min}`
      };
    }
  }

  // Check maximum value if specified
  if (max !== undefined) {
    const maxValid = maxInclusive ? value <= max : value < max;
    if (!maxValid) {
      return {
        valid: false,
        message: message || `Value must be ${maxInclusive ? 'less than or equal to' : 'less than'} ${max}`
      };
    }
  }

  return { valid: true };
}

/**
 * Validates if a number is an integer, with options for handling floating point precision.
 * 
 * @param value - The number to validate
 * @param options - Integer validation options
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value is an integer
 * const result = isInteger(5);
 * 
 * @example
 * // Check if value is mathematically an integer (allows 5.0)
 * const result = isInteger(5.0, { allowFloatingPoint: true });
 */
export function isInteger(value: number, options: IntegerValidationOptions = {}): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: options.message || 'Value must be a valid number'
    };
  }

  const {
    allowFloatingPoint = true,
    epsilon = Number.EPSILON,
    message
  } = options;

  if (allowFloatingPoint) {
    // Check if the value is mathematically an integer by comparing with rounded value
    const isApproximateInteger = Math.abs(value - Math.round(value)) < epsilon;
    if (!isApproximateInteger) {
      return {
        valid: false,
        message: message || 'Value must be an integer'
      };
    }
  } else {
    // Strict integer check using Number.isInteger
    if (!Number.isInteger(value)) {
      return {
        valid: false,
        message: message || 'Value must be an integer without decimal places'
      };
    }
  }

  return { valid: true };
}

/**
 * Validates if a number is positive (greater than 0 or equal to 0 if allowZero is true).
 * 
 * @param value - The number to validate
 * @param options - Sign validation options
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value is positive (> 0)
 * const result = isPositive(5);
 * 
 * @example
 * // Check if value is positive or zero (≥ 0)
 * const result = isPositive(0, { allowZero: true });
 */
export function isPositive(value: number, options: SignValidationOptions = {}): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: options.message || 'Value must be a valid number'
    };
  }

  const { allowZero = false, message } = options;

  if (allowZero) {
    if (value < 0) {
      return {
        valid: false,
        message: message || 'Value must be greater than or equal to 0'
      };
    }
  } else {
    if (value <= 0) {
      return {
        valid: false,
        message: message || 'Value must be greater than 0'
      };
    }
  }

  return { valid: true };
}

/**
 * Validates if a number is negative (less than 0 or equal to 0 if allowZero is true).
 * 
 * @param value - The number to validate
 * @param options - Sign validation options
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value is negative (< 0)
 * const result = isNegative(-5);
 * 
 * @example
 * // Check if value is negative or zero (≤ 0)
 * const result = isNegative(0, { allowZero: true });
 */
export function isNegative(value: number, options: SignValidationOptions = {}): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: options.message || 'Value must be a valid number'
    };
  }

  const { allowZero = false, message } = options;

  if (allowZero) {
    if (value > 0) {
      return {
        valid: false,
        message: message || 'Value must be less than or equal to 0'
      };
    }
  } else {
    if (value >= 0) {
      return {
        valid: false,
        message: message || 'Value must be less than 0'
      };
    }
  }

  return { valid: true };
}

/**
 * Validates if a number is a valid Brazilian Real currency value.
 * Checks for proper decimal places and range constraints.
 * 
 * @param value - The number to validate
 * @param options - Currency validation options
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value is a valid currency amount (≥ 0, with 2 decimal places)
 * const result = isBrazilianCurrency(199.99);
 * 
 * @example
 * // Check if value is a valid currency between 10 and 1000
 * const result = isBrazilianCurrency(199.99, { min: 10, max: 1000 });
 */
export function isBrazilianCurrency(value: number, options: CurrencyValidationOptions = {}): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: options.message || 'Value must be a valid number'
    };
  }

  const {
    min = 0,
    max,
    allowNegative = false,
    decimalPlaces = 2,
    message
  } = options;

  // Check if negative values are allowed
  if (!allowNegative && value < 0) {
    return {
      valid: false,
      message: message || 'Currency value cannot be negative'
    };
  }

  // Check minimum value
  if (value < min) {
    return {
      valid: false,
      message: message || `Currency value must be at least ${min}`
    };
  }

  // Check maximum value if specified
  if (max !== undefined && value > max) {
    return {
      valid: false,
      message: message || `Currency value cannot exceed ${max}`
    };
  }

  // Check decimal places
  const multiplier = Math.pow(10, decimalPlaces);
  const roundedValue = Math.round(value * multiplier) / multiplier;
  
  if (value !== roundedValue) {
    return {
      valid: false,
      message: message || `Currency value must have at most ${decimalPlaces} decimal places`
    };
  }

  return { valid: true };
}

/**
 * Formats a number as Brazilian Real currency string (R$ format).
 * 
 * @param value - The number to format
 * @param options - Intl.NumberFormat options (optional)
 * @returns Formatted currency string
 * 
 * @example
 * // Format as Brazilian Real: "R$ 1.234,56"
 * const formatted = formatBrazilianCurrency(1234.56);
 */
export function formatBrazilianCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

/**
 * Validates if a number is within a specified percentile range of a reference dataset.
 * 
 * @param value - The number to validate
 * @param options - Statistical range options with reference values and percentile bounds
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value is within the 10th to 90th percentile of reference values
 * const result = isWithinPercentileRange(50, {
 *   referenceValues: [10, 20, 30, 40, 50, 60, 70, 80, 90],
 *   lowerPercentile: 10,
 *   upperPercentile: 90
 * });
 */
export function isWithinPercentileRange(
  value: number,
  options: StatisticalRangeOptions & { lowerPercentile: number; upperPercentile: number }
): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: options.message || 'Value must be a valid number'
    };
  }

  const { referenceValues, lowerPercentile, upperPercentile, message } = options;

  if (!Array.isArray(referenceValues) || referenceValues.length === 0) {
    return {
      valid: false,
      message: 'Reference values must be a non-empty array'
    };
  }

  // Sort reference values
  const sortedValues = [...referenceValues].sort((a, b) => a - b);

  // Calculate percentile values
  const lowerIndex = Math.floor(sortedValues.length * (lowerPercentile / 100));
  const upperIndex = Math.ceil(sortedValues.length * (upperPercentile / 100)) - 1;

  const lowerBound = sortedValues[lowerIndex];
  const upperBound = sortedValues[upperIndex];

  if (value < lowerBound || value > upperBound) {
    return {
      valid: false,
      message: message || `Value must be between the ${lowerPercentile}th and ${upperPercentile}th percentiles (${lowerBound} to ${upperBound})`
    };
  }

  return { valid: true };
}

/**
 * Validates if a number is within a specified number of standard deviations from the mean of a reference dataset.
 * 
 * @param value - The number to validate
 * @param options - Statistical range options with reference values and standard deviation limit
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value is within 2 standard deviations of the mean
 * const result = isWithinStandardDeviations(50, {
 *   referenceValues: [10, 20, 30, 40, 50, 60, 70, 80, 90],
 *   standardDeviations: 2
 * });
 */
export function isWithinStandardDeviations(
  value: number,
  options: StatisticalRangeOptions & { standardDeviations: number }
): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: options.message || 'Value must be a valid number'
    };
  }

  const { referenceValues, standardDeviations, message } = options;

  if (!Array.isArray(referenceValues) || referenceValues.length === 0) {
    return {
      valid: false,
      message: 'Reference values must be a non-empty array'
    };
  }

  // Calculate mean
  const mean = referenceValues.reduce((sum, val) => sum + val, 0) / referenceValues.length;

  // Calculate standard deviation
  const squaredDifferences = referenceValues.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / referenceValues.length;
  const stdDev = Math.sqrt(variance);

  // Calculate bounds
  const lowerBound = mean - (standardDeviations * stdDev);
  const upperBound = mean + (standardDeviations * stdDev);

  if (value < lowerBound || value > upperBound) {
    return {
      valid: false,
      message: message || `Value must be within ${standardDeviations} standard deviations of the mean (${lowerBound.toFixed(2)} to ${upperBound.toFixed(2)})`
    };
  }

  return { valid: true };
}

/**
 * Validates if a number has at most the specified number of decimal places.
 * 
 * @param value - The number to validate
 * @param maxDecimalPlaces - Maximum number of decimal places allowed
 * @param message - Optional custom error message
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value has at most 2 decimal places
 * const result = hasMaxDecimalPlaces(123.45, 2);
 */
export function hasMaxDecimalPlaces(
  value: number,
  maxDecimalPlaces: number,
  message?: string
): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: message || 'Value must be a valid number'
    };
  }

  const multiplier = Math.pow(10, maxDecimalPlaces);
  const roundedValue = Math.round(value * multiplier) / multiplier;
  
  if (value !== roundedValue) {
    return {
      valid: false,
      message: message || `Value must have at most ${maxDecimalPlaces} decimal places`
    };
  }

  return { valid: true };
}

/**
 * Validates if a number has exactly the specified number of decimal places.
 * 
 * @param value - The number to validate
 * @param exactDecimalPlaces - Exact number of decimal places required
 * @param message - Optional custom error message
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * // Check if value has exactly 2 decimal places
 * const result = hasExactDecimalPlaces(123.45, 2);
 */
export function hasExactDecimalPlaces(
  value: number,
  exactDecimalPlaces: number,
  message?: string
): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      message: message || 'Value must be a valid number'
    };
  }

  // Convert to string and check decimal part length
  const parts = value.toString().split('.');
  const decimalPart = parts[1] || '';
  
  if (decimalPart.length !== exactDecimalPlaces) {
    return {
      valid: false,
      message: message || `Value must have exactly ${exactDecimalPlaces} decimal places`
    };
  }

  return { valid: true };
}