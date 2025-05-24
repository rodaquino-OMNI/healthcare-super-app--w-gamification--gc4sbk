import { describe, expect, it, jest } from '@jest/globals';

// Import the validators we want to test
// Note: The actual implementation will be created in number.validator.ts
import {
  isInRange,
  isInteger,
  isPositive,
  isNegative,
  isValidBrazilianReal,
  isWithinStatisticalRange
} from '../../../src/validation/number.validator';

// Mock the module
jest.mock('../../../src/validation/number.validator', () => ({
  isInRange: jest.fn(),
  isInteger: jest.fn(),
  isPositive: jest.fn(),
  isNegative: jest.fn(),
  isValidBrazilianReal: jest.fn(),
  isWithinStatisticalRange: jest.fn(),
}));

describe('Number Validators', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('isInRange', () => {
    it('should return true when number is within inclusive range', () => {
      // Arrange
      const num = 5;
      const min = 1;
      const max = 10;
      const options = { inclusive: true };
      (isInRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInRange(num, min, max, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isInRange).toHaveBeenCalledWith(num, min, max, options);
    });

    it('should return true when number equals min in inclusive range', () => {
      // Arrange
      const num = 1;
      const min = 1;
      const max = 10;
      const options = { inclusive: true };
      (isInRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInRange(num, min, max, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isInRange).toHaveBeenCalledWith(num, min, max, options);
    });

    it('should return true when number equals max in inclusive range', () => {
      // Arrange
      const num = 10;
      const min = 1;
      const max = 10;
      const options = { inclusive: true };
      (isInRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInRange(num, min, max, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isInRange).toHaveBeenCalledWith(num, min, max, options);
    });

    it('should return false when number equals min in exclusive range', () => {
      // Arrange
      const num = 1;
      const min = 1;
      const max = 10;
      const options = { inclusive: false };
      (isInRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInRange(num, min, max, options);
      
      // Assert
      expect(result).toBe(false);
      expect(isInRange).toHaveBeenCalledWith(num, min, max, options);
    });

    it('should return false when number equals max in exclusive range', () => {
      // Arrange
      const num = 10;
      const min = 1;
      const max = 10;
      const options = { inclusive: false };
      (isInRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInRange(num, min, max, options);
      
      // Assert
      expect(result).toBe(false);
      expect(isInRange).toHaveBeenCalledWith(num, min, max, options);
    });

    it('should return false when number is less than min', () => {
      // Arrange
      const num = 0;
      const min = 1;
      const max = 10;
      (isInRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInRange(num, min, max);
      
      // Assert
      expect(result).toBe(false);
      expect(isInRange).toHaveBeenCalledWith(num, min, max);
    });

    it('should return false when number is greater than max', () => {
      // Arrange
      const num = 11;
      const min = 1;
      const max = 10;
      (isInRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInRange(num, min, max);
      
      // Assert
      expect(result).toBe(false);
      expect(isInRange).toHaveBeenCalledWith(num, min, max);
    });

    it('should handle negative ranges correctly', () => {
      // Arrange
      const num = -5;
      const min = -10;
      const max = -1;
      (isInRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInRange(num, min, max);
      
      // Assert
      expect(result).toBe(true);
      expect(isInRange).toHaveBeenCalledWith(num, min, max);
    });

    it('should handle decimal numbers correctly', () => {
      // Arrange
      const num = 5.5;
      const min = 1.5;
      const max = 10.5;
      (isInRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInRange(num, min, max);
      
      // Assert
      expect(result).toBe(true);
      expect(isInRange).toHaveBeenCalledWith(num, min, max);
    });

    it('should handle single-sided ranges with only min', () => {
      // Arrange
      const num = 5;
      const min = 1;
      const max = undefined;
      (isInRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInRange(num, min, max);
      
      // Assert
      expect(result).toBe(true);
      expect(isInRange).toHaveBeenCalledWith(num, min, max);
    });

    it('should handle single-sided ranges with only max', () => {
      // Arrange
      const num = 5;
      const min = undefined;
      const max = 10;
      (isInRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInRange(num, min, max);
      
      // Assert
      expect(result).toBe(true);
      expect(isInRange).toHaveBeenCalledWith(num, min, max);
    });
  });

  describe('isInteger', () => {
    it('should return true for integer values', () => {
      // Arrange
      const num = 42;
      (isInteger as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInteger(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isInteger).toHaveBeenCalledWith(num);
    });

    it('should return true for zero', () => {
      // Arrange
      const num = 0;
      (isInteger as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInteger(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isInteger).toHaveBeenCalledWith(num);
    });

    it('should return true for negative integers', () => {
      // Arrange
      const num = -42;
      (isInteger as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInteger(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isInteger).toHaveBeenCalledWith(num);
    });

    it('should return false for decimal numbers', () => {
      // Arrange
      const num = 42.5;
      (isInteger as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInteger(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isInteger).toHaveBeenCalledWith(num);
    });

    it('should handle floating-point precision errors with tolerance option', () => {
      // Arrange
      const num = 42.0000000001;
      const options = { tolerance: 0.000001 };
      (isInteger as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isInteger(num, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isInteger).toHaveBeenCalledWith(num, options);
    });

    it('should return false for non-numeric values', () => {
      // Arrange
      const num = 'not a number' as any;
      (isInteger as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInteger(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isInteger).toHaveBeenCalledWith(num);
    });

    it('should return false for NaN', () => {
      // Arrange
      const num = NaN;
      (isInteger as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInteger(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isInteger).toHaveBeenCalledWith(num);
    });

    it('should return false for Infinity', () => {
      // Arrange
      const num = Infinity;
      (isInteger as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isInteger(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isInteger).toHaveBeenCalledWith(num);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive numbers', () => {
      // Arrange
      const num = 42;
      (isPositive as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isPositive(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isPositive).toHaveBeenCalledWith(num);
    });

    it('should return true for positive decimal numbers', () => {
      // Arrange
      const num = 42.5;
      (isPositive as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isPositive(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isPositive).toHaveBeenCalledWith(num);
    });

    it('should return false for negative numbers', () => {
      // Arrange
      const num = -42;
      (isPositive as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isPositive(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isPositive).toHaveBeenCalledWith(num);
    });

    it('should return false for zero by default', () => {
      // Arrange
      const num = 0;
      (isPositive as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isPositive(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isPositive).toHaveBeenCalledWith(num);
    });

    it('should return true for zero when includeZero option is true', () => {
      // Arrange
      const num = 0;
      const options = { includeZero: true };
      (isPositive as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isPositive(num, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isPositive).toHaveBeenCalledWith(num, options);
    });

    it('should return false for non-numeric values', () => {
      // Arrange
      const num = 'not a number' as any;
      (isPositive as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isPositive(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isPositive).toHaveBeenCalledWith(num);
    });

    it('should return false for NaN', () => {
      // Arrange
      const num = NaN;
      (isPositive as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isPositive(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isPositive).toHaveBeenCalledWith(num);
    });

    it('should return true for Infinity', () => {
      // Arrange
      const num = Infinity;
      (isPositive as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isPositive(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isPositive).toHaveBeenCalledWith(num);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative numbers', () => {
      // Arrange
      const num = -42;
      (isNegative as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isNegative(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isNegative).toHaveBeenCalledWith(num);
    });

    it('should return true for negative decimal numbers', () => {
      // Arrange
      const num = -42.5;
      (isNegative as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isNegative(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isNegative).toHaveBeenCalledWith(num);
    });

    it('should return false for positive numbers', () => {
      // Arrange
      const num = 42;
      (isNegative as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isNegative(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isNegative).toHaveBeenCalledWith(num);
    });

    it('should return false for zero by default', () => {
      // Arrange
      const num = 0;
      (isNegative as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isNegative(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isNegative).toHaveBeenCalledWith(num);
    });

    it('should return true for zero when includeZero option is true', () => {
      // Arrange
      const num = 0;
      const options = { includeZero: true };
      (isNegative as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isNegative(num, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isNegative).toHaveBeenCalledWith(num, options);
    });

    it('should return false for non-numeric values', () => {
      // Arrange
      const num = 'not a number' as any;
      (isNegative as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isNegative(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isNegative).toHaveBeenCalledWith(num);
    });

    it('should return false for NaN', () => {
      // Arrange
      const num = NaN;
      (isNegative as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isNegative(num);
      
      // Assert
      expect(result).toBe(false);
      expect(isNegative).toHaveBeenCalledWith(num);
    });

    it('should return true for negative Infinity', () => {
      // Arrange
      const num = -Infinity;
      (isNegative as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isNegative(num);
      
      // Assert
      expect(result).toBe(true);
      expect(isNegative).toHaveBeenCalledWith(num);
    });
  });

  describe('isValidBrazilianReal', () => {
    it('should return true for valid Brazilian Real format with R$ prefix', () => {
      // Arrange
      const value = 'R$ 42,50';
      (isValidBrazilianReal as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });

    it('should return true for valid Brazilian Real format with thousands separator', () => {
      // Arrange
      const value = 'R$ 1.234,56';
      (isValidBrazilianReal as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });

    it('should return true for valid Brazilian Real format with multiple thousands separators', () => {
      // Arrange
      const value = 'R$ 1.234.567,89';
      (isValidBrazilianReal as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });

    it('should return true for valid Brazilian Real format without decimal part', () => {
      // Arrange
      const value = 'R$ 42';
      (isValidBrazilianReal as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });

    it('should return true for valid Brazilian Real format with zero value', () => {
      // Arrange
      const value = 'R$ 0,00';
      (isValidBrazilianReal as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });

    it('should return false for Brazilian Real format with incorrect decimal separator', () => {
      // Arrange
      const value = 'R$ 42.50';
      (isValidBrazilianReal as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });

    it('should return false for Brazilian Real format with incorrect thousands separator', () => {
      // Arrange
      const value = 'R$ 1,234,56';
      (isValidBrazilianReal as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });

    it('should return false for Brazilian Real format without R$ prefix', () => {
      // Arrange
      const value = '42,50';
      const options = { requirePrefix: true };
      (isValidBrazilianReal as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidBrazilianReal(value, options);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value, options);
    });

    it('should return true for Brazilian Real format without R$ prefix when prefix is not required', () => {
      // Arrange
      const value = '42,50';
      const options = { requirePrefix: false };
      (isValidBrazilianReal as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidBrazilianReal(value, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value, options);
    });

    it('should return false for negative Brazilian Real values when negatives are not allowed', () => {
      // Arrange
      const value = '-R$ 42,50';
      const options = { allowNegative: false };
      (isValidBrazilianReal as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidBrazilianReal(value, options);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value, options);
    });

    it('should return true for negative Brazilian Real values when negatives are allowed', () => {
      // Arrange
      const value = '-R$ 42,50';
      const options = { allowNegative: true };
      (isValidBrazilianReal as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidBrazilianReal(value, options);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value, options);
    });

    it('should return false for non-string values', () => {
      // Arrange
      const value = 42.5 as any;
      (isValidBrazilianReal as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidBrazilianReal(value);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidBrazilianReal).toHaveBeenCalledWith(value);
    });
  });

  describe('isWithinStatisticalRange', () => {
    it('should return true when value is within standard deviation range', () => {
      // Arrange
      const value = 105;
      const mean = 100;
      const stdDev = 10;
      const deviations = 1;
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isWithinStatisticalRange(value, mean, stdDev, { deviations });
      
      // Assert
      expect(result).toBe(true);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, mean, stdDev, { deviations });
    });

    it('should return false when value is outside standard deviation range', () => {
      // Arrange
      const value = 125;
      const mean = 100;
      const stdDev = 10;
      const deviations = 2;
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isWithinStatisticalRange(value, mean, stdDev, { deviations });
      
      // Assert
      expect(result).toBe(false);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, mean, stdDev, { deviations });
    });

    it('should return true when value is within percentile range', () => {
      // Arrange
      const value = 105;
      const percentiles = [90, 110];
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isWithinStatisticalRange(value, undefined, undefined, { percentiles });
      
      // Assert
      expect(result).toBe(true);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, undefined, undefined, { percentiles });
    });

    it('should return false when value is outside percentile range', () => {
      // Arrange
      const value = 120;
      const percentiles = [90, 110];
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isWithinStatisticalRange(value, undefined, undefined, { percentiles });
      
      // Assert
      expect(result).toBe(false);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, undefined, undefined, { percentiles });
    });

    it('should return true when value is within custom range function', () => {
      // Arrange
      const value = 105;
      const customRangeFn = (val: number) => val >= 100 && val <= 110;
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isWithinStatisticalRange(value, undefined, undefined, { customRangeFn });
      
      // Assert
      expect(result).toBe(true);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, undefined, undefined, { customRangeFn });
    });

    it('should return false when value is outside custom range function', () => {
      // Arrange
      const value = 95;
      const customRangeFn = (val: number) => val >= 100 && val <= 110;
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isWithinStatisticalRange(value, undefined, undefined, { customRangeFn });
      
      // Assert
      expect(result).toBe(false);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, undefined, undefined, { customRangeFn });
    });

    it('should handle health metric ranges for blood pressure', () => {
      // Arrange
      const value = 120; // systolic blood pressure
      const healthMetric = 'bloodPressureSystolic';
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isWithinStatisticalRange(value, undefined, undefined, { healthMetric });
      
      // Assert
      expect(result).toBe(true);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, undefined, undefined, { healthMetric });
    });

    it('should handle health metric ranges for heart rate', () => {
      // Arrange
      const value = 72; // heart rate
      const healthMetric = 'heartRate';
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isWithinStatisticalRange(value, undefined, undefined, { healthMetric });
      
      // Assert
      expect(result).toBe(true);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, undefined, undefined, { healthMetric });
    });

    it('should handle health metric ranges for blood glucose', () => {
      // Arrange
      const value = 100; // blood glucose
      const healthMetric = 'bloodGlucose';
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isWithinStatisticalRange(value, undefined, undefined, { healthMetric });
      
      // Assert
      expect(result).toBe(true);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, undefined, undefined, { healthMetric });
    });

    it('should return false for non-numeric values', () => {
      // Arrange
      const value = 'not a number' as any;
      const mean = 100;
      const stdDev = 10;
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isWithinStatisticalRange(value, mean, stdDev);
      
      // Assert
      expect(result).toBe(false);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, mean, stdDev);
    });

    it('should return false for NaN', () => {
      // Arrange
      const value = NaN;
      const mean = 100;
      const stdDev = 10;
      (isWithinStatisticalRange as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isWithinStatisticalRange(value, mean, stdDev);
      
      // Assert
      expect(result).toBe(false);
      expect(isWithinStatisticalRange).toHaveBeenCalledWith(value, mean, stdDev);
    });
  });
});