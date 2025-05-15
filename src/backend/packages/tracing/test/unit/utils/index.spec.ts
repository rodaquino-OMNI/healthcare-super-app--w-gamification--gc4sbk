/**
 * @file Unit tests for the tracing utilities barrel file
 * 
 * These tests verify that all utility functions are properly exported from the barrel file,
 * ensuring that consumers of the package can import utility functions using the correct paths
 * and that the public API remains consistent.
 */

import * as tracingUtils from '../../../src/utils';

describe('Tracing Utilities Barrel File', () => {
  describe('Correlation Utilities', () => {
    it('should export TraceCorrelationInfo interface', () => {
      // We can't directly test interfaces, but we can verify the module has the expected structure
      expect(tracingUtils).toBeDefined();
    });

    it('should export extractTraceInfo function', () => {
      expect(tracingUtils.extractTraceInfo).toBeDefined();
      expect(typeof tracingUtils.extractTraceInfo).toBe('function');
    });

    it('should export createExternalCorrelationObject function', () => {
      expect(tracingUtils.createExternalCorrelationObject).toBeDefined();
      expect(typeof tracingUtils.createExternalCorrelationObject).toBe('function');
    });

    it('should export enrichLogWithTraceInfo function', () => {
      expect(tracingUtils.enrichLogWithTraceInfo).toBeDefined();
      expect(typeof tracingUtils.enrichLogWithTraceInfo).toBe('function');
    });

    it('should export enrichMetricWithTraceInfo function', () => {
      expect(tracingUtils.enrichMetricWithTraceInfo).toBeDefined();
      expect(typeof tracingUtils.enrichMetricWithTraceInfo).toBe('function');
    });

    it('should export createJourneyCorrelationInfo function', () => {
      expect(tracingUtils.createJourneyCorrelationInfo).toBeDefined();
      expect(typeof tracingUtils.createJourneyCorrelationInfo).toBe('function');
    });

    it('should export recordErrorWithTraceInfo function', () => {
      expect(tracingUtils.recordErrorWithTraceInfo).toBeDefined();
      expect(typeof tracingUtils.recordErrorWithTraceInfo).toBe('function');
    });

    it('should export formatTraceInfoForDisplay function', () => {
      expect(tracingUtils.formatTraceInfoForDisplay).toBeDefined();
      expect(typeof tracingUtils.formatTraceInfoForDisplay).toBe('function');
    });

    it('should re-export propagation from OpenTelemetry', () => {
      expect(tracingUtils.propagation).toBeDefined();
    });
  });

  describe('Span Attributes Utilities', () => {
    it('should export addCommonAttributes function', () => {
      expect(tracingUtils.addCommonAttributes).toBeDefined();
      expect(typeof tracingUtils.addCommonAttributes).toBe('function');
    });

    it('should export addHttpAttributes function', () => {
      expect(tracingUtils.addHttpAttributes).toBeDefined();
      expect(typeof tracingUtils.addHttpAttributes).toBe('function');
    });

    it('should export addDatabaseAttributes function', () => {
      expect(tracingUtils.addDatabaseAttributes).toBeDefined();
      expect(typeof tracingUtils.addDatabaseAttributes).toBe('function');
    });

    it('should export addHealthJourneyAttributes function', () => {
      expect(tracingUtils.addHealthJourneyAttributes).toBeDefined();
      expect(typeof tracingUtils.addHealthJourneyAttributes).toBe('function');
    });

    it('should export addCareJourneyAttributes function', () => {
      expect(tracingUtils.addCareJourneyAttributes).toBeDefined();
      expect(typeof tracingUtils.addCareJourneyAttributes).toBe('function');
    });

    it('should export addPlanJourneyAttributes function', () => {
      expect(tracingUtils.addPlanJourneyAttributes).toBeDefined();
      expect(typeof tracingUtils.addPlanJourneyAttributes).toBe('function');
    });

    it('should export addGamificationAttributes function', () => {
      expect(tracingUtils.addGamificationAttributes).toBeDefined();
      expect(typeof tracingUtils.addGamificationAttributes).toBe('function');
    });

    it('should export addErrorAttributes function', () => {
      expect(tracingUtils.addErrorAttributes).toBeDefined();
      expect(typeof tracingUtils.addErrorAttributes).toBe('function');
    });

    it('should export addPerformanceAttributes function', () => {
      expect(tracingUtils.addPerformanceAttributes).toBeDefined();
      expect(typeof tracingUtils.addPerformanceAttributes).toBe('function');
    });
  });

  describe('Context Propagation Utilities', () => {
    it('should export injectTraceContextIntoHttpHeaders function', () => {
      expect(tracingUtils.injectTraceContextIntoHttpHeaders).toBeDefined();
      expect(typeof tracingUtils.injectTraceContextIntoHttpHeaders).toBe('function');
    });

    it('should export extractTraceContextFromHttpHeaders function', () => {
      expect(tracingUtils.extractTraceContextFromHttpHeaders).toBeDefined();
      expect(typeof tracingUtils.extractTraceContextFromHttpHeaders).toBe('function');
    });

    it('should export injectTraceContextIntoKafkaHeaders function', () => {
      expect(tracingUtils.injectTraceContextIntoKafkaHeaders).toBeDefined();
      expect(typeof tracingUtils.injectTraceContextIntoKafkaHeaders).toBe('function');
    });

    it('should export extractTraceContextFromKafkaHeaders function', () => {
      expect(tracingUtils.extractTraceContextFromKafkaHeaders).toBeDefined();
      expect(typeof tracingUtils.extractTraceContextFromKafkaHeaders).toBe('function');
    });

    it('should export serializeTraceContext function', () => {
      expect(tracingUtils.serializeTraceContext).toBeDefined();
      expect(typeof tracingUtils.serializeTraceContext).toBe('function');
    });

    it('should export deserializeTraceContext function', () => {
      expect(tracingUtils.deserializeTraceContext).toBeDefined();
      expect(typeof tracingUtils.deserializeTraceContext).toBe('function');
    });

    it('should export addJourneyContext function', () => {
      expect(tracingUtils.addJourneyContext).toBeDefined();
      expect(typeof tracingUtils.addJourneyContext).toBe('function');
    });

    it('should export getCurrentTraceId function', () => {
      expect(tracingUtils.getCurrentTraceId).toBeDefined();
      expect(typeof tracingUtils.getCurrentTraceId).toBe('function');
    });

    it('should export getCurrentSpanId function', () => {
      expect(tracingUtils.getCurrentSpanId).toBeDefined();
      expect(typeof tracingUtils.getCurrentSpanId).toBe('function');
    });

    it('should export getTraceCorrelationInfo function', () => {
      expect(tracingUtils.getTraceCorrelationInfo).toBeDefined();
      expect(typeof tracingUtils.getTraceCorrelationInfo).toBe('function');
    });
  });

  describe('Tree-shaking support', () => {
    it('should allow importing individual functions directly', () => {
      // This test doesn't actually import individually, but verifies the structure
      // that enables tree-shaking. In a real application, users would import like:
      // import { addCommonAttributes } from '@austa/tracing/utils';
      expect(Object.keys(tracingUtils).length).toBeGreaterThan(0);
    });
  });
});