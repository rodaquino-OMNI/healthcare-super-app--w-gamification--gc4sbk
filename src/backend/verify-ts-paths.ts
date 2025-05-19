import { Logger } from '@nestjs/common';

/**
 * Enhanced verification script to test TypeScript path resolution
 * This tests that our path aliases are working correctly across the monorepo
 * 
 * This script has been updated to verify the new @austa/* package imports
 * and standardized package structure as part of the refactoring effort.
 */
async function verifyPaths(): Promise<void> {
  const logger = new Logger('PathVerification');
  const results: Record<string, { success: boolean; error?: string; module?: string }> = {};
  
  try {
    // Legacy path aliases
    await verifyImport('@shared/logging/logger.service', 'Legacy shared utilities', results);
    await verifyImport('@gamification/app.module', 'Gamification engine module', results);
    
    // Try to import from @prisma (if applicable)
    try {
      const prismaModule = await import('@prisma/client');
      results['@prisma/client'] = { success: true, module: 'Prisma client' };
      logger.log('Successfully imported from @prisma/client');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results['@prisma/client'] = { success: false, error: errorMessage };
      logger.warn('Could not import from @prisma/client - this may be expected if @prisma alias is not used or @prisma/client is not installed');
    }
    
    // New standardized package imports
    await verifyImport('@austa/design-system', 'Design system components', results);
    await verifyImport('@design-system/primitives', 'Design system primitives', results);
    await verifyImport('@austa/interfaces', 'Shared TypeScript interfaces', results);
    await verifyImport('@austa/journey-context', 'Journey state management', results);
    
    // Standardized service path aliases
    await verifyImport('@app/auth', 'Auth service module', results);
    await verifyImport('@app/shared', 'Shared utilities', results);
    
    // Log verification summary
    logger.log('Path verification summary:');
    let hasFailures = false;
    
    for (const [path, result] of Object.entries(results)) {
      if (result.success) {
        logger.log(`✅ ${path} - ${result.module}`);
      } else {
        hasFailures = true;
        logger.error(`❌ ${path} - ${result.error}`);
      }
    }
    
    if (hasFailures) {
      logger.error('Path verification completed with errors!');
      logger.error('Please check your tsconfig.json path mappings and ensure all packages are properly installed.');
      logger.error('For @austa/* packages, verify they are correctly referenced in your workspace configuration.');
      process.exit(1);
    } else {
      logger.log('Path verification completed successfully!');
    }
  } catch (error) {
    logDetailedError(error, logger);
    process.exit(1);
  }
}

/**
 * Helper function to verify an import and track the result
 */
async function verifyImport(
  path: string, 
  description: string, 
  results: Record<string, { success: boolean; error?: string; module?: string }>
): Promise<void> {
  const logger = new Logger('PathVerification');
  
  try {
    const module = await import(path);
    results[path] = { success: true, module: description };
    logger.log(`Successfully imported from ${path}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results[path] = { success: false, error: errorMessage };
    logger.warn(`Could not import from ${path}: ${errorMessage}`);
  }
}

/**
 * Helper function to log detailed error information
 */
function logDetailedError(error: unknown, logger: Logger): void {
  if (error instanceof Error) {
    logger.error(`Path verification failed: ${error.message}`);
    logger.error(error.stack);
    
    // Additional diagnostic information
    logger.error('Diagnostic information:');
    logger.error('- Check that all required packages are installed');
    logger.error('- Verify tsconfig.json contains correct path mappings');
    logger.error('- Ensure package.json has correct dependencies');
    logger.error('- Check for circular dependencies');
    
    // If it's a module resolution error, provide more specific guidance
    if (error.message.includes('Cannot find module')) {
      const moduleName = error.message.match(/Cannot find module '([^']+)'/)?.[1];
      if (moduleName) {
        logger.error(`Module resolution failed for: ${moduleName}`);
        logger.error('Possible solutions:');
        logger.error(`1. Install the package: npm install ${moduleName}`);
        logger.error(`2. Add path mapping in tsconfig.json for ${moduleName}`);
        logger.error(`3. Check if the import path is correct`);
      }
    }
  } else {
    logger.error(`Path verification failed: ${String(error)}`);
  }
}

verifyPaths();