/**
 * @file Unit tests for the transports barrel file
 * @description Verifies that all transport implementations and the transport factory are correctly exported
 */

import * as transportsModule from '../../../src/transports';
import { ConsoleTransport } from '../../../src/transports/console.transport';
import { FileTransport } from '../../../src/transports/file.transport';
import { CloudWatchTransport } from '../../../src/transports/cloudwatch.transport';
import { 
  TransportFactory, 
  TransportType,
  TransportConfig,
  ConsoleTransportConfig,
  FileTransportConfig,
  CloudWatchTransportConfig,
  AnyTransportConfig
} from '../../../src/transports/transport-factory';

describe('Transports Barrel File', () => {
  describe('Transport Implementations', () => {
    it('should export ConsoleTransport', () => {
      expect(transportsModule.ConsoleTransport).toBeDefined();
      expect(transportsModule.ConsoleTransport).toBe(ConsoleTransport);
    });

    it('should export FileTransport', () => {
      expect(transportsModule.FileTransport).toBeDefined();
      expect(transportsModule.FileTransport).toBe(FileTransport);
    });

    it('should export CloudWatchTransport', () => {
      expect(transportsModule.CloudWatchTransport).toBeDefined();
      expect(transportsModule.CloudWatchTransport).toBe(CloudWatchTransport);
    });
  });

  describe('Transport Factory', () => {
    it('should export TransportFactory', () => {
      expect(transportsModule.TransportFactory).toBeDefined();
      expect(transportsModule.TransportFactory).toBe(TransportFactory);
    });

    it('should export TransportType enum', () => {
      expect(transportsModule.TransportType).toBeDefined();
      expect(transportsModule.TransportType).toBe(TransportType);
      expect(transportsModule.TransportType.CONSOLE).toBe('console');
      expect(transportsModule.TransportType.FILE).toBe('file');
      expect(transportsModule.TransportType.CLOUDWATCH).toBe('cloudwatch');
    });
  });

  describe('Transport Configuration Types', () => {
    it('should export TransportConfig interface', () => {
      // TypeScript interfaces are not available at runtime, so we can only check
      // that the type is exported by checking if it's in the barrel's exports
      const exportedNames = Object.keys(transportsModule);
      expect(exportedNames).toContain('TransportConfig');
    });

    it('should export ConsoleTransportConfig interface', () => {
      const exportedNames = Object.keys(transportsModule);
      expect(exportedNames).toContain('ConsoleTransportConfig');
    });

    it('should export FileTransportConfig interface', () => {
      const exportedNames = Object.keys(transportsModule);
      expect(exportedNames).toContain('FileTransportConfig');
    });

    it('should export CloudWatchTransportConfig interface', () => {
      const exportedNames = Object.keys(transportsModule);
      expect(exportedNames).toContain('CloudWatchTransportConfig');
    });

    it('should export AnyTransportConfig type', () => {
      const exportedNames = Object.keys(transportsModule);
      expect(exportedNames).toContain('AnyTransportConfig');
    });
  });

  describe('Import Variations', () => {
    it('should support named imports for transport implementations', () => {
      // This test verifies that named imports work correctly
      // The imports at the top of the file would fail if this wasn't working
      const { ConsoleTransport: NamedConsoleTransport } = transportsModule;
      expect(NamedConsoleTransport).toBeDefined();
      expect(NamedConsoleTransport).toBe(ConsoleTransport);
    });

    it('should support named imports for transport factory', () => {
      const { TransportFactory: NamedTransportFactory } = transportsModule;
      expect(NamedTransportFactory).toBeDefined();
      expect(NamedTransportFactory).toBe(TransportFactory);
    });

    it('should support named imports for transport types', () => {
      const { TransportType: NamedTransportType } = transportsModule;
      expect(NamedTransportType).toBeDefined();
      expect(NamedTransportType).toBe(TransportType);
    });

    it('should support namespace imports', () => {
      // This test verifies that namespace imports work correctly
      expect(transportsModule).toBeDefined();
      expect(typeof transportsModule).toBe('object');
      expect(transportsModule.ConsoleTransport).toBeDefined();
      expect(transportsModule.FileTransport).toBeDefined();
      expect(transportsModule.CloudWatchTransport).toBeDefined();
      expect(transportsModule.TransportFactory).toBeDefined();
      expect(transportsModule.TransportType).toBeDefined();
    });
  });

  describe('Export Naming Consistency', () => {
    it('should use consistent naming for transport implementations', () => {
      // Verify that transport implementations follow the naming convention
      expect(transportsModule.ConsoleTransport.name).toBe('ConsoleTransport');
      expect(transportsModule.FileTransport.name).toBe('FileTransport');
      expect(transportsModule.CloudWatchTransport.name).toBe('CloudWatchTransport');
    });

    it('should use consistent naming for factory', () => {
      expect(transportsModule.TransportFactory.name).toBe('TransportFactory');
    });
  });

  describe('Transport Implementation Verification', () => {
    it('should verify ConsoleTransport implements required methods', () => {
      const transport = transportsModule.ConsoleTransport.prototype;
      expect(typeof transport.initialize).toBe('function');
      expect(typeof transport.write).toBe('function');
      expect(typeof transport.close).toBe('function');
    });

    it('should verify FileTransport implements required methods', () => {
      const transport = transportsModule.FileTransport.prototype;
      expect(typeof transport.initialize).toBe('function');
      expect(typeof transport.write).toBe('function');
      expect(typeof transport.close).toBe('function');
    });

    it('should verify CloudWatchTransport implements required methods', () => {
      const transport = transportsModule.CloudWatchTransport.prototype;
      expect(typeof transport.initialize).toBe('function');
      expect(typeof transport.write).toBe('function');
      expect(typeof transport.close).toBe('function');
    });
  });

  describe('Transport Factory Verification', () => {
    it('should verify TransportFactory implements required methods', () => {
      const factory = transportsModule.TransportFactory.prototype;
      expect(typeof factory.createTransports).toBe('function');
    });

    it('should verify TransportFactory has static methods', () => {
      expect(typeof transportsModule.TransportFactory.createDefaultTransportConfigs).toBe('function');
    });
  });
});