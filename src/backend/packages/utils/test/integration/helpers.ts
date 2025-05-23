/**
 * Integration Test Helpers for @austa/utils
 * 
 * This file provides helper utilities and mocks specifically designed for integration testing
 * of the utils package. It focuses on testing the interaction between different utility modules
 * and provides shared functions for setting up test scenarios, creating test data, mocking
 * external dependencies, and validating results across different integration test suites.
 */

import axios, { AxiosResponse } from 'axios';
import { format, parse, addDays, subDays } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import * as fs from 'fs';
import * as path from 'path';

// Import utility modules for integration testing
import * as arrayUtils from '../../src/array';
import * as dateUtils from '../../src/date';
import * as httpUtils from '../../src/http';
import * as validationUtils from '../../src/validation';
import * as stringUtils from '../../src/string';
import * as objectUtils from '../../src/object';

// Import mocks for controlled testing
import { mockAxios } from '../mocks/axios-mock';
import { mockDateFns } from '../mocks/date-mock';
import { mockEnv } from '../mocks/env-mock';

// Journey types for journey-specific testing
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Integration test context that maintains state between test steps
 * and provides utilities for managing test lifecycle.
 */
export interface IntegrationTestContext {
  journey: JourneyType;
  testData: Record<string, any>;
  httpResponses: Record<string, any>;
  mockDate: Date;
  cleanup: () => void;
  reset: () => void;
}

/**
 * Creates a new integration test context with the specified journey type.
 * 
 * @param journey The journey type for this test context
 * @returns A configured test context with initialized state
 */
export function createTestContext(journey: JourneyType = JourneyType.HEALTH): IntegrationTestContext {
  // Initialize with default test data
  const context: IntegrationTestContext = {
    journey,
    testData: {},
    httpResponses: {},
    mockDate: new Date(),
    cleanup: () => {
      // Reset all mocks
      mockAxios.reset();
      mockDateFns.reset();
      mockEnv.reset();
      jest.clearAllMocks();
    },
    reset: () => {
      context.testData = {};
      context.httpResponses = {};
      context.mockDate = new Date();
    },
  };

  return context;
}

/**
 * HTTP Response Factory
 * 
 * Creates mock HTTP responses for testing HTTP utility integration with other modules.
 */
export interface HttpResponseOptions {
  status?: number;
  data?: any;
  headers?: Record<string, string>;
  delay?: number;
  errorMessage?: string;
}

/**
 * Creates a mock HTTP response for testing HTTP utilities.
 * 
 * @param options Configuration options for the mock response
 * @returns A mock Axios response object
 */
export function createMockHttpResponse(options: HttpResponseOptions = {}): AxiosResponse {
  const {
    status = 200,
    data = {},
    headers = { 'content-type': 'application/json' },
    delay = 0,
  } = options;

  return {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers,
    data,
    config: {
      url: 'https://api.example.com/test',
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    },
  } as AxiosResponse;
}

/**
 * Configures mock HTTP responses for specific endpoints.
 * 
 * @param endpoints Map of URL patterns to response configurations
 */
export function setupMockHttpEndpoints(endpoints: Record<string, HttpResponseOptions>): void {
  Object.entries(endpoints).forEach(([urlPattern, options]) => {
    mockAxios.onCall(urlPattern).respond(createMockHttpResponse(options));
  });
}

/**
 * Data Generation Utilities
 * 
 * These functions create test data that combines multiple utility types
 * for integration testing scenarios.
 */

/**
 * Test data generator for health journey metrics.
 * 
 * @param count Number of data points to generate
 * @param startDate Base date for the time series
 * @returns Array of health metric data points
 */
export function generateHealthMetrics(count: number, startDate: Date = new Date()): any[] {
  return Array.from({ length: count }, (_, index) => {
    const date = dateUtils.addDays(startDate, -index);
    const formattedDate = dateUtils.formatDate(date, 'yyyy-MM-dd');
    
    return {
      id: `metric-${index}`,
      date: formattedDate,
      timestamp: date.toISOString(),
      value: Math.round(Math.random() * 100) / 10,
      unit: 'mg/dL',
      type: 'glucose',
      source: index % 3 === 0 ? 'manual' : 'device',
      deviceId: index % 3 === 0 ? null : `device-${index % 5}`,
      userId: 'test-user-id',
      isValid: validationUtils.isNumber(index) && index >= 0,
    };
  });
}

/**
 * Test data generator for care journey appointments.
 * 
 * @param count Number of appointments to generate
 * @param startDate Base date for the appointments
 * @returns Array of appointment data
 */
export function generateCareAppointments(count: number, startDate: Date = new Date()): any[] {
  const specialties = ['Cardiologia', 'Neurologia', 'Ortopedia', 'Dermatologia', 'Oftalmologia'];
  const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
  
  return Array.from({ length: count }, (_, index) => {
    const appointmentDate = dateUtils.addDays(startDate, index + 1);
    // Ensure appointments are during business hours
    appointmentDate.setHours(9 + (index % 8), 0, 0, 0);
    
    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    return {
      id: `appointment-${index}`,
      patientId: 'test-patient-id',
      providerId: `provider-${index % 5}`,
      specialty: specialties[index % specialties.length],
      status: statuses[index % statuses.length],
      startTime: appointmentDate.toISOString(),
      endTime: endDate.toISOString(),
      formattedDate: dateUtils.formatDate(appointmentDate, 'PPP', 'pt-BR'),
      formattedTime: dateUtils.formatTime(appointmentDate, 'p', 'pt-BR'),
      notes: `Appointment notes ${index}`,
      location: index % 2 === 0 ? 'in-person' : 'telemedicine',
      isValid: validationUtils.isDateInRange(appointmentDate, {
        min: new Date(),
        max: dateUtils.addDays(new Date(), 90),
      }),
    };
  });
}

/**
 * Test data generator for plan journey insurance claims.
 * 
 * @param count Number of claims to generate
 * @param startDate Base date for the claims
 * @returns Array of insurance claim data
 */
export function generatePlanClaims(count: number, startDate: Date = new Date()): any[] {
  const claimTypes = ['medical', 'dental', 'pharmacy', 'vision', 'therapy'];
  const statuses = ['submitted', 'in-review', 'approved', 'denied', 'paid'];
  
  return Array.from({ length: count }, (_, index) => {
    const claimDate = dateUtils.subDays(startDate, index * 3);
    const processedDate = index % 4 === 3 ? null : dateUtils.addDays(claimDate, 5 + (index % 10));
    
    return {
      id: `claim-${index}`,
      memberId: 'test-member-id',
      policyNumber: `POL-${100000 + index}`,
      type: claimTypes[index % claimTypes.length],
      status: statuses[index % statuses.length],
      submissionDate: claimDate.toISOString(),
      processedDate: processedDate?.toISOString() || null,
      amount: Math.round(Math.random() * 10000) / 100,
      currency: 'BRL',
      formattedAmount: `R$ ${(Math.round(Math.random() * 10000) / 100).toFixed(2)}`,
      description: `Claim for ${claimTypes[index % claimTypes.length]} services`,
      providerName: `Provider ${index % 10}`,
      documents: Array.from({ length: index % 3 + 1 }, (_, i) => ({
        id: `doc-${index}-${i}`,
        filename: `document-${i}.pdf`,
        uploadDate: dateUtils.subDays(claimDate, i).toISOString(),
        type: i === 0 ? 'receipt' : i === 1 ? 'medical-report' : 'other',
      })),
      isValid: validationUtils.isNumber(index) && index >= 0,
    };
  });
}

/**
 * Creates a dataset that combines data from multiple journey types for
 * testing cross-journey functionality.
 * 
 * @param context The test context to populate with data
 * @returns The updated test context with cross-journey data
 */
export function generateCrossJourneyData(context: IntegrationTestContext): IntegrationTestContext {
  const baseDate = new Date();
  
  // Generate data for each journey type
  const healthMetrics = generateHealthMetrics(10, baseDate);
  const careAppointments = generateCareAppointments(5, baseDate);
  const planClaims = generatePlanClaims(8, baseDate);
  
  // Create a unified dataset with data from all journeys
  const crossJourneyData = {
    userId: 'test-user-id',
    journeys: {
      [JourneyType.HEALTH]: {
        metrics: healthMetrics,
        recentMetric: healthMetrics[0],
        metricsByDate: arrayUtils.groupBy(healthMetrics, 'date'),
      },
      [JourneyType.CARE]: {
        appointments: careAppointments,
        upcomingAppointment: careAppointments.find(a => a.status === 'scheduled'),
        appointmentsByStatus: arrayUtils.groupBy(careAppointments, 'status'),
      },
      [JourneyType.PLAN]: {
        claims: planClaims,
        recentClaim: planClaims[0],
        claimsByStatus: arrayUtils.groupBy(planClaims, 'status'),
      },
    },
    timeline: [
      ...healthMetrics.map(m => ({
        type: 'health-metric',
        journey: JourneyType.HEALTH,
        date: new Date(m.timestamp),
        data: m,
      })),
      ...careAppointments.map(a => ({
        type: 'appointment',
        journey: JourneyType.CARE,
        date: new Date(a.startTime),
        data: a,
      })),
      ...planClaims.map(c => ({
        type: 'claim',
        journey: JourneyType.PLAN,
        date: new Date(c.submissionDate),
        data: c,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()),
  };
  
  // Update the test context with the generated data
  context.testData = {
    ...context.testData,
    crossJourney: crossJourneyData,
  };
  
  return context;
}

/**
 * Module Integration Verification
 * 
 * These utilities help verify the correct integration between different utility modules.
 */

/**
 * Verifies that date formatting and HTTP utilities work together correctly.
 * 
 * @param context The test context
 * @returns A promise that resolves when the verification is complete
 */
export async function verifyDateAndHttpIntegration(context: IntegrationTestContext): Promise<void> {
  // Setup mock HTTP endpoint that expects formatted dates
  const today = new Date();
  const formattedDate = dateUtils.formatDate(today, 'yyyy-MM-dd');
  
  setupMockHttpEndpoints({
    [`https://api.example.com/data/${formattedDate}`]: {
      status: 200,
      data: { date: formattedDate, valid: true },
    },
  });
  
  // Create a secure HTTP client
  const client = httpUtils.createHttpClient({
    baseURL: 'https://api.example.com',
  });
  
  // Make a request using the formatted date
  const response = await client.get(`/data/${formattedDate}`);
  
  // Store the response in the context for assertions
  context.httpResponses.dateFormatting = response.data;
}

/**
 * Verifies that validation and array utilities work together correctly.
 * 
 * @param context The test context
 * @returns The updated context with validation results
 */
export function verifyValidationAndArrayIntegration(context: IntegrationTestContext): IntegrationTestContext {
  // Create test data with some invalid items
  const testItems = [
    { id: 1, value: 'valid', isValid: true },
    { id: 2, value: '', isValid: false },
    { id: 3, value: 'valid too', isValid: true },
    { id: 4, value: null, isValid: false },
    { id: 5, value: 'another valid', isValid: true },
  ];
  
  // Use validation to filter the array
  const validItems = testItems.filter(item => {
    return validationUtils.isString(item.value) && item.value.length > 0;
  });
  
  // Use array utilities to transform the results
  const groupedByValidity = arrayUtils.groupBy(testItems, 'isValid');
  const validItemsById = arrayUtils.keyBy(validItems, 'id');
  
  // Store results in the context
  context.testData.validationAndArray = {
    original: testItems,
    validItems,
    groupedByValidity,
    validItemsById,
  };
  
  return context;
}

/**
 * Verifies that string, object, and validation utilities work together correctly.
 * 
 * @param context The test context
 * @returns The updated context with validation results
 */
export function verifyStringObjectValidationIntegration(context: IntegrationTestContext): IntegrationTestContext {
  // Create test data with various string properties
  const testUser = {
    name: 'João Silva',
    email: 'joao.silva@example.com',
    cpf: '12345678909', // Invalid CPF
    phone: '(11) 98765-4321',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
  };
  
  // Validate and transform the object
  const validationResults = {
    isValidEmail: validationUtils.isEmail(testUser.email),
    isValidCpf: validationUtils.isValidCPF(testUser.cpf),
    isValidPhone: validationUtils.isString(testUser.phone) && testUser.phone.length >= 10,
    isValidZipCode: validationUtils.isString(testUser.address.zipCode) && 
      /^\d{5}-\d{3}$/.test(testUser.address.zipCode),
  };
  
  // Transform the object
  const transformedUser = {
    ...testUser,
    name: stringUtils.capitalizeFirstLetter(testUser.name),
    formattedPhone: testUser.phone.replace(/[^0-9]/g, ''),
    address: {
      ...testUser.address,
      fullAddress: `${testUser.address.street}, ${testUser.address.number} - ${testUser.address.city}/${testUser.address.state}`,
    },
  };
  
  // Store results in the context
  context.testData.stringObjectValidation = {
    original: testUser,
    validationResults,
    transformed: transformedUser,
    isValid: Object.values(validationResults).every(Boolean),
  };
  
  return context;
}

/**
 * Journey-Specific Test Helpers
 * 
 * These utilities provide journey-specific testing functionality.
 */

/**
 * Sets up a test environment specific to the Health journey.
 * 
 * @param context The test context to configure
 * @returns The configured test context
 */
export function setupHealthJourneyTest(context: IntegrationTestContext): IntegrationTestContext {
  // Set the journey type
  context.journey = JourneyType.HEALTH;
  
  // Generate health-specific test data
  context.testData.metrics = generateHealthMetrics(20);
  context.testData.metricsByDate = arrayUtils.groupBy(context.testData.metrics, 'date');
  context.testData.metricsByType = arrayUtils.groupBy(context.testData.metrics, 'type');
  
  // Configure mock HTTP endpoints for health journey
  setupMockHttpEndpoints({
    'https://api.example.com/health/metrics': {
      status: 200,
      data: { metrics: context.testData.metrics.slice(0, 10) },
    },
    'https://api.example.com/health/devices': {
      status: 200,
      data: { devices: [
        { id: 'device-1', name: 'Glucose Monitor', type: 'glucose', connected: true },
        { id: 'device-2', name: 'Blood Pressure Monitor', type: 'blood-pressure', connected: false },
      ]},
    },
  });
  
  return context;
}

/**
 * Sets up a test environment specific to the Care journey.
 * 
 * @param context The test context to configure
 * @returns The configured test context
 */
export function setupCareJourneyTest(context: IntegrationTestContext): IntegrationTestContext {
  // Set the journey type
  context.journey = JourneyType.CARE;
  
  // Generate care-specific test data
  context.testData.appointments = generateCareAppointments(15);
  context.testData.appointmentsByStatus = arrayUtils.groupBy(context.testData.appointments, 'status');
  context.testData.appointmentsByLocation = arrayUtils.groupBy(context.testData.appointments, 'location');
  
  // Configure mock HTTP endpoints for care journey
  setupMockHttpEndpoints({
    'https://api.example.com/care/appointments': {
      status: 200,
      data: { appointments: context.testData.appointments.slice(0, 5) },
    },
    'https://api.example.com/care/providers': {
      status: 200,
      data: { providers: [
        { id: 'provider-1', name: 'Dr. Ana Santos', specialty: 'Cardiologia', available: true },
        { id: 'provider-2', name: 'Dr. Carlos Oliveira', specialty: 'Neurologia', available: true },
        { id: 'provider-3', name: 'Dra. Mariana Costa', specialty: 'Dermatologia', available: false },
      ]},
    },
  });
  
  return context;
}

/**
 * Sets up a test environment specific to the Plan journey.
 * 
 * @param context The test context to configure
 * @returns The configured test context
 */
export function setupPlanJourneyTest(context: IntegrationTestContext): IntegrationTestContext {
  // Set the journey type
  context.journey = JourneyType.PLAN;
  
  // Generate plan-specific test data
  context.testData.claims = generatePlanClaims(12);
  context.testData.claimsByStatus = arrayUtils.groupBy(context.testData.claims, 'status');
  context.testData.claimsByType = arrayUtils.groupBy(context.testData.claims, 'type');
  
  // Configure mock HTTP endpoints for plan journey
  setupMockHttpEndpoints({
    'https://api.example.com/plan/claims': {
      status: 200,
      data: { claims: context.testData.claims.slice(0, 8) },
    },
    'https://api.example.com/plan/benefits': {
      status: 200,
      data: { benefits: [
        { id: 'benefit-1', name: 'Consultas Médicas', coverage: '100%', limit: 'Ilimitado' },
        { id: 'benefit-2', name: 'Exames Laboratoriais', coverage: '80%', limit: 'R$ 5.000,00/ano' },
        { id: 'benefit-3', name: 'Internação Hospitalar', coverage: '90%', limit: 'Até 30 dias/ano' },
      ]},
    },
  });
  
  return context;
}

/**
 * Utility function to clean up all mocks and test data after tests.
 * 
 * @param context The test context to clean up
 */
export function cleanupTestContext(context: IntegrationTestContext): void {
  context.cleanup();
}

/**
 * Export all test helpers for use in integration tests
 */
export default {
  createTestContext,
  createMockHttpResponse,
  setupMockHttpEndpoints,
  generateHealthMetrics,
  generateCareAppointments,
  generatePlanClaims,
  generateCrossJourneyData,
  verifyDateAndHttpIntegration,
  verifyValidationAndArrayIntegration,
  verifyStringObjectValidationIntegration,
  setupHealthJourneyTest,
  setupCareJourneyTest,
  setupPlanJourneyTest,
  cleanupTestContext,
  JourneyType,
};