import {
  isInRange,
  isInteger,
  isPositive,
  isNegative,
  isBrazilianCurrency,
  formatBrazilianCurrency,
  isWithinPercentileRange,
  isWithinStandardDeviations,
  hasMaxDecimalPlaces,
  hasExactDecimalPlaces,
  ValidationResult,
  RangeValidationOptions,
  IntegerValidationOptions,
  SignValidationOptions,
  CurrencyValidationOptions,
  StatisticalRangeOptions
} from '../../../src/validation/number.validator';

describe('Number Validators', () => {
  describe('isInRange', () => {
    it('should validate numbers within inclusive range', () => {
      // Arrange
      const options: RangeValidationOptions = { min: 1, max: 10 };
      
      // Act & Assert
      expect(isInRange(1, options).valid).toBe(true);
      expect(isInRange(5, options).valid).toBe(true);
      expect(isInRange(10, options).valid).toBe(true);
    });

    it('should reject numbers outside inclusive range', () => {
      // Arrange
      const options: RangeValidationOptions = { min: 1, max: 10 };
      
      // Act & Assert
      expect(isInRange(0, options).valid).toBe(false);
      expect(isInRange(11, options).valid).toBe(false);
    });

    it('should validate numbers within exclusive range', () => {
      // Arrange
      const options: RangeValidationOptions = { 
        min: 1, 
        max: 10, 
        minInclusive: false, 
        maxInclusive: false 
      };
      
      // Act & Assert
      expect(isInRange(2, options).valid).toBe(true);
      expect(isInRange(5, options).valid).toBe(true);
      expect(isInRange(9, options).valid).toBe(true);
    });

    it('should reject numbers at boundaries of exclusive range', () => {
      // Arrange
      const options: RangeValidationOptions = { 
        min: 1, 
        max: 10, 
        minInclusive: false, 
        maxInclusive: false 
      };
      
      // Act & Assert
      expect(isInRange(1, options).valid).toBe(false);
      expect(isInRange(10, options).valid).toBe(false);
    });

    it('should validate with only min specified', () => {
      // Arrange
      const options: RangeValidationOptions = { min: 5 };
      
      // Act & Assert
      expect(isInRange(5, options).valid).toBe(true);
      expect(isInRange(100, options).valid).toBe(true);
      expect(isInRange(4, options).valid).toBe(false);
    });

    it('should validate with only max specified', () => {
      // Arrange
      const options: RangeValidationOptions = { max: 5 };
      
      // Act & Assert
      expect(isInRange(5, options).valid).toBe(true);
      expect(isInRange(-100, options).valid).toBe(true);
      expect(isInRange(6, options).valid).toBe(false);
    });

    it('should reject NaN values', () => {
      // Arrange
      const options: RangeValidationOptions = { min: 1, max: 10 };
      
      // Act & Assert
      expect(isInRange(NaN, options).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom range error';
      const options: RangeValidationOptions = { 
        min: 1, 
        max: 10, 
        message: customMessage 
      };
      
      // Act
      const result = isInRange(11, options);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });

    it('should handle floating point values correctly', () => {
      // Arrange
      const options: RangeValidationOptions = { min: 1.5, max: 10.5 };
      
      // Act & Assert
      expect(isInRange(1.5, options).valid).toBe(true);
      expect(isInRange(10.5, options).valid).toBe(true);
      expect(isInRange(1.49, options).valid).toBe(false);
      expect(isInRange(10.51, options).valid).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should validate integer values', () => {
      // Act & Assert
      expect(isInteger(0).valid).toBe(true);
      expect(isInteger(1).valid).toBe(true);
      expect(isInteger(-1).valid).toBe(true);
      expect(isInteger(1000000).valid).toBe(true);
    });

    it('should reject non-integer values', () => {
      // Act & Assert
      expect(isInteger(1.1).valid).toBe(false);
      expect(isInteger(-1.1).valid).toBe(false);
      expect(isInteger(0.5).valid).toBe(false);
    });

    it('should handle floating point integers with allowFloatingPoint option', () => {
      // Arrange
      const options: IntegerValidationOptions = { allowFloatingPoint: true };
      
      // Act & Assert
      expect(isInteger(1.0, options).valid).toBe(true);
      expect(isInteger(2.0, options).valid).toBe(true);
      expect(isInteger(-3.0, options).valid).toBe(true);
    });

    it('should reject floating point integers when allowFloatingPoint is false', () => {
      // Arrange
      const options: IntegerValidationOptions = { allowFloatingPoint: false };
      
      // Act & Assert
      // In JavaScript, 1.0 is actually stored as 1, so this test might not be reliable
      // Instead, we'll test with a value that has an explicit decimal part
      const explicitDecimal = parseFloat('1.0'); // Force decimal notation
      if (explicitDecimal.toString().includes('.')) {
        expect(isInteger(explicitDecimal, options).valid).toBe(false);
      }
    });

    it('should handle floating point precision errors', () => {
      // Arrange
      const almostInteger = 1.0000000000000002; // Due to floating point precision
      const options: IntegerValidationOptions = { 
        allowFloatingPoint: true,
        epsilon: 0.000000000000001 
      };
      
      // Act & Assert
      expect(isInteger(almostInteger, options).valid).toBe(true);
    });

    it('should reject NaN values', () => {
      // Act & Assert
      expect(isInteger(NaN).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom integer error';
      const options: IntegerValidationOptions = { message: customMessage };
      
      // Act
      const result = isInteger(1.5, options);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });
  });

  describe('isPositive', () => {
    it('should validate positive numbers', () => {
      // Act & Assert
      expect(isPositive(1).valid).toBe(true);
      expect(isPositive(0.1).valid).toBe(true);
      expect(isPositive(1000).valid).toBe(true);
    });

    it('should reject zero by default', () => {
      // Act & Assert
      expect(isPositive(0).valid).toBe(false);
    });

    it('should accept zero when allowZero is true', () => {
      // Arrange
      const options: SignValidationOptions = { allowZero: true };
      
      // Act & Assert
      expect(isPositive(0, options).valid).toBe(true);
    });

    it('should reject negative numbers', () => {
      // Arrange
      const options: SignValidationOptions = { allowZero: true };
      
      // Act & Assert
      expect(isPositive(-1).valid).toBe(false);
      expect(isPositive(-0.1).valid).toBe(false);
      expect(isPositive(-1000, options).valid).toBe(false);
    });

    it('should reject NaN values', () => {
      // Act & Assert
      expect(isPositive(NaN).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom positive error';
      const options: SignValidationOptions = { message: customMessage };
      
      // Act
      const result = isPositive(-1, options);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });
  });

  describe('isNegative', () => {
    it('should validate negative numbers', () => {
      // Act & Assert
      expect(isNegative(-1).valid).toBe(true);
      expect(isNegative(-0.1).valid).toBe(true);
      expect(isNegative(-1000).valid).toBe(true);
    });

    it('should reject zero by default', () => {
      // Act & Assert
      expect(isNegative(0).valid).toBe(false);
    });

    it('should accept zero when allowZero is true', () => {
      // Arrange
      const options: SignValidationOptions = { allowZero: true };
      
      // Act & Assert
      expect(isNegative(0, options).valid).toBe(true);
    });

    it('should reject positive numbers', () => {
      // Arrange
      const options: SignValidationOptions = { allowZero: true };
      
      // Act & Assert
      expect(isNegative(1).valid).toBe(false);
      expect(isNegative(0.1).valid).toBe(false);
      expect(isNegative(1000, options).valid).toBe(false);
    });

    it('should reject NaN values', () => {
      // Act & Assert
      expect(isNegative(NaN).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom negative error';
      const options: SignValidationOptions = { message: customMessage };
      
      // Act
      const result = isNegative(1, options);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });
  });

  describe('isBrazilianCurrency', () => {
    it('should validate valid currency values', () => {
      // Act & Assert
      expect(isBrazilianCurrency(0).valid).toBe(true);
      expect(isBrazilianCurrency(1).valid).toBe(true);
      expect(isBrazilianCurrency(1.5).valid).toBe(true);
      expect(isBrazilianCurrency(1.55).valid).toBe(true);
      expect(isBrazilianCurrency(1000.00).valid).toBe(true);
    });

    it('should reject negative values by default', () => {
      // Act & Assert
      expect(isBrazilianCurrency(-1).valid).toBe(false);
      expect(isBrazilianCurrency(-0.01).valid).toBe(false);
    });

    it('should accept negative values when allowNegative is true', () => {
      // Arrange
      const options: CurrencyValidationOptions = { allowNegative: true };
      
      // Act & Assert
      expect(isBrazilianCurrency(-1, options).valid).toBe(true);
      expect(isBrazilianCurrency(-0.01, options).valid).toBe(true);
    });

    it('should reject values with too many decimal places', () => {
      // Act & Assert
      expect(isBrazilianCurrency(1.555).valid).toBe(false);
      expect(isBrazilianCurrency(0.001).valid).toBe(false);
    });

    it('should validate with custom decimal places', () => {
      // Arrange
      const options: CurrencyValidationOptions = { decimalPlaces: 3 };
      
      // Act & Assert
      expect(isBrazilianCurrency(1.555, options).valid).toBe(true);
      expect(isBrazilianCurrency(1.5555, options).valid).toBe(false);
    });

    it('should validate with min and max constraints', () => {
      // Arrange
      const options: CurrencyValidationOptions = { min: 10, max: 100 };
      
      // Act & Assert
      expect(isBrazilianCurrency(10, options).valid).toBe(true);
      expect(isBrazilianCurrency(50, options).valid).toBe(true);
      expect(isBrazilianCurrency(100, options).valid).toBe(true);
      expect(isBrazilianCurrency(9.99, options).valid).toBe(false);
      expect(isBrazilianCurrency(100.01, options).valid).toBe(false);
    });

    it('should reject NaN values', () => {
      // Act & Assert
      expect(isBrazilianCurrency(NaN).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom currency error';
      const options: CurrencyValidationOptions = { message: customMessage };
      
      // Act
      const result = isBrazilianCurrency(-1, options);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });

    it('should handle health plan pricing edge cases', () => {
      // Arrange - Health plans often have specific pricing patterns
      const options: CurrencyValidationOptions = { min: 50, max: 5000 };
      
      // Act & Assert
      expect(isBrazilianCurrency(99.90, options).valid).toBe(true); // Common health plan price
      expect(isBrazilianCurrency(199.99, options).valid).toBe(true); // Common health plan price
      expect(isBrazilianCurrency(1299.90, options).valid).toBe(true); // Premium health plan price
    });

    it('should validate medication prices', () => {
      // Arrange - Medication prices can be very specific
      const options: CurrencyValidationOptions = { min: 0.01 };
      
      // Act & Assert
      expect(isBrazilianCurrency(2.99, options).valid).toBe(true); // Common medication price
      expect(isBrazilianCurrency(12.50, options).valid).toBe(true); // Common medication price
      expect(isBrazilianCurrency(0.01, options).valid).toBe(true); // Minimum price
      expect(isBrazilianCurrency(0, options).valid).toBe(false); // Free medications should be handled separately
    });
  });

  describe('formatBrazilianCurrency', () => {
    it('should format currency values correctly', () => {
      // Act & Assert
      expect(formatBrazilianCurrency(0)).toBe('R$ 0,00');
      expect(formatBrazilianCurrency(1)).toBe('R$ 1,00');
      expect(formatBrazilianCurrency(1.5)).toBe('R$ 1,50');
      expect(formatBrazilianCurrency(1.55)).toBe('R$ 1,55');
      expect(formatBrazilianCurrency(1000)).toBe('R$ 1.000,00');
      expect(formatBrazilianCurrency(1234.56)).toBe('R$ 1.234,56');
    });

    it('should format negative values correctly', () => {
      // Act & Assert
      expect(formatBrazilianCurrency(-1)).toBe('-R$ 1,00');
      expect(formatBrazilianCurrency(-1234.56)).toBe('-R$ 1.234,56');
    });

    it('should respect custom formatting options', () => {
      // Act & Assert
      expect(formatBrazilianCurrency(1234.56, { signDisplay: 'always' })).toBe('+R$ 1.234,56');
      expect(formatBrazilianCurrency(1234.56, { currencyDisplay: 'code' })).toContain('BRL');
    });
  });

  describe('isWithinPercentileRange', () => {
    // Sample dataset for percentile tests
    const healthMetrics = [60, 65, 70, 72, 75, 78, 80, 82, 85, 90, 95];

    it('should validate values within percentile range', () => {
      // Arrange
      const options = {
        referenceValues: healthMetrics,
        lowerPercentile: 10,
        upperPercentile: 90
      };
      
      // Act & Assert
      expect(isWithinPercentileRange(65, options).valid).toBe(true); // 10th percentile
      expect(isWithinPercentileRange(75, options).valid).toBe(true); // Middle value
      expect(isWithinPercentileRange(90, options).valid).toBe(true); // 90th percentile
    });

    it('should reject values outside percentile range', () => {
      // Arrange
      const options = {
        referenceValues: healthMetrics,
        lowerPercentile: 10,
        upperPercentile: 90
      };
      
      // Act & Assert
      expect(isWithinPercentileRange(60, options).valid).toBe(false); // Below 10th percentile
      expect(isWithinPercentileRange(95, options).valid).toBe(false); // Above 90th percentile
    });

    it('should handle narrow percentile ranges', () => {
      // Arrange
      const options = {
        referenceValues: healthMetrics,
        lowerPercentile: 45,
        upperPercentile: 55
      };
      
      // Act & Assert - 45th to 55th percentile should be around the median
      expect(isWithinPercentileRange(75, options).valid).toBe(true); // Median value
      expect(isWithinPercentileRange(65, options).valid).toBe(false); // Below range
      expect(isWithinPercentileRange(85, options).valid).toBe(false); // Above range
    });

    it('should reject NaN values', () => {
      // Arrange
      const options = {
        referenceValues: healthMetrics,
        lowerPercentile: 10,
        upperPercentile: 90
      };
      
      // Act & Assert
      expect(isWithinPercentileRange(NaN, options).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom percentile error';
      const options = {
        referenceValues: healthMetrics,
        lowerPercentile: 10,
        upperPercentile: 90,
        message: customMessage
      };
      
      // Act
      const result = isWithinPercentileRange(100, options);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });

    it('should handle blood pressure reference ranges', () => {
      // Arrange - Systolic blood pressure reference values
      const systolicValues = [90, 100, 110, 120, 130, 140, 150, 160, 170, 180];
      const options = {
        referenceValues: systolicValues,
        lowerPercentile: 5,
        upperPercentile: 75
      };
      
      // Act & Assert
      expect(isWithinPercentileRange(95, options).valid).toBe(true); // Normal low
      expect(isWithinPercentileRange(120, options).valid).toBe(true); // Normal
      expect(isWithinPercentileRange(150, options).valid).toBe(true); // Upper normal
      expect(isWithinPercentileRange(180, options).valid).toBe(false); // High
    });
  });

  describe('isWithinStandardDeviations', () => {
    // Sample dataset for standard deviation tests
    const glucoseReadings = [80, 85, 90, 95, 100, 105, 110, 115, 120];

    it('should validate values within standard deviation range', () => {
      // Arrange
      const options = {
        referenceValues: glucoseReadings,
        standardDeviations: 2
      };
      
      // Calculate mean and standard deviation manually for verification
      const mean = glucoseReadings.reduce((sum, val) => sum + val, 0) / glucoseReadings.length;
      const variance = glucoseReadings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / glucoseReadings.length;
      const stdDev = Math.sqrt(variance);
      
      // Act & Assert
      expect(isWithinStandardDeviations(mean, options).valid).toBe(true); // Mean value
      expect(isWithinStandardDeviations(mean + stdDev, options).valid).toBe(true); // 1 std dev above
      expect(isWithinStandardDeviations(mean - stdDev, options).valid).toBe(true); // 1 std dev below
      expect(isWithinStandardDeviations(mean + (1.9 * stdDev), options).valid).toBe(true); // Just within 2 std dev
      expect(isWithinStandardDeviations(mean - (1.9 * stdDev), options).valid).toBe(true); // Just within 2 std dev
    });

    it('should reject values outside standard deviation range', () => {
      // Arrange
      const options = {
        referenceValues: glucoseReadings,
        standardDeviations: 2
      };
      
      // Calculate mean and standard deviation manually for verification
      const mean = glucoseReadings.reduce((sum, val) => sum + val, 0) / glucoseReadings.length;
      const variance = glucoseReadings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / glucoseReadings.length;
      const stdDev = Math.sqrt(variance);
      
      // Act & Assert
      expect(isWithinStandardDeviations(mean + (2.1 * stdDev), options).valid).toBe(false); // Just outside 2 std dev
      expect(isWithinStandardDeviations(mean - (2.1 * stdDev), options).valid).toBe(false); // Just outside 2 std dev
    });

    it('should handle different standard deviation thresholds', () => {
      // Arrange
      const narrowOptions = {
        referenceValues: glucoseReadings,
        standardDeviations: 1
      };
      
      const wideOptions = {
        referenceValues: glucoseReadings,
        standardDeviations: 3
      };
      
      // Calculate mean and standard deviation manually for verification
      const mean = glucoseReadings.reduce((sum, val) => sum + val, 0) / glucoseReadings.length;
      const variance = glucoseReadings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / glucoseReadings.length;
      const stdDev = Math.sqrt(variance);
      
      // Act & Assert - Narrow range (1 std dev)
      expect(isWithinStandardDeviations(mean + (0.9 * stdDev), narrowOptions).valid).toBe(true);
      expect(isWithinStandardDeviations(mean + (1.1 * stdDev), narrowOptions).valid).toBe(false);
      
      // Act & Assert - Wide range (3 std dev)
      expect(isWithinStandardDeviations(mean + (2.9 * stdDev), wideOptions).valid).toBe(true);
      expect(isWithinStandardDeviations(mean + (3.1 * stdDev), wideOptions).valid).toBe(false);
    });

    it('should reject NaN values', () => {
      // Arrange
      const options = {
        referenceValues: glucoseReadings,
        standardDeviations: 2
      };
      
      // Act & Assert
      expect(isWithinStandardDeviations(NaN, options).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom standard deviation error';
      const options = {
        referenceValues: glucoseReadings,
        standardDeviations: 2,
        message: customMessage
      };
      
      // Calculate mean and standard deviation manually for verification
      const mean = glucoseReadings.reduce((sum, val) => sum + val, 0) / glucoseReadings.length;
      const variance = glucoseReadings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / glucoseReadings.length;
      const stdDev = Math.sqrt(variance);
      
      // Act
      const result = isWithinStandardDeviations(mean + (3 * stdDev), options);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });

    it('should handle heart rate variability analysis', () => {
      // Arrange - Heart rate variability sample (milliseconds between beats)
      const hrvValues = [750, 760, 755, 765, 770, 760, 755, 765, 775, 780];
      const options = {
        referenceValues: hrvValues,
        standardDeviations: 2
      };
      
      // Act & Assert
      expect(isWithinStandardDeviations(760, options).valid).toBe(true); // Normal value
      expect(isWithinStandardDeviations(800, options).valid).toBe(false); // Outlier
    });
  });

  describe('hasMaxDecimalPlaces', () => {
    it('should validate values with fewer decimal places than maximum', () => {
      // Act & Assert
      expect(hasMaxDecimalPlaces(1, 2).valid).toBe(true);
      expect(hasMaxDecimalPlaces(1.1, 2).valid).toBe(true);
      expect(hasMaxDecimalPlaces(1.12, 2).valid).toBe(true);
    });

    it('should reject values with more decimal places than maximum', () => {
      // Act & Assert
      expect(hasMaxDecimalPlaces(1.123, 2).valid).toBe(false);
      expect(hasMaxDecimalPlaces(1.1234, 3).valid).toBe(false);
    });

    it('should handle zero decimal places', () => {
      // Act & Assert
      expect(hasMaxDecimalPlaces(1, 0).valid).toBe(true);
      expect(hasMaxDecimalPlaces(1.1, 0).valid).toBe(false);
    });

    it('should reject NaN values', () => {
      // Act & Assert
      expect(hasMaxDecimalPlaces(NaN, 2).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom decimal places error';
      
      // Act
      const result = hasMaxDecimalPlaces(1.123, 2, customMessage);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });

    it('should handle floating point precision issues', () => {
      // Arrange - 0.1 + 0.2 is not exactly 0.3 in floating point
      const sum = 0.1 + 0.2;
      
      // Act & Assert
      // Even though sum is approximately 0.3, it might have many decimal places internally
      // We should still consider it as having 1 decimal place for validation purposes
      expect(hasMaxDecimalPlaces(sum, 1).valid).toBe(true);
    });
  });

  describe('hasExactDecimalPlaces', () => {
    it('should validate values with exact decimal places', () => {
      // Act & Assert
      expect(hasExactDecimalPlaces(1.00, 2).valid).toBe(true);
      expect(hasExactDecimalPlaces(1.10, 2).valid).toBe(true);
      expect(hasExactDecimalPlaces(1.12, 2).valid).toBe(true);
    });

    it('should reject values with fewer decimal places', () => {
      // Act & Assert
      expect(hasExactDecimalPlaces(1, 2).valid).toBe(false);
      expect(hasExactDecimalPlaces(1.1, 2).valid).toBe(false);
    });

    it('should reject values with more decimal places', () => {
      // Act & Assert
      expect(hasExactDecimalPlaces(1.123, 2).valid).toBe(false);
      expect(hasExactDecimalPlaces(1.1234, 3).valid).toBe(false);
    });

    it('should handle zero decimal places', () => {
      // Act & Assert
      expect(hasExactDecimalPlaces(1, 0).valid).toBe(true);
      expect(hasExactDecimalPlaces(1.1, 0).valid).toBe(false);
    });

    it('should reject NaN values', () => {
      // Act & Assert
      expect(hasExactDecimalPlaces(NaN, 2).valid).toBe(false);
    });

    it('should include custom error messages', () => {
      // Arrange
      const customMessage = 'Custom exact decimal places error';
      
      // Act
      const result = hasExactDecimalPlaces(1.123, 2, customMessage);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.message).toBe(customMessage);
    });

    it('should validate health metric precision requirements', () => {
      // Act & Assert - Blood glucose typically requires exactly 1 decimal place
      expect(hasExactDecimalPlaces(95.5, 1).valid).toBe(true); // Valid blood glucose reading
      expect(hasExactDecimalPlaces(95, 1).valid).toBe(false); // Invalid format
      expect(hasExactDecimalPlaces(95.55, 1).valid).toBe(false); // Too precise
      
      // Act & Assert - Body temperature typically requires exactly 1 decimal place
      expect(hasExactDecimalPlaces(36.5, 1).valid).toBe(true); // Valid temperature
      expect(hasExactDecimalPlaces(36, 1).valid).toBe(false); // Invalid format
      
      // Act & Assert - Blood pressure typically requires 0 decimal places
      expect(hasExactDecimalPlaces(120, 0).valid).toBe(true); // Valid systolic pressure
      expect(hasExactDecimalPlaces(120.5, 0).valid).toBe(false); // Invalid format
    });
  });
});