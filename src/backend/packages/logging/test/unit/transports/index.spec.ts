/**
 * @file Unit tests for the transports barrel file
 * @module @austa/logging/test/unit/transports
 */

import { expect } from 'chai';

/**
 * Test suite for the transports barrel file
 * Verifies that all expected transport implementations and the transport factory
 * are correctly exported from the barrel file.
 */
describe('Transports Barrel File', () => {
  /**
   * Test that all expected exports are available when importing everything
   * from the barrel file
   */
  describe('All Exports', () => {
    it('should export all transport implementations and the factory', () => {
      // Import all exports from the barrel file
      const transports = require('../../../src/transports');
      
      // Verify all expected exports are available
      expect(transports).to.have.property('ConsoleTransport');
      expect(transports).to.have.property('FileTransport');
      expect(transports).to.have.property('CloudWatchTransport');
      expect(transports).to.have.property('TransportFactory');
      expect(transports).to.have.property('Transport');
    });
  });

  /**
   * Test that named imports work correctly for each export
   */
  describe('Named Imports', () => {
    it('should allow importing ConsoleTransport', () => {
      const { ConsoleTransport } = require('../../../src/transports');
      expect(ConsoleTransport).to.be.a('function');
      expect(ConsoleTransport.name).to.equal('ConsoleTransport');
    });

    it('should allow importing FileTransport', () => {
      const { FileTransport } = require('../../../src/transports');
      expect(FileTransport).to.be.a('function');
      expect(FileTransport.name).to.equal('FileTransport');
    });

    it('should allow importing CloudWatchTransport', () => {
      const { CloudWatchTransport } = require('../../../src/transports');
      expect(CloudWatchTransport).to.be.a('function');
      expect(CloudWatchTransport.name).to.equal('CloudWatchTransport');
    });

    it('should allow importing TransportFactory', () => {
      const { TransportFactory } = require('../../../src/transports');
      expect(TransportFactory).to.be.a('function');
      expect(TransportFactory.name).to.equal('TransportFactory');
    });

    it('should allow importing Transport interface', () => {
      const { Transport } = require('../../../src/transports');
      // Since interfaces don't exist at runtime, we can only verify it's exported
      expect(Transport).to.not.be.undefined;
    });
  });

  /**
   * Test that multiple named imports work correctly
   */
  describe('Multiple Named Imports', () => {
    it('should allow importing multiple transports at once', () => {
      const { ConsoleTransport, FileTransport, CloudWatchTransport } = require('../../../src/transports');
      
      expect(ConsoleTransport).to.be.a('function');
      expect(FileTransport).to.be.a('function');
      expect(CloudWatchTransport).to.be.a('function');
    });

    it('should allow importing transports and factory together', () => {
      const { ConsoleTransport, TransportFactory } = require('../../../src/transports');
      
      expect(ConsoleTransport).to.be.a('function');
      expect(TransportFactory).to.be.a('function');
    });
  });

  /**
   * Test that the exports are of the correct type and implement the Transport interface
   */
  describe('Export Types', () => {
    it('should export transport implementations that are constructors', () => {
      const { ConsoleTransport, FileTransport, CloudWatchTransport } = require('../../../src/transports');
      
      expect(ConsoleTransport.prototype).to.not.be.undefined;
      expect(FileTransport.prototype).to.not.be.undefined;
      expect(CloudWatchTransport.prototype).to.not.be.undefined;
    });

    it('should export transport implementations with expected methods', () => {
      const { ConsoleTransport, FileTransport, CloudWatchTransport } = require('../../../src/transports');
      
      // Check for required methods from the Transport interface
      // Note: This is a basic check since we can't directly check interface implementation at runtime
      expect(ConsoleTransport.prototype).to.have.property('write');
      expect(FileTransport.prototype).to.have.property('write');
      expect(CloudWatchTransport.prototype).to.have.property('write');
    });
  });

  /**
   * Test that the factory works correctly with the exported transports
   */
  describe('Factory Integration', () => {
    it('should export a factory that can create transport instances', () => {
      const { TransportFactory, ConsoleTransport } = require('../../../src/transports');
      
      // We're not testing the factory implementation here, just that it's exported
      // and is a constructor function that can be used with the exported transports
      expect(TransportFactory).to.be.a('function');
      expect(TransportFactory.name).to.equal('TransportFactory');
    });
  });

  /**
   * Test that import statements with different paths work correctly
   */
  describe('Import Variations', () => {
    it('should support importing from the index file directly', () => {
      const transports = require('../../../src/transports/index');
      
      expect(transports).to.have.property('ConsoleTransport');
      expect(transports).to.have.property('FileTransport');
      expect(transports).to.have.property('CloudWatchTransport');
      expect(transports).to.have.property('TransportFactory');
    });

    it('should support importing from the directory', () => {
      const transports = require('../../../src/transports');
      
      expect(transports).to.have.property('ConsoleTransport');
      expect(transports).to.have.property('FileTransport');
      expect(transports).to.have.property('CloudWatchTransport');
      expect(transports).to.have.property('TransportFactory');
    });
  });
});