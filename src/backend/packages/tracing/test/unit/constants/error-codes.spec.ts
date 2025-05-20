/**
 * @file Unit tests for tracing error code constants.
 * 
 * These tests verify that error codes follow a consistent pattern,
 * have proper categorization, and maintain uniqueness across the tracing package.
 */

import * as ErrorCodes from '../../../src/constants/error-codes';

describe('Tracing Error Codes', () => {
  // Get all exported error codes
  const errorCodes = Object.entries(ErrorCodes).filter(
    ([key, value]) => typeof value === 'string' && key === key.toUpperCase()
  );

  it('should export error codes', () => {
    expect(errorCodes.length).toBeGreaterThan(0);
  });

  describe('Error code format', () => {
    it('should follow the TRACING_XXX pattern', () => {
      errorCodes.forEach(([key, value]) => {
        expect(value).toMatch(/^TRACING_\d{3}$/);
      });
    });

    it('should have properly categorized error codes', () => {
      // Group error codes by their first digit
      const categorizedCodes = errorCodes.reduce((acc, [key, value]) => {
        const category = value.split('_')[1][0];
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(value);
        return acc;
      }, {});

      // Check tracer initialization codes (0XX)
      expect(categorizedCodes['0'] || []).toEqual(
        expect.arrayContaining(['TRACING_001', 'TRACING_002', 'TRACING_003'])
      );

      // Check span operation codes (1XX)
      expect(categorizedCodes['1'] || []).toEqual(
        expect.arrayContaining(['TRACING_101', 'TRACING_102', 'TRACING_103', 'TRACING_104'])
      );

      // Check context propagation codes (2XX)
      expect(categorizedCodes['2'] || []).toEqual(
        expect.arrayContaining(['TRACING_201', 'TRACING_202', 'TRACING_203'])
      );

      // Check exporter configuration codes (3XX)
      expect(categorizedCodes['3'] || []).toEqual(
        expect.arrayContaining(['TRACING_301', 'TRACING_302', 'TRACING_303'])
      );

      // Check resource detection codes (4XX)
      expect(categorizedCodes['4'] || []).toEqual(
        expect.arrayContaining(['TRACING_401', 'TRACING_402'])
      );

      // Check sampling configuration codes (5XX)
      expect(categorizedCodes['5'] || []).toEqual(
        expect.arrayContaining(['TRACING_501', 'TRACING_502'])
      );

      // Check instrumentation codes (6XX)
      expect(categorizedCodes['6'] || []).toEqual(
        expect.arrayContaining(['TRACING_601', 'TRACING_602', 'TRACING_603'])
      );

      // Check batch processing codes (7XX)
      expect(categorizedCodes['7'] || []).toEqual(
        expect.arrayContaining(['TRACING_701', 'TRACING_702', 'TRACING_703'])
      );

      // Check shutdown operation codes (8XX)
      expect(categorizedCodes['8'] || []).toEqual(
        expect.arrayContaining(['TRACING_801', 'TRACING_802'])
      );

      // Check general tracing operation codes (9XX)
      expect(categorizedCodes['9'] || []).toEqual(
        expect.arrayContaining(['TRACING_901', 'TRACING_902', 'TRACING_999'])
      );
    });
  });

  describe('Error code uniqueness', () => {
    it('should have unique error code values', () => {
      const values = errorCodes.map(([_, value]) => value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have unique error code keys', () => {
      const keys = errorCodes.map(([key, _]) => key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('Error code naming', () => {
    it('should have descriptive constant names', () => {
      errorCodes.forEach(([key, value]) => {
        // Verify that constant names are descriptive (not just numeric)
        expect(key).not.toMatch(/^\d+$/);
        
        // Verify that constant names are in UPPER_SNAKE_CASE
        expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
        
        // Verify that constant names are related to their category
        const category = parseInt(value.split('_')[1][0]);
        
        switch(category) {
          case 0:
            expect(key).toMatch(/TRACER|INIT/);
            break;
          case 1:
            expect(key).toMatch(/SPAN/);
            break;
          case 2:
            expect(key).toMatch(/CONTEXT/);
            break;
          case 3:
            expect(key).toMatch(/EXPORTER/);
            break;
          case 4:
            expect(key).toMatch(/RESOURCE/);
            break;
          case 5:
            expect(key).toMatch(/SAMPL/);
            break;
          case 6:
            expect(key).toMatch(/INSTRUMENTATION/);
            break;
          case 7:
            expect(key).toMatch(/BATCH/);
            break;
          case 8:
            expect(key).toMatch(/SHUTDOWN|FLUSH/);
            break;
          case 9:
            expect(key).toMatch(/TRACING|CONFIGURATION|OPERATION/);
            break;
        }
      });
    });
  });

  describe('Error code grouping', () => {
    it('should have proper error code grouping', () => {
      // Verify that error codes are properly grouped by category
      const tracerInitCodes = errorCodes.filter(([key]) => key.includes('TRACER') || key.includes('INIT'));
      const spanCodes = errorCodes.filter(([key]) => key.includes('SPAN'));
      const contextCodes = errorCodes.filter(([key]) => key.includes('CONTEXT'));
      const exporterCodes = errorCodes.filter(([key]) => key.includes('EXPORTER'));
      const resourceCodes = errorCodes.filter(([key]) => key.includes('RESOURCE'));
      const samplerCodes = errorCodes.filter(([key]) => key.includes('SAMPL'));
      const instrumentationCodes = errorCodes.filter(([key]) => key.includes('INSTRUMENTATION'));
      const batchCodes = errorCodes.filter(([key]) => key.includes('BATCH'));
      const shutdownCodes = errorCodes.filter(([key]) => key.includes('SHUTDOWN') || key.includes('FLUSH'));
      const generalCodes = errorCodes.filter(([key]) => 
        key.includes('TRACING') && 
        !key.includes('INSTRUMENTATION') && 
        !tracerInitCodes.some(([k]) => k === key)
      );

      // Verify that each category has the expected number of error codes
      expect(tracerInitCodes.length).toBeGreaterThanOrEqual(3);
      expect(spanCodes.length).toBeGreaterThanOrEqual(4);
      expect(contextCodes.length).toBeGreaterThanOrEqual(3);
      expect(exporterCodes.length).toBeGreaterThanOrEqual(3);
      expect(resourceCodes.length).toBeGreaterThanOrEqual(2);
      expect(samplerCodes.length).toBeGreaterThanOrEqual(2);
      expect(instrumentationCodes.length).toBeGreaterThanOrEqual(3);
      expect(batchCodes.length).toBeGreaterThanOrEqual(3);
      expect(shutdownCodes.length).toBeGreaterThanOrEqual(2);
      expect(generalCodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error code completeness', () => {
    it('should have all required error categories', () => {
      // Extract the first digit of each error code to identify categories
      const categories = new Set(
        errorCodes.map(([_, value]) => parseInt(value.split('_')[1][0]))
      );
      
      // Verify that all expected categories exist (0-9)
      for (let i = 0; i <= 9; i++) {
        expect(categories.has(i)).toBe(true);
      }
    });
  });
});