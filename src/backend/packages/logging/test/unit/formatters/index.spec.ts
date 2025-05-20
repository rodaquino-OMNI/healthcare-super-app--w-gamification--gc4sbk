/**
 * @file Unit tests for formatters barrel file
 * @description Verifies that all formatter implementations and interfaces are correctly exported
 */

import { expect } from 'chai';

describe('Formatters Barrel File', () => {
  describe('Interface Exports', () => {
    it('should export the Formatter interface', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('Formatter');
    });

    it('should export the LogEntry interface', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('LogEntry');
    });

    it('should export the LogLevel enum', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('LogLevel');
      // Verify it's an enum by checking for some expected values
      expect(exports.LogLevel).to.have.property('DEBUG');
      expect(exports.LogLevel).to.have.property('INFO');
      expect(exports.LogLevel).to.have.property('WARN');
      expect(exports.LogLevel).to.have.property('ERROR');
      expect(exports.LogLevel).to.have.property('FATAL');
    });

    it('should export the JourneyType enum', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('JourneyType');
      // Verify it's an enum by checking for expected values
      expect(exports.JourneyType).to.have.property('HEALTH');
      expect(exports.JourneyType).to.have.property('CARE');
      expect(exports.JourneyType).to.have.property('PLAN');
    });
  });

  describe('Formatter Implementation Exports', () => {
    it('should export the JsonFormatter', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('JsonFormatter');
      // Verify it's a constructor function
      expect(exports.JsonFormatter).to.be.a('function');
    });

    it('should export the TextFormatter and its options', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('TextFormatter');
      expect(exports).to.have.property('TextFormatterOptions');
      // Verify it's a constructor function
      expect(exports.TextFormatter).to.be.a('function');
    });

    it('should export the CloudWatchFormatter', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('CloudWatchFormatter');
      // Verify it's a constructor function
      expect(exports.CloudWatchFormatter).to.be.a('function');
    });
  });

  describe('Utility Exports', () => {
    it('should export the LogLevelUtils', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('LogLevelUtils');
      // Verify it has the expected utility methods
      expect(exports.LogLevelUtils).to.have.property('toString');
      expect(exports.LogLevelUtils).to.have.property('fromString');
      expect(exports.LogLevelUtils).to.have.property('isLevelEnabled');
      expect(exports.LogLevelUtils).to.have.property('getAllLevels');
      expect(exports.LogLevelUtils).to.have.property('getAllLevelValues');
    });

    it('should export the LogLevelString type', () => {
      const exports = require('../../../src/formatters');
      expect(exports).to.have.property('LogLevelString');
    });
  });

  describe('Import Variations', () => {
    it('should support named imports', () => {
      // This test verifies that named imports work correctly
      const { JsonFormatter, TextFormatter, CloudWatchFormatter } = require('../../../src/formatters');
      expect(JsonFormatter).to.be.a('function');
      expect(TextFormatter).to.be.a('function');
      expect(CloudWatchFormatter).to.be.a('function');
    });

    it('should support importing interfaces', () => {
      // This test verifies that interfaces can be imported
      const { Formatter, LogEntry, LogLevel, JourneyType } = require('../../../src/formatters');
      expect(Formatter).to.exist;
      expect(LogEntry).to.exist;
      expect(LogLevel).to.exist;
      expect(JourneyType).to.exist;
    });

    it('should support importing utilities', () => {
      // This test verifies that utilities can be imported
      const { LogLevelUtils, LogLevelString } = require('../../../src/formatters');
      expect(LogLevelUtils).to.exist;
      expect(LogLevelString).to.exist;
    });
  });

  describe('Formatter Functionality', () => {
    it('should allow instantiating formatters from barrel imports', () => {
      // This test verifies that the exported formatters can be instantiated
      const { JsonFormatter, TextFormatter, CloudWatchFormatter } = require('../../../src/formatters');
      
      // We don't need to test full functionality, just that they can be instantiated
      expect(() => new JsonFormatter()).not.to.throw();
      expect(() => new TextFormatter()).not.to.throw();
      expect(() => new CloudWatchFormatter()).not.to.throw();
    });
  });
});