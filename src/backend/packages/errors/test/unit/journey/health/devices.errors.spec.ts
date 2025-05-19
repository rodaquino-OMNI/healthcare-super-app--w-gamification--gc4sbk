import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the error classes and types
import { ErrorType } from '../../../../src/types';
import { BaseError } from '../../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';
import {
  DeviceConnectionFailureError,
  SynchronizationFailedError,
  DeviceNotFoundError,
  IncompatibleDeviceError,
  DeviceAuthenticationError,
  DeviceTimeoutError
} from '../../../../src/journey/health/devices.errors';

/**
 * Test suite for Health Device error classes
 * Validates that device-related errors properly implement HEALTH_DEVICES_ prefixed error codes,
 * capture device context (type, connection state, timestamps), and provide appropriate
 * HTTP status codes and error classifications.
 */
describe('Health Device Errors', () => {
  // Sample device data for testing
  const deviceType = 'glucometer';
  const deviceId = 'device-123';
  const userId = 'user-456';
  const connectionState = 'pairing';
  const lastSyncTimestamp = new Date().toISOString();
  const firmwareVersion = '2.1.0';
  
  describe('DeviceConnectionFailureError', () => {
    it('should create error with HEALTH_DEVICES_ prefixed error code', () => {
      const error = new DeviceConnectionFailureError({
        deviceType,
        deviceId,
        connectionState,
        reason: 'Bluetooth connection failed'
      });

      expect(error.code).toMatch(/^HEALTH_DEVICES_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof DeviceConnectionFailureError).toBe(true);
    });

    it('should include device context in error details', () => {
      const error = new DeviceConnectionFailureError({
        deviceType,
        deviceId,
        connectionState,
        reason: 'Bluetooth connection failed'
      });

      expect(error.details).toBeDefined();
      expect(error.details.deviceType).toBe(deviceType);
      expect(error.details.deviceId).toBe(deviceId);
      expect(error.details.connectionState).toBe(connectionState);
      expect(error.details.reason).toBe('Bluetooth connection failed');
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new DeviceConnectionFailureError({
        deviceType,
        deviceId,
        connectionState,
        reason: 'Bluetooth connection failed'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should generate appropriate error message with troubleshooting guidance', () => {
      const error = new DeviceConnectionFailureError({
        deviceType,
        deviceId,
        connectionState,
        reason: 'Bluetooth connection failed'
      });

      expect(error.message).toContain(deviceType);
      expect(error.message).toContain('connection');
      // Should include troubleshooting guidance
      expect(error.getTroubleshootingSteps()).toBeDefined();
      expect(error.getTroubleshootingSteps().length).toBeGreaterThan(0);
    });
  });

  describe('SynchronizationFailedError', () => {
    it('should create error with HEALTH_DEVICES_ prefixed error code', () => {
      const error = new SynchronizationFailedError({
        deviceType,
        deviceId,
        lastSyncTimestamp,
        reason: 'Data format incompatible'
      });

      expect(error.code).toMatch(/^HEALTH_DEVICES_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof SynchronizationFailedError).toBe(true);
    });

    it('should include synchronization context in error details', () => {
      const error = new SynchronizationFailedError({
        deviceType,
        deviceId,
        lastSyncTimestamp,
        reason: 'Data format incompatible'
      });

      expect(error.details).toBeDefined();
      expect(error.details.deviceType).toBe(deviceType);
      expect(error.details.deviceId).toBe(deviceId);
      expect(error.details.lastSyncTimestamp).toBe(lastSyncTimestamp);
      expect(error.details.reason).toBe('Data format incompatible');
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new SynchronizationFailedError({
        deviceType,
        deviceId,
        lastSyncTimestamp,
        reason: 'Data format incompatible'
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should include retry information when available', () => {
      const error = new SynchronizationFailedError({
        deviceType,
        deviceId,
        lastSyncTimestamp,
        reason: 'Rate limit exceeded',
        retryAfter: 60 // seconds
      });

      expect(error.details.retryAfter).toBe(60);
      
      // Serialized error should include retry information
      const json = error.toJSON();
      expect(json.error.details.retryAfter).toBe(60);
    });
  });

  describe('DeviceNotFoundError', () => {
    it('should create error with HEALTH_DEVICES_ prefixed error code', () => {
      const error = new DeviceNotFoundError({
        deviceId,
        deviceType,
        userId
      });

      expect(error.code).toMatch(/^HEALTH_DEVICES_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof DeviceNotFoundError).toBe(true);
    });

    it('should include device identifier context in error details', () => {
      const error = new DeviceNotFoundError({
        deviceId,
        deviceType,
        userId
      });

      expect(error.details).toBeDefined();
      expect(error.details.deviceId).toBe(deviceId);
      expect(error.details.deviceType).toBe(deviceType);
      expect(error.details.userId).toBe(userId);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new DeviceNotFoundError({
        deviceId,
        deviceType,
        userId
      });

      expect(error.type).toBe(ErrorType.BUSINESS);
      
      // Should map to appropriate HTTP status code for business errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.BUSINESS);
    });
  });

  describe('IncompatibleDeviceError', () => {
    it('should create error with HEALTH_DEVICES_ prefixed error code', () => {
      const error = new IncompatibleDeviceError({
        deviceType,
        deviceId,
        firmwareVersion,
        minimumRequiredVersion: '3.0.0'
      });

      expect(error.code).toMatch(/^HEALTH_DEVICES_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof IncompatibleDeviceError).toBe(true);
    });

    it('should include compatibility context in error details', () => {
      const minimumRequiredVersion = '3.0.0';
      const error = new IncompatibleDeviceError({
        deviceType,
        deviceId,
        firmwareVersion,
        minimumRequiredVersion
      });

      expect(error.details).toBeDefined();
      expect(error.details.deviceType).toBe(deviceType);
      expect(error.details.deviceId).toBe(deviceId);
      expect(error.details.firmwareVersion).toBe(firmwareVersion);
      expect(error.details.minimumRequiredVersion).toBe(minimumRequiredVersion);
    });

    it('should be classified as a VALIDATION error type', () => {
      const error = new IncompatibleDeviceError({
        deviceType,
        deviceId,
        firmwareVersion,
        minimumRequiredVersion: '3.0.0'
      });

      expect(error.type).toBe(ErrorType.VALIDATION);
      
      // Should map to appropriate HTTP status code for validation errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.VALIDATION);
    });

    it('should provide upgrade guidance in error message', () => {
      const error = new IncompatibleDeviceError({
        deviceType,
        deviceId,
        firmwareVersion,
        minimumRequiredVersion: '3.0.0'
      });

      expect(error.message).toContain(deviceType);
      expect(error.message).toContain(firmwareVersion);
      expect(error.message).toContain('3.0.0');
      
      // Should include upgrade instructions
      expect(error.getUpgradeInstructions()).toBeDefined();
      expect(error.getUpgradeInstructions().length).toBeGreaterThan(0);
    });
  });

  describe('DeviceAuthenticationError', () => {
    it('should create error with HEALTH_DEVICES_ prefixed error code', () => {
      const error = new DeviceAuthenticationError({
        deviceType,
        deviceId,
        reason: 'Invalid pairing code'
      });

      expect(error.code).toMatch(/^HEALTH_DEVICES_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof DeviceAuthenticationError).toBe(true);
    });

    it('should include authentication context in error details', () => {
      const error = new DeviceAuthenticationError({
        deviceType,
        deviceId,
        reason: 'Invalid pairing code'
      });

      expect(error.details).toBeDefined();
      expect(error.details.deviceType).toBe(deviceType);
      expect(error.details.deviceId).toBe(deviceId);
      expect(error.details.reason).toBe('Invalid pairing code');
    });

    it('should be classified as a VALIDATION error type', () => {
      const error = new DeviceAuthenticationError({
        deviceType,
        deviceId,
        reason: 'Invalid pairing code'
      });

      expect(error.type).toBe(ErrorType.VALIDATION);
      
      // Should map to appropriate HTTP status code for validation errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.VALIDATION);
    });

    it('should provide authentication guidance in error message', () => {
      const error = new DeviceAuthenticationError({
        deviceType,
        deviceId,
        reason: 'Invalid pairing code'
      });

      expect(error.message).toContain(deviceType);
      expect(error.message).toContain('authentication');
      
      // Should include authentication instructions
      expect(error.getAuthenticationInstructions()).toBeDefined();
      expect(error.getAuthenticationInstructions().length).toBeGreaterThan(0);
    });
  });

  describe('DeviceTimeoutError', () => {
    it('should create error with HEALTH_DEVICES_ prefixed error code', () => {
      const error = new DeviceTimeoutError({
        deviceType,
        deviceId,
        operation: 'data_transfer',
        timeoutMs: 30000
      });

      expect(error.code).toMatch(/^HEALTH_DEVICES_/);
      expect(error instanceof BaseError).toBe(true);
      expect(error instanceof DeviceTimeoutError).toBe(true);
    });

    it('should include timeout context in error details', () => {
      const error = new DeviceTimeoutError({
        deviceType,
        deviceId,
        operation: 'data_transfer',
        timeoutMs: 30000
      });

      expect(error.details).toBeDefined();
      expect(error.details.deviceType).toBe(deviceType);
      expect(error.details.deviceId).toBe(deviceId);
      expect(error.details.operation).toBe('data_transfer');
      expect(error.details.timeoutMs).toBe(30000);
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new DeviceTimeoutError({
        deviceType,
        deviceId,
        operation: 'data_transfer',
        timeoutMs: 30000
      });

      expect(error.type).toBe(ErrorType.TECHNICAL);
      
      // Should map to appropriate HTTP status code for technical errors
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(HTTP_STATUS_MAPPINGS.TECHNICAL);
    });

    it('should include retry information when available', () => {
      const error = new DeviceTimeoutError({
        deviceType,
        deviceId,
        operation: 'data_transfer',
        timeoutMs: 30000,
        retryAfter: 15 // seconds
      });

      expect(error.details.retryAfter).toBe(15);
      
      // Serialized error should include retry information
      const json = error.toJSON();
      expect(json.error.details.retryAfter).toBe(15);
    });
  });

  describe('Error Recovery and Handling', () => {
    it('should provide appropriate recovery strategies for connection errors', () => {
      const error = new DeviceConnectionFailureError({
        deviceType,
        deviceId,
        connectionState,
        reason: 'Bluetooth connection failed'
      });

      // Connection errors should include troubleshooting steps
      const steps = error.getTroubleshootingSteps();
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);
      
      // Serialized error should include user-friendly message
      const json = error.toJSON();
      expect(json.error.message).toBeDefined();
      expect(typeof json.error.message).toBe('string');
      expect(json.error.message.length).toBeGreaterThan(0);
    });

    it('should provide appropriate recovery strategies for synchronization errors', () => {
      const error = new SynchronizationFailedError({
        deviceType,
        deviceId,
        lastSyncTimestamp,
        reason: 'Data format incompatible'
      });

      // Sync errors should include last successful sync time
      const json = error.toJSON();
      expect(json.error.details.lastSyncTimestamp).toBe(lastSyncTimestamp);
      
      // Should include reason for sync failure
      expect(json.error.details.reason).toBe('Data format incompatible');
    });

    it('should provide appropriate recovery strategies for incompatible device errors', () => {
      const error = new IncompatibleDeviceError({
        deviceType,
        deviceId,
        firmwareVersion,
        minimumRequiredVersion: '3.0.0'
      });

      // Incompatible device errors should include upgrade instructions
      const instructions = error.getUpgradeInstructions();
      expect(instructions).toBeDefined();
      expect(instructions.length).toBeGreaterThan(0);
      
      // Should include version information for comparison
      const json = error.toJSON();
      expect(json.error.details.firmwareVersion).toBe(firmwareVersion);
      expect(json.error.details.minimumRequiredVersion).toBe('3.0.0');
    });

    it('should provide appropriate recovery strategies for authentication errors', () => {
      const error = new DeviceAuthenticationError({
        deviceType,
        deviceId,
        reason: 'Invalid pairing code'
      });

      // Authentication errors should include authentication instructions
      const instructions = error.getAuthenticationInstructions();
      expect(instructions).toBeDefined();
      expect(instructions.length).toBeGreaterThan(0);
      
      // Should include reason for authentication failure
      const json = error.toJSON();
      expect(json.error.details.reason).toBe('Invalid pairing code');
    });
  });
});