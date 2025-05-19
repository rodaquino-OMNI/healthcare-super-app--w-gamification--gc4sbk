import { jest } from '@jest/globals';

// Mock the formatter implementations and interfaces
jest.mock('../../../src/formatters/json.formatter', () => ({
  JsonFormatter: class MockJsonFormatter {}
}));

jest.mock('../../../src/formatters/text.formatter', () => ({
  TextFormatter: class MockTextFormatter {}
}));

jest.mock('../../../src/formatters/cloudwatch.formatter', () => ({
  CloudWatchFormatter: class MockCloudWatchFormatter {}
}));

jest.mock('../../../src/formatters/formatter.interface', () => ({
  Formatter: 'MockFormatterInterface',
  LogEntry: 'MockLogEntryInterface'
}));

describe('Formatters Barrel File', () => {
  describe('Named Exports', () => {
    it('should export all formatter implementations', () => {
      // Import all named exports from the barrel file
      const {
        JsonFormatter,
        TextFormatter,
        CloudWatchFormatter,
        Formatter,
        LogEntry
      } = require('../../../src/formatters');

      // Verify formatter implementations are exported
      expect(JsonFormatter).toBeDefined();
      expect(TextFormatter).toBeDefined();
      expect(CloudWatchFormatter).toBeDefined();
      
      // Verify formatter interfaces are exported
      expect(Formatter).toBeDefined();
      expect(LogEntry).toBeDefined();
      
      // Verify the exports are the correct types
      expect(JsonFormatter.name).toBe('MockJsonFormatter');
      expect(TextFormatter.name).toBe('MockTextFormatter');
      expect(CloudWatchFormatter.name).toBe('MockCloudWatchFormatter');
      expect(Formatter).toBe('MockFormatterInterface');
      expect(LogEntry).toBe('MockLogEntryInterface');
    });
  });

  describe('Namespace Import', () => {
    it('should allow importing all formatters as a namespace', () => {
      // Import everything as a namespace
      const formatters = require('../../../src/formatters');
      
      // Verify formatter implementations are exported
      expect(formatters.JsonFormatter).toBeDefined();
      expect(formatters.TextFormatter).toBeDefined();
      expect(formatters.CloudWatchFormatter).toBeDefined();
      
      // Verify formatter interfaces are exported
      expect(formatters.Formatter).toBeDefined();
      expect(formatters.LogEntry).toBeDefined();
      
      // Verify the exports are the correct types
      expect(formatters.JsonFormatter.name).toBe('MockJsonFormatter');
      expect(formatters.TextFormatter.name).toBe('MockTextFormatter');
      expect(formatters.CloudWatchFormatter.name).toBe('MockCloudWatchFormatter');
      expect(formatters.Formatter).toBe('MockFormatterInterface');
      expect(formatters.LogEntry).toBe('MockLogEntryInterface');
    });
  });

  describe('Individual Imports', () => {
    it('should allow importing formatters individually', () => {
      // Import each formatter individually
      const { JsonFormatter } = require('../../../src/formatters');
      const { TextFormatter } = require('../../../src/formatters');
      const { CloudWatchFormatter } = require('../../../src/formatters');
      const { Formatter } = require('../../../src/formatters');
      const { LogEntry } = require('../../../src/formatters');
      
      // Verify each import is defined and has the correct type
      expect(JsonFormatter).toBeDefined();
      expect(JsonFormatter.name).toBe('MockJsonFormatter');
      
      expect(TextFormatter).toBeDefined();
      expect(TextFormatter.name).toBe('MockTextFormatter');
      
      expect(CloudWatchFormatter).toBeDefined();
      expect(CloudWatchFormatter.name).toBe('MockCloudWatchFormatter');
      
      expect(Formatter).toBeDefined();
      expect(Formatter).toBe('MockFormatterInterface');
      
      expect(LogEntry).toBeDefined();
      expect(LogEntry).toBe('MockLogEntryInterface');
    });
  });

  describe('Export Naming Consistency', () => {
    it('should maintain consistent export names', () => {
      // Import directly from implementation files
      const { JsonFormatter: DirectJsonFormatter } = require('../../../src/formatters/json.formatter');
      const { TextFormatter: DirectTextFormatter } = require('../../../src/formatters/text.formatter');
      const { CloudWatchFormatter: DirectCloudWatchFormatter } = require('../../../src/formatters/cloudwatch.formatter');
      const { Formatter: DirectFormatter, LogEntry: DirectLogEntry } = require('../../../src/formatters/formatter.interface');
      
      // Import from barrel file
      const {
        JsonFormatter: BarrelJsonFormatter,
        TextFormatter: BarrelTextFormatter,
        CloudWatchFormatter: BarrelCloudWatchFormatter,
        Formatter: BarrelFormatter,
        LogEntry: BarrelLogEntry
      } = require('../../../src/formatters');
      
      // Verify export names are consistent
      expect(DirectJsonFormatter).toBe(BarrelJsonFormatter);
      expect(DirectTextFormatter).toBe(BarrelTextFormatter);
      expect(DirectCloudWatchFormatter).toBe(BarrelCloudWatchFormatter);
      expect(DirectFormatter).toBe(BarrelFormatter);
      expect(DirectLogEntry).toBe(BarrelLogEntry);
    });
  });

  describe('Default Export', () => {
    it('should not have a default export', () => {
      // Import default export
      const defaultExport = require('../../../src/formatters').default;
      
      // Verify there is no default export
      expect(defaultExport).toBeUndefined();
    });
  });
});