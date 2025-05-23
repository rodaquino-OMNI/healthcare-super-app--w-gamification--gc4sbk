/**
 * @file Unit tests for the DTO barrel export file
 * @description Validates proper export patterns and module organization
 */

import * as dtoExports from '../../../src/dto';

describe('DTO Barrel Exports', () => {
  // List of all expected DTO exports
  const expectedExports = [
    // Base/Core DTOs
    'BaseEventDto',
    'EventMetadataDto',
    'EventType',
    'VersionDto',
    'IsValidJourney',
    'IsValidEventType',
    
    // Journey-specific DTOs
    'HealthEventDto',
    'CareEventDto',
    'PlanEventDto',
    
    // Health Journey specialized DTOs
    'HealthMetricEventDto',
    'HealthGoalEventDto',
    
    // Care Journey specialized DTOs
    'AppointmentEventDto',
    'MedicationEventDto',
    
    // Plan Journey specialized DTOs
    'ClaimEventDto',
    'BenefitEventDto',
  ];

  it('should export all required DTO classes', () => {
    // Check that all expected exports are present
    for (const exportName of expectedExports) {
      expect(dtoExports).toHaveProperty(exportName);
    }
  });

  it('should not have unexpected exports', () => {
    // Get all actual exports
    const actualExports = Object.keys(dtoExports);
    
    // Check that there are no unexpected exports
    for (const exportName of actualExports) {
      expect(expectedExports).toContain(exportName);
    }
    
    // Check that the number of exports matches
    expect(actualExports.length).toBe(expectedExports.length);
  });

  it('should export classes with proper structure', () => {
    // Check that exported items are properly structured
    // Base DTOs should be classes with validation decorators
    expect(dtoExports.BaseEventDto).toBeDefined();
    expect(dtoExports.BaseEventDto.prototype).toBeDefined();
    expect(typeof dtoExports.BaseEventDto).toBe('function');
    
    // Journey DTOs should extend BaseEventDto
    expect(dtoExports.HealthEventDto.prototype instanceof dtoExports.BaseEventDto).toBe(true);
    expect(dtoExports.CareEventDto.prototype instanceof dtoExports.BaseEventDto).toBe(true);
    expect(dtoExports.PlanEventDto.prototype instanceof dtoExports.BaseEventDto).toBe(true);
    
    // Specialized DTOs should be properly structured
    expect(typeof dtoExports.HealthMetricEventDto).toBe('function');
    expect(typeof dtoExports.AppointmentEventDto).toBe('function');
    expect(typeof dtoExports.ClaimEventDto).toBe('function');
  });

  it('should have consistent naming patterns', () => {
    // Check that all DTOs follow the naming convention with 'Dto' suffix
    const dtosWithoutEnumsAndDecorators = expectedExports.filter(
      name => name !== 'EventType' && name !== 'IsValidJourney' && name !== 'IsValidEventType'
    );
    
    for (const dtoName of dtosWithoutEnumsAndDecorators) {
      expect(dtoName).toMatch(/Dto$/); // Should end with 'Dto'
    }
  });
});

describe('DTO Import Patterns', () => {
  it('should allow individual imports without circular dependencies', async () => {
    // Test that we can import individual files without circular dependency errors
    // This is done by dynamically importing each file
    
    // Base/Core DTOs
    await expect(import('../../../src/dto/base-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/event-metadata.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/event-types.enum')).resolves.not.toThrow();
    await expect(import('../../../src/dto/version.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/validation')).resolves.not.toThrow();
    
    // Journey-specific DTOs
    await expect(import('../../../src/dto/health-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/care-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/plan-event.dto')).resolves.not.toThrow();
    
    // Specialized DTOs
    await expect(import('../../../src/dto/health-metric-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/health-goal-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/appointment-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/medication-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/claim-event.dto')).resolves.not.toThrow();
    await expect(import('../../../src/dto/benefit-event.dto')).resolves.not.toThrow();
  });

  it('should maintain proper import hierarchy', async () => {
    // Test that specialized DTOs import journey DTOs, and journey DTOs import base DTOs
    // This ensures the proper dependency hierarchy
    
    // Import specialized DTOs and check their imports
    const healthMetricModule = await import('../../../src/dto/health-metric-event.dto');
    const healthMetricSource = healthMetricModule.toString();
    
    // Check that health-metric-event.dto imports health-event.dto
    expect(healthMetricSource).toContain('health-event.dto');
    
    // Import journey DTOs and check their imports
    const healthEventModule = await import('../../../src/dto/health-event.dto');
    const healthEventSource = healthEventModule.toString();
    
    // Check that health-event.dto imports base-event.dto
    expect(healthEventSource).toContain('base-event.dto');
  });
});

describe('DTO Organization', () => {
  it('should organize exports according to the documented structure', () => {
    // Get the source code of the barrel file
    const fs = require('fs');
    const path = require('path');
    const barrelFilePath = path.resolve(__dirname, '../../../src/dto/index.ts');
    const barrelFileContent = fs.readFileSync(barrelFilePath, 'utf8');
    
    // Check that the file has the expected sections
    expect(barrelFileContent).toContain('// Base/Core DTOs');
    expect(barrelFileContent).toContain('// Journey-specific DTOs');
    expect(barrelFileContent).toContain('// Specialized Event DTOs');
    
    // Check that exports are in the correct sections
    const baseDtoSection = barrelFileContent.indexOf('// Base/Core DTOs');
    const journeyDtoSection = barrelFileContent.indexOf('// Journey-specific DTOs');
    const specializedDtoSection = barrelFileContent.indexOf('// Specialized Event DTOs');
    
    // Base DTOs should be exported before Journey DTOs
    const baseEventExport = barrelFileContent.indexOf("export * from './base-event.dto'");
    expect(baseEventExport).toBeGreaterThan(baseDtoSection);
    expect(baseEventExport).toBeLessThan(journeyDtoSection);
    
    // Journey DTOs should be exported before Specialized DTOs
    const healthEventExport = barrelFileContent.indexOf("export * from './health-event.dto'");
    expect(healthEventExport).toBeGreaterThan(journeyDtoSection);
    expect(healthEventExport).toBeLessThan(specializedDtoSection);
    
    // Specialized DTOs should be exported after Journey DTOs
    const healthMetricExport = barrelFileContent.indexOf("export * from './health-metric-event.dto'");
    expect(healthMetricExport).toBeGreaterThan(specializedDtoSection);
  });
});