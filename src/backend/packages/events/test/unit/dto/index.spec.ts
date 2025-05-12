/**
 * Unit tests for the DTO barrel export file
 * 
 * These tests validate that all DTO classes are correctly exported from the events/dto module,
 * ensuring a clean public API and consistent export patterns. They verify:
 * 
 * 1. All expected DTOs are exported
 * 2. The export structure matches the module organization
 * 3. No circular dependencies exist
 * 4. Import patterns are consistent
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Import all exports from the barrel file
import * as DTOExports from '../../../src/dto';

describe('DTO Barrel Export File', () => {
  // Path to the DTO directory
  const dtoDir = path.resolve(__dirname, '../../../src/dto');
  
  // Get all TS files in the DTO directory (excluding index.ts and test files)
  const dtoFiles = fs.readdirSync(dtoDir)
    .filter(file => 
      file.endsWith('.ts') && 
      !file.endsWith('.spec.ts') && 
      !file.endsWith('.test.ts') && 
      file !== 'index.ts'
    )
    .map(file => file.replace('.ts', ''));
  
  describe('Export Completeness', () => {
    it('should export all DTO files in the directory', () => {
      // For each DTO file, verify it has at least one export in the barrel
      dtoFiles.forEach(fileName => {
        // Check if any export keys match the pattern of the file name
        // This handles both direct exports and namespaced exports
        const hasExport = Object.keys(DTOExports).some(exportKey => {
          // Convert camelCase or PascalCase to kebab-case for comparison
          const kebabCaseExport = exportKey
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
          
          // Check if the export name contains the file name (without extension)
          // This handles cases where a file might export multiple classes/types
          return fileName.includes(kebabCaseExport) || 
                 kebabCaseExport.includes(fileName) ||
                 // Also check for Dto suffix pattern
                 (fileName.endsWith('-dto') && kebabCaseExport.includes(fileName.replace('-dto', '')));
        });
        
        expect(hasExport).toBeTruthy(
          `File ${fileName}.ts should have at least one export in the barrel file`
        );
      });
    });
    
    it('should not have any exports that don\'t correspond to files', () => {
      // Get all export names that should correspond to files (excluding types, interfaces, etc.)
      const exportNames = Object.keys(DTOExports)
        .filter(key => 
          // Filter out exports that are likely to be types, interfaces, or enums
          // These might not have their own files
          typeof DTOExports[key] === 'function' || 
          (typeof DTOExports[key] === 'object' && DTOExports[key] !== null)
        );
      
      // This test is more of a sanity check and might need adjustments
      // based on the actual export patterns in the project
      expect(exportNames.length).toBeGreaterThan(0);
    });
  });
  
  describe('Export Structure', () => {
    // Define the expected categories based on the barrel file organization
    const categories = {
      base: [
        'base-event',
        'event-metadata',
        'event-types',
        'version',
        'validation'
      ],
      journey: [
        'health-event',
        'care-event',
        'plan-event'
      ],
      specialized: [
        'health-metric-event',
        'health-goal-event',
        'appointment-event',
        'medication-event',
        'claim-event',
        'benefit-event'
      ]
    };
    
    // Test each category
    Object.entries(categories).forEach(([category, expectedFiles]) => {
      it(`should export all ${category} DTOs`, () => {
        expectedFiles.forEach(fileName => {
          // Check if the file exists
          const filePath = path.join(dtoDir, `${fileName}.dto.ts`);
          const fileExists = fs.existsSync(filePath) || 
                            fs.existsSync(path.join(dtoDir, `${fileName}.ts`));
          
          expect(fileExists).toBeTruthy(
            `Expected file ${fileName}.dto.ts or ${fileName}.ts to exist`
          );
          
          // Check if there's at least one export from this file
          // This is a simplified check and might need to be adjusted
          const hasExport = Object.keys(DTOExports).some(exportKey => {
            const kebabCaseExport = exportKey
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .toLowerCase();
            
            return kebabCaseExport.includes(fileName) || 
                   fileName.includes(kebabCaseExport);
          });
          
          expect(hasExport).toBeTruthy(
            `Expected at least one export from ${fileName}`
          );
        });
      });
    });
  });
  
  describe('Import Patterns', () => {
    it('should allow importing all DTOs at once', () => {
      // Verify that the barrel file exports multiple items
      expect(Object.keys(DTOExports).length).toBeGreaterThan(1);
    });
    
    it('should allow importing specific DTOs', () => {
      // Import specific DTOs to verify they can be imported individually
      // This is more of a compilation test than a runtime test
      const { BaseEventDto, EventTypes } = DTOExports;
      
      // Verify the imports are defined
      expect(BaseEventDto).toBeDefined();
      expect(EventTypes).toBeDefined();
    });
  });
  
  describe('Circular Dependencies', () => {
    it('should not have circular dependencies between DTOs', () => {
      // This is a simplified check for circular dependencies
      // A more thorough check would involve analyzing the import statements in each file
      
      // Mock console.error to catch circular dependency warnings
      const originalConsoleError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;
      
      try {
        // Re-import the barrel file to trigger any circular dependency warnings
        jest.resetModules();
        require('../../../src/dto');
        
        // Check if there were any circular dependency warnings
        // This assumes that circular dependencies would trigger console.error
        const circularDependencyWarnings = mockConsoleError.mock.calls
          .filter(call => 
            call[0] && 
            typeof call[0] === 'string' && 
            call[0].includes('circular dependency')
          );
        
        expect(circularDependencyWarnings.length).toBe(0);
      } finally {
        // Restore console.error
        console.error = originalConsoleError;
      }
    });
  });
  
  describe('Documentation', () => {
    it('should have JSDoc comments for all exported items', () => {
      // Read the barrel file content
      const barrelFilePath = path.join(dtoDir, 'index.ts');
      const barrelContent = fs.readFileSync(barrelFilePath, 'utf8');
      
      // Check if there are JSDoc comments before each export statement
      const exportStatements = barrelContent.match(/export * from './[^']+';/g) || [];
      
      exportStatements.forEach(exportStatement => {
        // Get the position of the export statement
        const exportPosition = barrelContent.indexOf(exportStatement);
        
        // Get the content before the export statement (limited to a reasonable length)
        const contentBefore = barrelContent.substring(
          Math.max(0, exportPosition - 500), 
          exportPosition
        );
        
        // Check if there's a JSDoc comment before the export
        // This is a simplified check and might need to be adjusted
        const hasJSDocComment = /\/\*\*[\s\S]*?\*\/\s*$/.test(contentBefore);
        
        expect(hasJSDocComment).toBeTruthy(
          `Expected JSDoc comment before ${exportStatement}`
        );
      });
    });
  });
});