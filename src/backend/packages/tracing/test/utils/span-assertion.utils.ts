import { Span, SpanStatusCode } from '@opentelemetry/api';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { expect } from 'chai';

/**
 * Utility functions for asserting span properties in tests.
 * These utilities help verify that spans contain expected attributes,
 * follow the correct hierarchy, and maintain proper context information.
 */

/**
 * Asserts that a span contains all the expected attributes.
 * @param span The span to check
 * @param expectedAttributes Object containing expected attribute key-value pairs
 */
export function assertSpanHasAttributes(span: ReadableSpan, expectedAttributes: Record<string, any>): void {
  Object.entries(expectedAttributes).forEach(([key, value]) => {
    expect(span.attributes[key]).to.exist;
    expect(span.attributes[key]).to.deep.equal(value);
  });
}

/**
 * Asserts that a span has the expected status.
 * @param span The span to check
 * @param expectedStatus The expected status code
 * @param expectedMessage Optional expected status message
 */
export function assertSpanStatus(
  span: ReadableSpan, 
  expectedStatus: SpanStatusCode, 
  expectedMessage?: string
): void {
  expect(span.status.code).to.equal(expectedStatus);
  if (expectedMessage) {
    expect(span.status.message).to.equal(expectedMessage);
  }
}

/**
 * Asserts that a span has the expected name.
 * @param span The span to check
 * @param expectedName The expected span name
 */
export function assertSpanName(span: ReadableSpan, expectedName: string): void {
  expect(span.name).to.equal(expectedName);
}

/**
 * Asserts that a span has a specific event with optional attributes.
 * @param span The span to check
 * @param eventName The name of the event to find
 * @param expectedAttributes Optional attributes the event should have
 */
export function assertSpanHasEvent(
  span: ReadableSpan, 
  eventName: string, 
  expectedAttributes?: Record<string, any>
): void {
  const event = span.events.find(e => e.name === eventName);
  expect(event).to.exist;
  
  if (expectedAttributes && event) {
    Object.entries(expectedAttributes).forEach(([key, value]) => {
      expect(event.attributes?.[key]).to.exist;
      expect(event.attributes?.[key]).to.deep.equal(value);
    });
  }
}

/**
 * Asserts that a span has recorded an error.
 * @param span The span to check
 * @param errorMessage Optional specific error message to look for
 */
export function assertSpanHasError(span: ReadableSpan, errorMessage?: string): void {
  expect(span.status.code).to.equal(SpanStatusCode.ERROR);
  
  // Check for error event
  const errorEvent = span.events.find(e => e.name === 'exception');
  expect(errorEvent).to.exist;
  
  if (errorMessage && errorEvent) {
    expect(errorEvent.attributes?.['exception.message']).to.include(errorMessage);
  }
}

/**
 * Asserts that a span's duration is within expected bounds.
 * @param span The span to check
 * @param minDurationMs Minimum expected duration in milliseconds
 * @param maxDurationMs Maximum expected duration in milliseconds
 */
export function assertSpanDuration(
  span: ReadableSpan, 
  minDurationMs: number, 
  maxDurationMs: number
): void {
  const durationMs = (span.endTime.getTime() - span.startTime.getTime());
  expect(durationMs).to.be.at.least(minDurationMs);
  expect(durationMs).to.be.at.most(maxDurationMs);
}

/**
 * Asserts that a span is a child of another span.
 * @param childSpan The child span
 * @param parentSpan The parent span
 */
export function assertSpanIsChildOf(childSpan: ReadableSpan, parentSpan: ReadableSpan): void {
  expect(childSpan.parentSpanId).to.equal(parentSpan.spanContext().spanId);
  expect(childSpan.spanContext().traceId).to.equal(parentSpan.spanContext().traceId);
}

/**
 * Asserts that a span has the expected number of child spans.
 * @param spans Array of all spans in the trace
 * @param parentSpan The parent span
 * @param expectedChildCount Expected number of child spans
 */
export function assertSpanChildCount(
  spans: ReadableSpan[], 
  parentSpan: ReadableSpan, 
  expectedChildCount: number
): void {
  const childSpans = spans.filter(span => 
    span.parentSpanId === parentSpan.spanContext().spanId && 
    span.spanContext().traceId === parentSpan.spanContext().traceId
  );
  
  expect(childSpans.length).to.equal(expectedChildCount);
}

/**
 * Asserts that a span has the correct journey context attributes.
 * @param span The span to check
 * @param journeyType The type of journey ('health', 'care', or 'plan')
 * @param userId The expected user ID
 */
export function assertJourneyContext(
  span: ReadableSpan, 
  journeyType: 'health' | 'care' | 'plan', 
  userId: string
): void {
  expect(span.attributes['journey.type']).to.equal(journeyType);
  expect(span.attributes['journey.user.id']).to.equal(userId);
}

/**
 * Health journey specific span assertions.
 * @param span The span to check
 * @param expectedAttributes Expected health journey specific attributes
 */
export function assertHealthJourneySpan(
  span: ReadableSpan, 
  expectedAttributes: {
    metricType?: string;
    deviceId?: string;
    goalId?: string;
    insightId?: string;
  }
): void {
  expect(span.attributes['journey.type']).to.equal('health');
  
  if (expectedAttributes.metricType) {
    expect(span.attributes['health.metric.type']).to.equal(expectedAttributes.metricType);
  }
  
  if (expectedAttributes.deviceId) {
    expect(span.attributes['health.device.id']).to.equal(expectedAttributes.deviceId);
  }
  
  if (expectedAttributes.goalId) {
    expect(span.attributes['health.goal.id']).to.equal(expectedAttributes.goalId);
  }
  
  if (expectedAttributes.insightId) {
    expect(span.attributes['health.insight.id']).to.equal(expectedAttributes.insightId);
  }
}

/**
 * Care journey specific span assertions.
 * @param span The span to check
 * @param expectedAttributes Expected care journey specific attributes
 */
export function assertCareJourneySpan(
  span: ReadableSpan, 
  expectedAttributes: {
    providerId?: string;
    appointmentId?: string;
    medicationId?: string;
    telemedicineSessionId?: string;
  }
): void {
  expect(span.attributes['journey.type']).to.equal('care');
  
  if (expectedAttributes.providerId) {
    expect(span.attributes['care.provider.id']).to.equal(expectedAttributes.providerId);
  }
  
  if (expectedAttributes.appointmentId) {
    expect(span.attributes['care.appointment.id']).to.equal(expectedAttributes.appointmentId);
  }
  
  if (expectedAttributes.medicationId) {
    expect(span.attributes['care.medication.id']).to.equal(expectedAttributes.medicationId);
  }
  
  if (expectedAttributes.telemedicineSessionId) {
    expect(span.attributes['care.telemedicine.session.id']).to.equal(expectedAttributes.telemedicineSessionId);
  }
}

/**
 * Plan journey specific span assertions.
 * @param span The span to check
 * @param expectedAttributes Expected plan journey specific attributes
 */
export function assertPlanJourneySpan(
  span: ReadableSpan, 
  expectedAttributes: {
    planId?: string;
    benefitId?: string;
    claimId?: string;
    documentId?: string;
  }
): void {
  expect(span.attributes['journey.type']).to.equal('plan');
  
  if (expectedAttributes.planId) {
    expect(span.attributes['plan.id']).to.equal(expectedAttributes.planId);
  }
  
  if (expectedAttributes.benefitId) {
    expect(span.attributes['plan.benefit.id']).to.equal(expectedAttributes.benefitId);
  }
  
  if (expectedAttributes.claimId) {
    expect(span.attributes['plan.claim.id']).to.equal(expectedAttributes.claimId);
  }
  
  if (expectedAttributes.documentId) {
    expect(span.attributes['plan.document.id']).to.equal(expectedAttributes.documentId);
  }
}

/**
 * Asserts that a span has the correct trace context propagation attributes.
 * @param span The span to check
 * @param expectedServiceName The expected service name
 */
export function assertTraceContextPropagation(
  span: ReadableSpan, 
  expectedServiceName: string
): void {
  expect(span.attributes['service.name']).to.equal(expectedServiceName);
  expect(span.spanContext().isRemote).to.be.false;
  expect(span.spanContext().traceId).to.match(/[a-f0-9]{32}/);
  expect(span.spanContext().spanId).to.match(/[a-f0-9]{16}/);
}

/**
 * Asserts that a span has the expected performance characteristics.
 * @param span The span to check
 * @param expectedPerformanceAttributes Expected performance-related attributes
 */
export function assertSpanPerformance(
  span: ReadableSpan, 
  expectedPerformanceAttributes: {
    maxDurationMs?: number;
    criticalPath?: boolean;
    resourceUtilization?: 'low' | 'medium' | 'high';
  }
): void {
  if (expectedPerformanceAttributes.maxDurationMs) {
    const durationMs = (span.endTime.getTime() - span.startTime.getTime());
    expect(durationMs).to.be.at.most(expectedPerformanceAttributes.maxDurationMs);
  }
  
  if (expectedPerformanceAttributes.criticalPath !== undefined) {
    expect(span.attributes['performance.critical_path']).to.equal(expectedPerformanceAttributes.criticalPath);
  }
  
  if (expectedPerformanceAttributes.resourceUtilization) {
    expect(span.attributes['performance.resource_utilization']).to.equal(expectedPerformanceAttributes.resourceUtilization);
  }
}

/**
 * Finds all spans in a trace by a specific name.
 * @param spans Array of all spans
 * @param name The span name to search for
 * @returns Array of matching spans
 */
export function findSpansByName(spans: ReadableSpan[], name: string): ReadableSpan[] {
  return spans.filter(span => span.name === name);
}

/**
 * Finds the root span in a trace.
 * @param spans Array of all spans in the trace
 * @returns The root span or undefined if not found
 */
export function findRootSpan(spans: ReadableSpan[]): ReadableSpan | undefined {
  return spans.find(span => !span.parentSpanId);
}

/**
 * Finds all child spans of a given parent span.
 * @param spans Array of all spans in the trace
 * @param parentSpan The parent span
 * @returns Array of child spans
 */
export function findChildSpans(spans: ReadableSpan[], parentSpan: ReadableSpan): ReadableSpan[] {
  return spans.filter(span => 
    span.parentSpanId === parentSpan.spanContext().spanId && 
    span.spanContext().traceId === parentSpan.spanContext().traceId
  );
}