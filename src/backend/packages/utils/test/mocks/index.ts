/**
 * @file Centralized Export Point for Utility Mock Implementations
 * @description This barrel file exports all mock implementations in the utils/test/mocks directory,
 * providing a centralized import point for test dependencies. This simplifies test setups across
 * the application and enables consistent mocking patterns.
 */

// ===== Validation Mocks =====
/**
 * Mock implementations of validation libraries (class-validator, Yup, Zod, Joi)
 * used across the application. Enables testing of validation-dependent code without the
 * actual validation libraries.
 */
import validationMock, {
  ValidationMockConfig,
  ValidationRuleConfig,
  configureValidationMock,
  configureValidationRule,
  resetValidationMock,
  validate,
  validateOrReject,
  validateSync,
  ValidationError,
  // class-validator decorators
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsDate,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsPositive,
  IsNegative,
  Contains,
  IsInt,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  IsFQDN,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  IsDefined,
  ValidateNested,
  // Zod
  z,
  ZodError,
  // Joi
  Joi,
  JoiValidationError,
  // Yup
  yup,
  YupValidationError
} from './validation-mock';

// ===== File System Mocks =====
/**
 * Mock implementations of file system operations for testing file-dependent utilities
 * without accessing the actual filesystem. Includes mock versions of Node.js fs functions
 * with configurable behavior and content.
 */
import {
  FsMock,
  createMockFs,
  mockFs,
} from './fs-mock';

// ===== Environment Variable Mocks =====
/**
 * Configurable environment variable mocking system for testing environment-dependent code.
 * Enables simulation of different runtime environments without modifying actual environment variables.
 */
import {
  EnvMock,
  EnvMockConfig,
  JourneyEnvPreset,
  EnvPreset,
  journeyPresets,
  createEnvMock,
  createEnvMockWithPreset,
  createEnvMockWithJourneyPreset,
  createHealthJourneyEnvMock,
  createCareJourneyEnvMock,
  createPlanJourneyEnvMock
} from './env-mock';

// ===== String Utility Mocks =====
/**
 * Mock implementations of string utility functions used across the application.
 * Enables testing of string manipulation and validation code with configurable behavior.
 */
import StringMock, {
  StringMockConfig,
  FunctionCallTracker
} from './string-mock';

// ===== Date Utility Mocks =====
/**
 * Mock implementations of date utility functions for testing date-dependent code
 * without relying on the actual date-fns library or system clock.
 */
import {
  // Configuration functions
  resetDateMock,
  setMockDate,
  setDateValidityOverride,
  setFormatDateResult,
  setParseDateResult,
  setParseThrowBehavior,
  setJourneyFormatResult,
  setTimeAgoResult,
  setDateRangeResult,
  setLocalTimezone,
  // Date format constants
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  // Mock implementations
  formatDate,
  formatTime,
  formatDateTime,
  parseDate,
  isValidDate,
  getDateRange,
  calculateAge,
  formatDateRange,
  getTimeAgo,
  getDatesBetween,
  isSameDay,
  getLocalTimezone,
  formatRelativeDate,
  formatJourneyDate,
  isDateInRange
} from './date-mock';

// ===== HTTP Client Mocks =====
/**
 * Mock implementations of secure HTTP client utilities from secure-axios.ts.
 * Includes configurable mock versions of createSecureAxios and createInternalApiClient
 * functions that simulate SSRF protection without making actual HTTP requests.
 */
import {
  createMockSecureAxios,
  createMockInternalApiClient,
  createMockAxiosError
} from './axios-mock';

// Export all mocks organized by utility type
export {
  // Validation Mocks
  validationMock,
  ValidationMockConfig,
  ValidationRuleConfig,
  configureValidationMock,
  configureValidationRule,
  resetValidationMock,
  validate,
  validateOrReject,
  validateSync,
  ValidationError,
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsDate,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsPositive,
  IsNegative,
  Contains,
  IsInt,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  IsFQDN,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  IsDefined,
  ValidateNested,
  z,
  ZodError,
  Joi,
  JoiValidationError,
  yup,
  YupValidationError,
  
  // File System Mocks
  FsMock,
  createMockFs,
  mockFs,
  
  // Environment Variable Mocks
  EnvMock,
  EnvMockConfig,
  JourneyEnvPreset,
  EnvPreset,
  journeyPresets,
  createEnvMock,
  createEnvMockWithPreset,
  createEnvMockWithJourneyPreset,
  createHealthJourneyEnvMock,
  createCareJourneyEnvMock,
  createPlanJourneyEnvMock,
  
  // String Utility Mocks
  StringMock,
  StringMockConfig,
  FunctionCallTracker,
  
  // Date Utility Mocks
  resetDateMock,
  setMockDate,
  setDateValidityOverride,
  setFormatDateResult,
  setParseDateResult,
  setParseThrowBehavior,
  setJourneyFormatResult,
  setTimeAgoResult,
  setDateRangeResult,
  setLocalTimezone,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  formatDate,
  formatTime,
  formatDateTime,
  parseDate,
  isValidDate,
  getDateRange,
  calculateAge,
  formatDateRange,
  getTimeAgo,
  getDatesBetween,
  isSameDay,
  getLocalTimezone,
  formatRelativeDate,
  formatJourneyDate,
  isDateInRange,
  
  // HTTP Client Mocks
  createMockSecureAxios,
  createMockInternalApiClient,
  createMockAxiosError
};

/**
 * Convenience object that groups all mock utilities by category
 */
export const mocks = {
  validation: {
    validationMock,
    configureValidationMock,
    configureValidationRule,
    resetValidationMock,
    validate,
    validateOrReject,
    validateSync,
    ValidationError,
    z,
    ZodError,
    Joi,
    JoiValidationError,
    yup,
    YupValidationError,
    // Decorators are exported individually
  },
  
  fs: {
    FsMock,
    createMockFs,
    mockFs,
  },
  
  env: {
    EnvMock,
    EnvPreset,
    journeyPresets,
    createEnvMock,
    createEnvMockWithPreset,
    createEnvMockWithJourneyPreset,
    createHealthJourneyEnvMock,
    createCareJourneyEnvMock,
    createPlanJourneyEnvMock,
  },
  
  string: {
    StringMock,
  },
  
  date: {
    resetDateMock,
    setMockDate,
    setDateValidityOverride,
    setFormatDateResult,
    setParseDateResult,
    setParseThrowBehavior,
    setJourneyFormatResult,
    setTimeAgoResult,
    setDateRangeResult,
    setLocalTimezone,
    DEFAULT_DATE_FORMAT,
    DEFAULT_TIME_FORMAT,
    DEFAULT_DATETIME_FORMAT,
    DEFAULT_LOCALE,
    formatDate,
    formatTime,
    formatDateTime,
    parseDate,
    isValidDate,
    getDateRange,
    calculateAge,
    formatDateRange,
    getTimeAgo,
    getDatesBetween,
    isSameDay,
    getLocalTimezone,
    formatRelativeDate,
    formatJourneyDate,
    isDateInRange,
  },
  
  http: {
    createMockSecureAxios,
    createMockInternalApiClient,
    createMockAxiosError,
  },
};

// Default export for easier importing
export default mocks;