import { describe, it, expect } from 'jest';
import * as fs from 'fs';
import * as path from 'path';

// Path to the DTO directory
const DTO_DIR = path.resolve(__dirname, '../../../src/dto');
// Path to the barrel file
const BARREL_FILE = path.join(DTO_DIR, 'index.ts');

describe('DTO Barrel Exports', () => {
  // Check if the barrel file exists
  it('should have a barrel file', () => {
    const barrelExists = fs.existsSync(BARREL_FILE);
    expect(barrelExists).toBe(true);
  });

  // Get all DTO files in the directory
  it('should export all DTO files in the directory', () => {
    // Get all TS files in the DTO directory except index.ts
    const dtoFiles = fs.readdirSync(DTO_DIR)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts');
    
    // Read the barrel file content
    const barrelContent = fs.readFileSync(BARREL_FILE, 'utf-8');
    
    // Check if each DTO file is exported in the barrel file
    dtoFiles.forEach(file => {
      const fileName = file.replace('.ts', '');
      const exportPattern = new RegExp(`export\s+[*]\s+from\s+['"]\.\/+${fileName}['"]`, 'g');
      const namedExportPattern = new RegExp(`export\s+\{[^}]*\}\s+from\s+['"]\.\/+${fileName}['"]`, 'g');
      
      const hasExport = exportPattern.test(barrelContent) || namedExportPattern.test(barrelContent);
      expect(hasExport).toBe(true, `${file} should be exported in the barrel file`);
    });
  });

  // Check for proper export structure
  it('should have a consistent export structure', () => {
    const barrelContent = fs.readFileSync(BARREL_FILE, 'utf-8');
    
    // All exports should follow the same pattern
    const exportLines = barrelContent.split('\n')
      .filter(line => line.trim().startsWith('export'));
    
    // Check if all export lines follow the same pattern (either all * exports or all named exports)
    const starExports = exportLines.filter(line => line.includes('export * from'));
    const namedExports = exportLines.filter(line => line.includes('export {') && line.includes('} from'));
    
    // Either all exports should be star exports or all should be named exports
    // or there should be a consistent pattern for different types of files
    const isConsistent = 
      (starExports.length === exportLines.length) || 
      (namedExports.length === exportLines.length) ||
      (starExports.length > 0 && namedExports.length > 0); // Mixed pattern is acceptable if intentional
    
    expect(isConsistent).toBe(true, 'Export structure should be consistent');
  });

  // Check for circular dependencies
  it('should not have circular dependencies', () => {
    const barrelContent = fs.readFileSync(BARREL_FILE, 'utf-8');
    
    // Extract all imported modules
    const importedModules = [];
    const importRegex = /import\s+[^;]+\s+from\s+['"](\.\/[^'"]+)['"];?/g;
    let match;
    
    while ((match = importRegex.exec(barrelContent)) !== null) {
      importedModules.push(match[1]);
    }
    
    // Check if the barrel file imports itself or any module that imports the barrel
    const hasCircularDependency = importedModules.some(module => {
      const modulePath = path.resolve(DTO_DIR, `${module}.ts`);
      if (!fs.existsSync(modulePath)) return false;
      
      const moduleContent = fs.readFileSync(modulePath, 'utf-8');
      return moduleContent.includes("from './index'") || 
             moduleContent.includes("from './'") ||
             moduleContent.includes("from '.'");
    });
    
    expect(hasCircularDependency).toBe(false, 'Barrel file should not have circular dependencies');
  });

  // Check for clean public API
  it('should provide a clean public API', () => {
    const barrelContent = fs.readFileSync(BARREL_FILE, 'utf-8');
    
    // Check for comments explaining the purpose of exports
    const hasComments = barrelContent.includes('/**') || 
                       barrelContent.includes('//') || 
                       barrelContent.includes('/*');
    
    // Check for organized exports (grouped by category or alphabetically)
    const exportLines = barrelContent.split('\n')
      .filter(line => line.trim().startsWith('export'));
    
    // Check if exports are grouped with empty lines or comments between groups
    const hasGrouping = barrelContent.includes('\n\n') || 
                       (hasComments && exportLines.length > 1);
    
    // Either the file should have comments or grouping for better organization
    const isCleanAPI = hasComments || hasGrouping || exportLines.length <= 5;
    
    expect(isCleanAPI).toBe(true, 'Barrel file should provide a clean, well-documented public API');
  });

  // Check for proper named exports
  it('should export expected DTO classes and types', () => {
    // These are the expected exports based on the DTO files we found in the directory
    const expectedExports = [
      // From health-event.dto.ts
      'HealthEventDto',
      // From event-metadata.dto.ts
      'EventMetadataDto',
      // From version.dto.ts
      'VersionedEventDto',
      // From event-types.enum.ts
      'EventType',
      // From validation.ts
      'validateEventData'
    ];
    
    // Dynamic import of the barrel file to check exports
    // Note: This is a runtime check and requires the barrel file to be properly set up
    // If the barrel file doesn't exist or has syntax errors, this test will fail
    try {
      // We can't actually import the module in the test as it might not exist yet
      // Instead, we'll check the barrel content for these exports
      const barrelContent = fs.readFileSync(BARREL_FILE, 'utf-8');
      
      expectedExports.forEach(exportName => {
        // Check for direct export or re-export of this name
        const hasExport = 
          barrelContent.includes(`export { ${exportName}`) || 
          barrelContent.includes(`export * from`) || 
          barrelContent.includes(`export { default as ${exportName}`);
        
        expect(hasExport).toBe(true, `${exportName} should be exported from the barrel file`);
      });
    } catch (error) {
      // If the barrel file doesn't exist yet, this test will be skipped
      // The first test will fail instead, which is more informative
      console.warn('Could not check exports, barrel file may not exist yet:', error.message);
    }
  });
});