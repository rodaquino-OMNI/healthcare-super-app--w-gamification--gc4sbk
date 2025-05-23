/**
 * @file index.spec.ts
 * @description Unit tests for the formatter barrel file that verify all expected formatters
 * are correctly exported. These tests ensure that the barrel file maintains the correct
 * public API for the formatters module, with all formatter implementations and interfaces
 * properly exposed.
 */

import * as FormatterModule from '../../../src/formatters';
import { 
  Formatter, 
  LogEntry, 
  JSONFormatter, 
  TextFormatter, 
  CloudWatchFormatter,
  LogLevel,
  LogLevelUtils,
  LogLevelString,
  JourneyType,
  JourneyContext,
  ErrorInfo
} from '../../../src/formatters';

describe('Formatters Barrel File', () => {
  describe('Formatter Implementations', () => {
    it('should export JSONFormatter', () => {
      expect(JSONFormatter).toBeDefined();
      expect(FormatterModule.JSONFormatter).toBeDefined();
      expect(JSONFormatter).toBe(FormatterModule.JSONFormatter);
      expect(typeof JSONFormatter).toBe('function');
    });

    it('should export TextFormatter', () => {
      expect(TextFormatter).toBeDefined();
      expect(FormatterModule.TextFormatter).toBeDefined();
      expect(TextFormatter).toBe(FormatterModule.TextFormatter);
      expect(typeof TextFormatter).toBe('function');
    });

    it('should export CloudWatchFormatter', () => {
      expect(CloudWatchFormatter).toBeDefined();
      expect(FormatterModule.CloudWatchFormatter).toBeDefined();
      expect(CloudWatchFormatter).toBe(FormatterModule.CloudWatchFormatter);
      expect(typeof CloudWatchFormatter).toBe('function');
    });

    it('should ensure all formatters implement the Formatter interface', () => {
      // Create instances of each formatter
      const jsonFormatter = new JSONFormatter();
      const textFormatter = new TextFormatter();
      const cloudWatchFormatter = new CloudWatchFormatter();

      // Verify each formatter has a format method
      expect(jsonFormatter.format).toBeDefined();
      expect(typeof jsonFormatter.format).toBe('function');
      
      expect(textFormatter.format).toBeDefined();
      expect(typeof textFormatter.format).toBe('function');
      
      expect(cloudWatchFormatter.format).toBeDefined();
      expect(typeof cloudWatchFormatter.format).toBe('function');
    });
  });

  describe('Formatter Interfaces', () => {
    it('should export Formatter interface', () => {
      expect(FormatterModule.Formatter).toBeDefined();
      // Since interfaces are removed at runtime, we can only verify
      // that the export exists, not its actual structure
    });

    it('should export LogEntry interface', () => {
      expect(FormatterModule.LogEntry).toBeDefined();
      // Since interfaces are removed at runtime, we can only verify
      // that the export exists, not its actual structure
    });
  });

  describe('Related Types', () => {
    it('should export LogLevel enum', () => {
      expect(LogLevel).toBeDefined();
      expect(FormatterModule.LogLevel).toBeDefined();
      expect(LogLevel).toBe(FormatterModule.LogLevel);
      expect(typeof LogLevel).toBe('object');
    });

    it('should export LogLevelUtils', () => {
      expect(LogLevelUtils).toBeDefined();
      expect(FormatterModule.LogLevelUtils).toBeDefined();
      expect(LogLevelUtils).toBe(FormatterModule.LogLevelUtils);
      expect(typeof LogLevelUtils).toBe('object');
    });

    it('should export LogLevelString type', () => {
      expect(FormatterModule.LogLevelString).toBeDefined();
      // Since types are removed at runtime, we can only verify
      // that the export exists, not its actual structure
    });

    it('should export JourneyType enum', () => {
      expect(JourneyType).toBeDefined();
      expect(FormatterModule.JourneyType).toBeDefined();
      expect(JourneyType).toBe(FormatterModule.JourneyType);
      expect(typeof JourneyType).toBe('object');
    });

    it('should export JourneyContext interface', () => {
      expect(FormatterModule.JourneyContext).toBeDefined();
      // Since interfaces are removed at runtime, we can only verify
      // that the export exists, not its actual structure
    });

    it('should export ErrorInfo interface', () => {
      expect(FormatterModule.ErrorInfo).toBeDefined();
      // Since interfaces are removed at runtime, we can only verify
      // that the export exists, not its actual structure
    });
  });

  describe('Import Variations', () => {
    it('should support namespace imports', () => {
      expect(FormatterModule).toBeDefined();
      expect(FormatterModule.JSONFormatter).toBeDefined();
      expect(FormatterModule.TextFormatter).toBeDefined();
      expect(FormatterModule.CloudWatchFormatter).toBeDefined();
      expect(FormatterModule.Formatter).toBeDefined();
      expect(FormatterModule.LogEntry).toBeDefined();
    });

    it('should support named imports', () => {
      // This test passes if the imports at the top of the file work correctly
      expect(JSONFormatter).toBeDefined();
      expect(TextFormatter).toBeDefined();
      expect(CloudWatchFormatter).toBeDefined();
      expect(LogLevel).toBeDefined();
      expect(JourneyType).toBeDefined();
    });
  });

  describe('Export Naming Consistency', () => {
    it('should use consistent naming conventions for formatters', () => {
      // All formatter implementations should end with "Formatter"
      expect(JSONFormatter.name).toMatch(/Formatter$/);
      expect(TextFormatter.name).toMatch(/Formatter$/);
      expect(CloudWatchFormatter.name).toMatch(/Formatter$/);
    });

    it('should export the correct number of items', () => {
      // Count the number of exports (excluding default export)
      const exportCount = Object.keys(FormatterModule).length;
      
      // 3 formatter implementations + 2 interfaces + 6 related types = 11 exports
      expect(exportCount).toBe(11);
    });
  });
});