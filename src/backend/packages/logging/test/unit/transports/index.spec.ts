import { describe, it, expect } from 'jest';
import * as transports from '../../../src/transports';

describe('Transports barrel file', () => {
  it('should export ConsoleTransport', () => {
    expect(transports.ConsoleTransport).toBeDefined();
    expect(typeof transports.ConsoleTransport).toBe('function');
  });

  it('should export FileTransport', () => {
    expect(transports.FileTransport).toBeDefined();
    expect(typeof transports.FileTransport).toBe('function');
  });

  it('should export CloudWatchTransport', () => {
    expect(transports.CloudWatchTransport).toBeDefined();
    expect(typeof transports.CloudWatchTransport).toBe('function');
  });

  it('should export TransportFactory', () => {
    expect(transports.TransportFactory).toBeDefined();
    expect(typeof transports.TransportFactory).toBe('function');
  });

  it('should re-export Transport interface from interfaces', () => {
    // We can't directly test for the interface since it's a TypeScript construct
    // that doesn't exist at runtime, but we can check if it's exported
    expect(Object.keys(transports)).toContain('Transport');
  });

  it('should allow importing specific transports', () => {
    // This test verifies that named imports work correctly
    const { ConsoleTransport, FileTransport, CloudWatchTransport, TransportFactory } = transports;
    
    expect(ConsoleTransport).toBeDefined();
    expect(FileTransport).toBeDefined();
    expect(CloudWatchTransport).toBeDefined();
    expect(TransportFactory).toBeDefined();
  });

  it('should maintain consistent naming conventions', () => {
    // This test ensures that the naming conventions are consistent
    // All transport implementations should end with 'Transport'
    const transportImplementations = Object.keys(transports).filter(
      key => key.endsWith('Transport') && key !== 'Transport'
    );
    
    expect(transportImplementations).toContain('ConsoleTransport');
    expect(transportImplementations).toContain('FileTransport');
    expect(transportImplementations).toContain('CloudWatchTransport');
    expect(transportImplementations.length).toBeGreaterThanOrEqual(3); // At least these three transports
  });

  it('should not expose internal implementation details', () => {
    // This test ensures that only the public API is exposed
    const expectedExports = [
      'Transport', // Interface
      'ConsoleTransport',
      'FileTransport',
      'CloudWatchTransport',
      'TransportFactory'
    ];
    
    // Get all exports that are not in the expected list
    const unexpectedExports = Object.keys(transports).filter(
      key => !expectedExports.includes(key)
    );
    
    // There should be no unexpected exports
    expect(unexpectedExports).toEqual([]);
  });
});