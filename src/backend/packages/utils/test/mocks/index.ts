/**
 * Barrel file that exports all mock implementations in the utils/test/mocks directory.
 * Provides a centralized import point for test dependencies, simplifying test setups
 * across the application.
 */

// ===== Validation Mocks =====
export {
  // Mock configuration types
  ValidationMockConfig,
  ValidatorConfig,
  ValidationCall,
  
  // Mock control functions
  configureValidationMock,
  configureValidator,
  setValidationJourney,
  resetValidationMock,
  getValidationCalls,
  getValidatorCalls,
  clearValidationCalls,
  
  // class-validator mocks
  validate,
  validateSync,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsObject,
  ValidateNested,
  IsPositive,
  IsNegative,
  IsInt,
  IsUrl,
  
  // Zod mocks
  z,
  
  // Yup mocks
  yup,
  
  // Joi mocks
  Joi,
  
  // Journey-specific validation
  createJourneyValidation,
  healthValidation,
  careValidation,
  planValidation
} from './validation-mock';

// ===== File System Mocks =====
export {
  default as fsMock,
  FSMock,
  MockFileSystem,
  MockFileContent,
  MockFileStats,
  JourneyConfig
} from './fs-mock';

// ===== Environment Mocks =====
export {
  // Classes and interfaces
  EnvMock,
  MockedEnv,
  EnvPreset,
  JourneyEnvPreset,
  MockEnvOptions,
  
  // Constants
  ENV_PRESETS,
  JOURNEY_ENV_PRESETS,
  
  // Factory functions
  createMockEnv,
  createJourneyMockEnv,
  createDevMockEnv,
  createTestMockEnv,
  createProdMockEnv,
  
  // Utility functions
  withMockEnv,
  withJourneyMockEnv
} from './env-mock';

// ===== String Utility Mocks =====
export {
  // Configuration interfaces
  CapitalizeFirstLetterMockConfig,
  TruncateMockConfig,
  IsValidCPFMockConfig,
  
  // Mock classes
  CapitalizeFirstLetterMock,
  TruncateMock,
  IsValidCPFMock,
  
  // Factory functions
  createCapitalizeFirstLetterMock,
  createTruncateMock,
  createIsValidCPFMock,
  
  // Default instances
  capitalizeFirstLetterMock,
  truncateMock,
  isValidCPFMock,
  
  // Utility functions
  resetAllStringMocks,
  clearAllStringMocksHistory
} from './string-mock';

// ===== Date Utility Mocks =====
export {
  // Constants
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_LOCALE,
  
  // Mock service class
  MockDateService,
  mockDateService,
  
  // Individual mock functions
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
  
  // Utility functions
  resetDateMocks,
  setMockCurrentDate,
  setMockValidationBehavior
} from './date-mock';

// ===== HTTP Client Mocks =====
export {
  // Configuration interfaces
  MockAxiosConfig,
  
  // Factory functions
  createMockSecureAxios,
  createMockInternalApiClient,
  
  // Validators
  defaultSsrfValidator,
  
  // Response factories
  mockResponseFactory,
  
  // Default export as named export
  createMockSecureAxios as mockAxios
} from './axios-mock';

/**
 * Example usage:
 * 
 * ```typescript
 * // Import all mocks from a single point
 * import { 
 *   mockDateService, 
 *   fsMock, 
 *   createMockEnv, 
 *   mockAxios 
 * } from '@austa/utils/test/mocks';
 * 
 * describe('My Test Suite', () => {
 *   beforeEach(() => {
 *     // Reset all mocks before each test
 *     mockDateService.reset();
 *     fsMock.__reset();
 *   });
 * 
 *   it('should test something with mocked dependencies', () => {
 *     // Configure mocks
 *     mockDateService.setCurrentDate(new Date('2023-01-01'));
 *     fsMock.__setMockFiles({
 *       '/path/to/file.txt': 'file content'
 *     });
 *     
 *     // Run test with mocked dependencies
 *     // ...
 *   });
 * });
 * ```
 */