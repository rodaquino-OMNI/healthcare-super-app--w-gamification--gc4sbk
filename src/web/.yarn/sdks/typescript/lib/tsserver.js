/**
 * TypeScript Language Server Patch for Yarn PnP
 * 
 * This file extends TypeScript's module resolution capabilities to work seamlessly with
 * the monorepo's path aliases (@app/auth, @app/shared, @austa/*) and workspace packages.
 * 
 * It's crucial for enabling IDE features like auto-completion, go-to-definition, and
 * type checking across the monorepo, especially for the new packages (@austa/design-system,
 * @design-system/primitives, @austa/interfaces, and @austa/journey-context).
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Store the original functions
let originalServerHost = null;
let originalGetScriptFileNames = null;
let originalGetScriptVersion = null;
let originalGetScriptSnapshot = null;
let originalResolveModuleNames = null;

/**
 * Patch the TypeScript server to work with Yarn PnP
 * 
 * @param {object} ts - The TypeScript module
 */
function patchTypeScriptServer(ts) {
  if (!ts || !ts.server) {
    // TypeScript server not available, possibly running in a non-IDE context
    return;
  }
  
  const server = ts.server;
  
  // Patch the server host
  patchServerHost(server);
  
  // Patch the language service host
  patchLanguageServiceHost(server);
  
  console.log('Patched TypeScript server for Yarn PnP integration');
}

/**
 * Patch the TypeScript server host
 * 
 * @param {object} server - The TypeScript server module
 */
function patchServerHost(server) {
  // Get the original createServerHost function
  const originalCreateServerHost = server.createServerHost;
  
  // Override the createServerHost function
  server.createServerHost = function(args, sessionOptions) {
    // Create the original server host
    const host = originalCreateServerHost(args, sessionOptions);
    
    // Store the original functions
    originalServerHost = host;
    
    // Patch the server host functions
    patchFileExists(host);
    patchReadFile(host);
    patchResolveModuleNames(host);
    patchGetDirectories(host);
    
    return host;
  };
}

/**
 * Patch the TypeScript language service host
 * 
 * @param {object} server - The TypeScript server module
 */
function patchLanguageServiceHost(server) {
  // Get the original createLanguageServiceHost function
  const originalCreateLanguageServiceHost = server.createLanguageServiceHost;
  
  // Override the createLanguageServiceHost function
  server.createLanguageServiceHost = function(host, project, options) {
    // Create the original language service host
    const languageServiceHost = originalCreateLanguageServiceHost(host, project, options);
    
    // Store the original functions
    originalGetScriptFileNames = languageServiceHost.getScriptFileNames;
    originalGetScriptVersion = languageServiceHost.getScriptVersion;
    originalGetScriptSnapshot = languageServiceHost.getScriptSnapshot;
    
    // Patch the language service host functions
    patchGetScriptFileNames(languageServiceHost);
    patchGetScriptVersion(languageServiceHost);
    patchGetScriptSnapshot(languageServiceHost);
    
    return languageServiceHost;
  };
}

/**
 * Patch the fileExists function to handle virtual files
 * 
 * @param {object} host - The TypeScript server host
 */
function patchFileExists(host) {
  // Get the original fileExists function
  const originalFileExists = host.fileExists;
  
  // Override the fileExists function
  host.fileExists = function(fileName) {
    // Handle virtual files for the new packages
    if (isVirtualFile(fileName)) {
      return true;
    }
    
    // Fall back to the original function
    return originalFileExists.call(host, fileName);
  };
}

/**
 * Patch the readFile function to handle virtual files
 * 
 * @param {object} host - The TypeScript server host
 */
function patchReadFile(host) {
  // Get the original readFile function
  const originalReadFile = host.readFile;
  
  // Override the readFile function
  host.readFile = function(fileName) {
    // Handle virtual files for the new packages
    if (isVirtualFile(fileName)) {
      return getVirtualFileContent(fileName);
    }
    
    // Fall back to the original function
    return originalReadFile.call(host, fileName);
  };
}

/**
 * Patch the resolveModuleNames function to handle path aliases
 * 
 * @param {object} host - The TypeScript server host
 */
function patchResolveModuleNames(host) {
  // Get the original resolveModuleNames function
  originalResolveModuleNames = host.resolveModuleNames;
  
  // Override the resolveModuleNames function
  host.resolveModuleNames = function(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile) {
    // Process each module name
    const resolvedModules = moduleNames.map((moduleName, index) => {
      // Handle path aliases
      if (moduleName.startsWith('@')) {
        // Check for the new packages
        if (
          moduleName.startsWith('@austa/design-system') ||
          moduleName.startsWith('@design-system/primitives') ||
          moduleName.startsWith('@austa/interfaces') ||
          moduleName.startsWith('@austa/journey-context')
        ) {
          // Create a virtual resolved module
          return createVirtualResolvedModule(moduleName);
        }
        
        // Check for other path aliases
        if (
          moduleName.startsWith('@app/auth') ||
          moduleName.startsWith('@app/shared')
        ) {
          // Try to resolve the path alias
          const resolved = resolvePathAlias(moduleName, containingFile);
          if (resolved) {
            return resolved;
          }
        }
      }
      
      // Fall back to the original function for a single module
      const reusedName = reusedNames && reusedNames[index];
      return originalResolveModuleNames.call(
        host,
        [moduleNames[index]],
        containingFile,
        reusedName ? [reusedName] : undefined,
        redirectedReference,
        options,
        containingSourceFile
      )[0];
    });
    
    return resolvedModules;
  };
}

/**
 * Patch the getDirectories function to handle virtual directories
 * 
 * @param {object} host - The TypeScript server host
 */
function patchGetDirectories(host) {
  // Get the original getDirectories function
  const originalGetDirectories = host.getDirectories;
  
  // Override the getDirectories function
  host.getDirectories = function(directoryPath) {
    // Handle virtual directories for the new packages
    if (isVirtualDirectory(directoryPath)) {
      return getVirtualDirectories(directoryPath);
    }
    
    // Fall back to the original function
    return originalGetDirectories.call(host, directoryPath);
  };
}

/**
 * Patch the getScriptFileNames function to include virtual files
 * 
 * @param {object} host - The TypeScript language service host
 */
function patchGetScriptFileNames(host) {
  // Override the getScriptFileNames function
  host.getScriptFileNames = function() {
    // Get the original script file names
    const fileNames = originalGetScriptFileNames.call(host);
    
    // Add virtual files for the new packages
    const virtualFiles = getVirtualFiles();
    
    // Combine the arrays
    return [...fileNames, ...virtualFiles];
  };
}

/**
 * Patch the getScriptVersion function to handle virtual files
 * 
 * @param {object} host - The TypeScript language service host
 */
function patchGetScriptVersion(host) {
  // Override the getScriptVersion function
  host.getScriptVersion = function(fileName) {
    // Handle virtual files
    if (isVirtualFile(fileName)) {
      return '1'; // Virtual files never change
    }
    
    // Fall back to the original function
    return originalGetScriptVersion.call(host, fileName);
  };
}

/**
 * Patch the getScriptSnapshot function to handle virtual files
 * 
 * @param {object} host - The TypeScript language service host
 */
function patchGetScriptSnapshot(host) {
  // Override the getScriptSnapshot function
  host.getScriptSnapshot = function(fileName) {
    // Handle virtual files
    if (isVirtualFile(fileName)) {
      const content = getVirtualFileContent(fileName);
      return {
        getText: (start, end) => content.substring(start, end),
        getLength: () => content.length,
        getChangeRange: () => undefined
      };
    }
    
    // Fall back to the original function
    return originalGetScriptSnapshot.call(host, fileName);
  };
}

/**
 * Check if a file is a virtual file
 * 
 * @param {string} fileName - The file name to check
 * @returns {boolean} - True if the file is a virtual file
 */
function isVirtualFile(fileName) {
  // Normalize the file name
  const normalizedFileName = fileName.replace(/\\/g, '/');
  
  // Check if the file is a virtual file for the new packages
  return (
    normalizedFileName.includes('node_modules/@austa/design-system') ||
    normalizedFileName.includes('node_modules/@design-system/primitives') ||
    normalizedFileName.includes('node_modules/@austa/interfaces') ||
    normalizedFileName.includes('node_modules/@austa/journey-context')
  );
}

/**
 * Check if a directory is a virtual directory
 * 
 * @param {string} directoryPath - The directory path to check
 * @returns {boolean} - True if the directory is a virtual directory
 */
function isVirtualDirectory(directoryPath) {
  // Normalize the directory path
  const normalizedPath = directoryPath.replace(/\\/g, '/');
  
  // Check if the directory is a virtual directory for the new packages
  return (
    normalizedPath.includes('node_modules/@austa/design-system') ||
    normalizedPath.includes('node_modules/@design-system/primitives') ||
    normalizedPath.includes('node_modules/@austa/interfaces') ||
    normalizedPath.includes('node_modules/@austa/journey-context')
  );
}

/**
 * Get the content of a virtual file
 * 
 * @param {string} fileName - The file name
 * @returns {string} - The file content
 */
function getVirtualFileContent(fileName) {
  // Normalize the file name
  const normalizedFileName = fileName.replace(/\\/g, '/');
  
  // Generate content based on the file name
  if (normalizedFileName.endsWith('index.d.ts')) {
    if (normalizedFileName.includes('@austa/design-system')) {
      return generateDesignSystemTypes();
    } else if (normalizedFileName.includes('@design-system/primitives')) {
      return generatePrimitivesTypes();
    } else if (normalizedFileName.includes('@austa/interfaces')) {
      return generateInterfacesTypes();
    } else if (normalizedFileName.includes('@austa/journey-context')) {
      return generateJourneyContextTypes();
    }
  }
  
  // Default empty content
  return '';
}

/**
 * Get a list of virtual files
 * 
 * @returns {string[]} - The list of virtual files
 */
function getVirtualFiles() {
  return [
    'node_modules/@austa/design-system/index.d.ts',
    'node_modules/@design-system/primitives/index.d.ts',
    'node_modules/@austa/interfaces/index.d.ts',
    'node_modules/@austa/journey-context/index.d.ts'
  ];
}

/**
 * Get a list of virtual directories for a given path
 * 
 * @param {string} directoryPath - The directory path
 * @returns {string[]} - The list of virtual directories
 */
function getVirtualDirectories(directoryPath) {
  // Normalize the directory path
  const normalizedPath = directoryPath.replace(/\\/g, '/');
  
  // Generate directories based on the path
  if (normalizedPath.endsWith('node_modules/@austa')) {
    return ['design-system', 'interfaces', 'journey-context'];
  } else if (normalizedPath.endsWith('node_modules/@design-system')) {
    return ['primitives'];
  }
  
  // Default empty list
  return [];
}

/**
 * Create a virtual resolved module
 * 
 * @param {string} moduleName - The module name
 * @returns {object} - The resolved module
 */
function createVirtualResolvedModule(moduleName) {
  // Determine the package name and submodule name
  let packageName, subModuleName;
  
  if (moduleName.includes('/')) {
    const parts = moduleName.split('/');
    if (moduleName.startsWith('@')) {
      packageName = `${parts[0]}/${parts[1]}`;
      subModuleName = parts.slice(2).join('/');
    } else {
      packageName = parts[0];
      subModuleName = parts.slice(1).join('/');
    }
  } else {
    packageName = moduleName;
    subModuleName = '';
  }
  
  // Create the resolved file name
  const resolvedFileName = `node_modules/${packageName}/index.d.ts`;
  
  // Create the resolved module object
  return {
    resolvedFileName,
    isExternalLibraryImport: true,
    packageId: {
      name: packageName,
      subModuleName,
      version: '0.0.0'
    }
  };
}

/**
 * Resolve a path alias to a file path
 * 
 * @param {string} moduleName - The module name
 * @param {string} containingFile - The containing file
 * @returns {object|null} - The resolved module, or null if not found
 */
function resolvePathAlias(moduleName, containingFile) {
  // Define the path alias mappings
  const pathAliases = {
    '@app/auth': 'src/backend/auth-service',
    '@app/shared': 'src/backend/shared',
    '@austa/design-system': 'src/web/design-system',
    '@design-system/primitives': 'src/web/primitives',
    '@austa/interfaces': 'src/web/interfaces',
    '@austa/journey-context': 'src/web/journey-context'
  };
  
  // Find the matching alias
  let matchingAlias = null;
  let remainingPath = '';
  
  for (const [alias, target] of Object.entries(pathAliases)) {
    if (moduleName === alias) {
      matchingAlias = alias;
      remainingPath = '';
      break;
    } else if (moduleName.startsWith(`${alias}/`)) {
      matchingAlias = alias;
      remainingPath = moduleName.slice(alias.length + 1);
      break;
    }
  }
  
  if (!matchingAlias) {
    return null;
  }
  
  // Get the target path
  const targetPath = pathAliases[matchingAlias];
  
  // Determine the project root
  const projectRoot = findProjectRoot(containingFile);
  if (!projectRoot) {
    return null;
  }
  
  // Resolve the full path
  const fullPath = path.join(projectRoot, targetPath, remainingPath);
  
  // Try to find the file with various extensions
  const extensions = ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.json'];
  for (const ext of extensions) {
    const filePath = `${fullPath}${ext}`;
    if (fs.existsSync(filePath)) {
      return {
        resolvedFileName: filePath,
        isExternalLibraryImport: false
      };
    }
  }
  
  // Try to find an index file
  for (const ext of extensions) {
    const indexPath = path.join(fullPath, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return {
        resolvedFileName: indexPath,
        isExternalLibraryImport: false
      };
    }
  }
  
  return null;
}

/**
 * Find the project root directory
 * 
 * @param {string} filePath - The file path to start from
 * @returns {string|null} - The project root directory, or null if not found
 */
function findProjectRoot(filePath) {
  // Start from the directory containing the file
  let currentDir = path.dirname(filePath);
  const root = path.parse(currentDir).root;
  
  // Traverse up the directory tree
  while (currentDir !== root) {
    // Check for package.json
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Generate type definitions for the design system package
 * 
 * @returns {string} - The type definitions
 */
function generateDesignSystemTypes() {
  return `/**
 * @austa/design-system
 * Design system with journey-specific theming and component library
 */

declare module '@austa/design-system' {
  // Common components
  export * from '@austa/design-system/components';
  
  // Journey-specific components
  export * from '@austa/design-system/health';
  export * from '@austa/design-system/care';
  export * from '@austa/design-system/plan';
  export * from '@austa/design-system/gamification';
  
  // Charts
  export * from '@austa/design-system/charts';
  
  // Themes
  export * from '@austa/design-system/themes';
}

declare module '@austa/design-system/components' {
  // Basic components
  export const Accordion: React.FC<AccordionProps>;
  export const Avatar: React.FC<AvatarProps>;
  export const Badge: React.FC<BadgeProps>;
  export const Button: React.FC<ButtonProps>;
  export const Card: React.FC<CardProps>;
  export const Checkbox: React.FC<CheckboxProps>;
  export const DatePicker: React.FC<DatePickerProps>;
  export const Input: React.FC<InputProps>;
  export const Modal: React.FC<ModalProps>;
  export const ProgressBar: React.FC<ProgressBarProps>;
  export const ProgressCircle: React.FC<ProgressCircleProps>;
  
  // Component props
  export interface AccordionProps {}
  export interface AvatarProps {}
  export interface BadgeProps {}
  export interface ButtonProps {}
  export interface CardProps {}
  export interface CheckboxProps {}
  export interface DatePickerProps {}
  export interface InputProps {}
  export interface ModalProps {}
  export interface ProgressBarProps {}
  export interface ProgressCircleProps {}
}

declare module '@austa/design-system/health' {
  export const DeviceCard: React.FC<DeviceCardProps>;
  export const GoalCard: React.FC<GoalCardProps>;
  export const HealthChart: React.FC<HealthChartProps>;
  export const MetricCard: React.FC<MetricCardProps>;
  
  export interface DeviceCardProps {}
  export interface GoalCardProps {}
  export interface HealthChartProps {}
  export interface MetricCardProps {}
}

declare module '@austa/design-system/care' {
  export const AppointmentCard: React.FC<AppointmentCardProps>;
  
  export interface AppointmentCardProps {}
}

declare module '@austa/design-system/plan' {
  export const BenefitCard: React.FC<BenefitCardProps>;
  export const ClaimCard: React.FC<ClaimCardProps>;
  export const CoverageInfoCard: React.FC<CoverageInfoCardProps>;
  
  export interface BenefitCardProps {}
  export interface ClaimCardProps {}
  export interface CoverageInfoCardProps {}
}

declare module '@austa/design-system/gamification' {
  export const AchievementBadge: React.FC<AchievementBadgeProps>;
  export const AchievementNotification: React.FC<AchievementNotificationProps>;
  export const Leaderboard: React.FC<LeaderboardProps>;
  export const LevelIndicator: React.FC<LevelIndicatorProps>;
  export const QuestCard: React.FC<QuestCardProps>;
  export const RewardCard: React.FC<RewardCardProps>;
  export const XPCounter: React.FC<XPCounterProps>;
  
  export interface AchievementBadgeProps {}
  export interface AchievementNotificationProps {}
  export interface LeaderboardProps {}
  export interface LevelIndicatorProps {}
  export interface QuestCardProps {}
  export interface RewardCardProps {}
  export interface XPCounterProps {}
}

declare module '@austa/design-system/charts' {
  export const BarChart: React.FC<BarChartProps>;
  export const LineChart: React.FC<LineChartProps>;
  export const RadialChart: React.FC<RadialChartProps>;
  
  export interface BarChartProps {}
  export interface LineChartProps {}
  export interface RadialChartProps {}
}

declare module '@austa/design-system/themes' {
  export const useTheme: () => Theme;
  export const ThemeProvider: React.FC<ThemeProviderProps>;
  
  export interface Theme {}
  export interface ThemeProviderProps {}
}`;
}

/**
 * Generate type definitions for the primitives package
 * 
 * @returns {string} - The type definitions
 */
function generatePrimitivesTypes() {
  return `/**
 * @design-system/primitives
 * Fundamental design elements (colors, typography, spacing)
 */

declare module '@design-system/primitives' {
  // Components
  export * from '@design-system/primitives/components';
  
  // Design tokens
  export * from '@design-system/primitives/tokens';
}

declare module '@design-system/primitives/components' {
  export const Box: React.FC<BoxProps>;
  export const Icon: React.FC<IconProps>;
  export const Stack: React.FC<StackProps>;
  export const Text: React.FC<TextProps>;
  export const Touchable: React.FC<TouchableProps>;
  
  export interface BoxProps {}
  export interface IconProps {}
  export interface StackProps {}
  export interface TextProps {}
  export interface TouchableProps {}
}

declare module '@design-system/primitives/tokens' {
  export const colors: Colors;
  export const spacing: Spacing;
  export const typography: Typography;
  export const shadows: Shadows;
  export const radii: Radii;
  export const zIndices: ZIndices;
  
  export interface Colors {}
  export interface Spacing {}
  export interface Typography {}
  export interface Shadows {}
  export interface Radii {}
  export interface ZIndices {}
}`;
}

/**
 * Generate type definitions for the interfaces package
 * 
 * @returns {string} - The type definitions
 */
function generateInterfacesTypes() {
  return `/**
 * @austa/interfaces
 * Shared TypeScript interfaces for cross-journey data models
 */

declare module '@austa/interfaces' {
  export * from '@austa/interfaces/common';
  export * from '@austa/interfaces/auth';
  export * from '@austa/interfaces/health';
  export * from '@austa/interfaces/care';
  export * from '@austa/interfaces/plan';
  export * from '@austa/interfaces/gamification';
  export * from '@austa/interfaces/components';
  export * from '@austa/interfaces/themes';
  export * from '@austa/interfaces/api';
  export * from '@austa/interfaces/next';
  export * from '@austa/interfaces/notification';
}

declare module '@austa/interfaces/common' {
  export interface Pagination {}
  export interface SortOptions {}
  export interface FilterOptions {}
  export interface ApiResponse<T> {}
  export interface ErrorResponse {}
  
  export * from '@austa/interfaces/common/dto';
}

declare module '@austa/interfaces/common/dto' {
  export interface BaseDto {}
  export interface PaginatedResponseDto<T> {}
  export interface SortOptionsDto {}
  export interface FilterOptionsDto {}
}

declare module '@austa/interfaces/auth' {
  export interface User {}
  export interface Session {}
  export interface Token {}
  export interface Permission {}
  export interface Role {}
}

declare module '@austa/interfaces/health' {
  export interface HealthMetric {}
  export interface HealthGoal {}
  export interface MedicalEvent {}
  export interface DeviceConnection {}
}

declare module '@austa/interfaces/care' {
  export interface Appointment {}
  export interface Provider {}
  export interface Medication {}
  export interface Treatment {}
  export interface Symptom {}
  export interface TelemedicineSession {}
}

declare module '@austa/interfaces/plan' {
  export interface Plan {}
  export interface Benefit {}
  export interface Coverage {}
  export interface Claim {}
  export interface Document {}
}

declare module '@austa/interfaces/gamification' {
  export interface Profile {}
  export interface Achievement {}
  export interface Quest {}
  export interface Reward {}
  export interface Rule {}
  export interface Event {}
  export interface Leaderboard {}
}

declare module '@austa/interfaces/components' {
  export interface ComponentProps {}
  export interface FormProps {}
  export interface LayoutProps {}
  export interface NavigationProps {}
}

declare module '@austa/interfaces/themes' {
  export interface Theme {}
  export interface ThemeColors {}
  export interface ThemeTypography {}
  export interface ThemeSpacing {}
}

declare module '@austa/interfaces/api' {
  export interface ApiOptions {}
  export interface ApiHeaders {}
  export interface ApiError {}
  export interface ApiResponse<T> {}
}

declare module '@austa/interfaces/next' {
  export interface PageProps {}
  export interface LayoutProps {}
  export interface ApiContext {}
}

declare module '@austa/interfaces/notification' {
  export interface Notification {}
  export interface NotificationChannel {}
  export interface NotificationPreference {}
  export interface NotificationTemplate {}
}`;
}

/**
 * Generate type definitions for the journey-context package
 * 
 * @returns {string} - The type definitions
 */
function generateJourneyContextTypes() {
  return `/**
 * @austa/journey-context
 * Context provider for journey-specific state management
 */

declare module '@austa/journey-context' {
  export * from '@austa/journey-context/providers';
  export * from '@austa/journey-context/hooks';
  export * from '@austa/journey-context/types';
  export * from '@austa/journey-context/constants';
  export * from '@austa/journey-context/utils';
  export * from '@austa/journey-context/storage';
  export * from '@austa/journey-context/adapters';
}

declare module '@austa/journey-context/providers' {
  export const JourneyProvider: React.FC<JourneyProviderProps>;
  export const useJourneyContext: () => JourneyContext;
  
  export interface JourneyProviderProps {}
  export interface JourneyContext {}
}

declare module '@austa/journey-context/hooks' {
  export const useJourney: () => Journey;
  export const useJourneyNavigation: () => JourneyNavigation;
  export const useJourneyState: <T>() => JourneyState<T>;
  export const useJourneyEvents: () => JourneyEvents;
  
  export interface Journey {}
  export interface JourneyNavigation {}
  export interface JourneyState<T> {}
  export interface JourneyEvents {}
}

declare module '@austa/journey-context/types' {
  export type JourneyType = 'health' | 'care' | 'plan';
  export type JourneyStatus = 'active' | 'completed' | 'pending';
  export type JourneyEvent = 'start' | 'progress' | 'complete' | 'abandon';
  
  export interface JourneyConfig {}
  export interface JourneyStep {}
  export interface JourneyData {}
  export interface JourneyMetadata {}
}

declare module '@austa/journey-context/constants' {
  export const JOURNEY_TYPES: Record<string, JourneyType>;
  export const JOURNEY_STATUSES: Record<string, JourneyStatus>;
  export const JOURNEY_EVENTS: Record<string, JourneyEvent>;
}

declare module '@austa/journey-context/utils' {
  export const createJourney: (config: JourneyConfig) => Journey;
  export const parseJourneyData: (data: unknown) => JourneyData;
  export const serializeJourneyState: (state: JourneyState<unknown>) => string;
  export const deserializeJourneyState: <T>(serialized: string) => JourneyState<T>;
}

declare module '@austa/journey-context/storage' {
  export const saveJourneyState: <T>(journeyId: string, state: JourneyState<T>) => Promise<void>;
  export const loadJourneyState: <T>(journeyId: string) => Promise<JourneyState<T> | null>;
  export const clearJourneyState: (journeyId: string) => Promise<void>;
  export const listJourneys: () => Promise<string[]>;
}

declare module '@austa/journey-context/adapters' {
  export * from '@austa/journey-context/adapters/web';
  export * from '@austa/journey-context/adapters/mobile';
}

declare module '@austa/journey-context/adapters/web' {
  export const WebJourneyAdapter: JourneyAdapter;
  export interface JourneyAdapter {}
}

declare module '@austa/journey-context/adapters/mobile' {
  export const MobileJourneyAdapter: JourneyAdapter;
  export interface JourneyAdapter {}
}`;
}

module.exports = {
  patchTypeScriptServer
};