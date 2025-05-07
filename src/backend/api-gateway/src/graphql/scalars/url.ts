/**
 * URL Custom Scalar
 *
 * This file implements the URL custom scalar type for the GraphQL schema, providing
 * validation and normalization of URL values. It's critical for secure handling of
 * external links, resource locations, and API endpoints throughout the platform.
 *
 * Security features:
 * - Protocol restriction (only http/https allowed)
 * - Domain validation with optional whitelist
 * - Prevention of SSRF vulnerabilities through IP range checks
 * - Proper error handling for malformed URLs with detailed messages
 * - Protection against localhost and private network access
 *
 * The implementation uses type definitions from @austa/interfaces to ensure type safety
 * and consistency across the monorepo.
 *
 * Usage in GraphQL schema:
 * ```graphql
 * scalar URL
 *
 * type Resource {
 *   id: ID!
 *   name: String!
 *   url: URL!
 * }
 * ```
 *
 * This scalar can be used for any field that requires a valid URL, such as:
 * - External resource links
 * - API endpoints
 * - Document locations
 * - Image URLs
 * - Profile links
 */

import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';
import { URLScalarType } from '@austa/interfaces/api';

// Optional configuration for URL validation
interface URLValidationConfig {
  // List of allowed domains (if empty, all domains are allowed except blocked ones)
  allowedDomains?: string[];
  // List of blocked domains (always blocked regardless of allowedDomains)
  blockedDomains?: string[];
  // Whether to allow localhost URLs (default: false)
  allowLocalhost?: boolean;
  // Whether to allow private network URLs (default: false)
  allowPrivateNetworks?: boolean;
}

// Default configuration
const defaultConfig: URLValidationConfig = {
  allowedDomains: [],
  blockedDomains: [],
  allowLocalhost: false,
  allowPrivateNetworks: false,
};

// Current active configuration
const config: URLValidationConfig = { ...defaultConfig };

/**
 * Configure URL validation settings
 * This can be called during application initialization to set custom validation rules
 * 
 * @param newConfig - The configuration options to apply
 */
export const configureUrlValidation = (newConfig: Partial<URLValidationConfig>): void => {
  Object.assign(config, newConfig);
};

/**
 * Check if a URL is valid without throwing an error
 * Useful for validation in other parts of the application
 * 
 * @param url - The URL string to validate
 * @returns An object with validation result and optional error message
 */
export const isValidUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    validateUrl(url);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof GraphQLError ? error.message : 'Invalid URL' 
    };
  }
};

/**
 * Normalize a URL to ensure consistent format
 * If the URL is invalid, returns null
 * 
 * @param url - The URL string to normalize
 * @returns The normalized URL string or null if invalid
 */
export const normalizeUrl = (url: string): string | null => {
  try {
    return validateUrl(url);
  } catch (error) {
    return null;
  }
};

/**
 * Check if a hostname is a private IP address
 * 
 * @param hostname - The hostname to check
 * @returns True if the hostname is a private IP address
 */
const isPrivateIP = (hostname: string): boolean => {
  // Check if it's an IP address
  const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (!ipv4Pattern.test(hostname)) {
    return false;
  }
  
  // Check for localhost
  if (hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return true;
  }
  
  // Check for private IP ranges
  const parts = hostname.split('.').map(part => parseInt(part, 10));
  
  // Check for invalid IP parts
  if (parts.some(part => isNaN(part) || part < 0 || part > 255)) {
    return false;
  }
  
  // 10.0.0.0/8
  if (parts[0] === 10) {
    return true;
  }
  
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }
  
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) {
    return true;
  }
  
  // 169.254.0.0/16 (link-local)
  if (parts[0] === 169 && parts[1] === 254) {
    return true;
  }
  
  return false;
};

/**
 * Validates a URL string for security and correctness
 * 
 * @param url - The URL string to validate
 * @returns The validated and normalized URL string
 * @throws GraphQLError if the URL is invalid or potentially unsafe
 */
const validateUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    throw new GraphQLError('Invalid URL: URL must be a non-empty string');
  }

  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new GraphQLError(`Invalid URL format: ${error.message}`);
  }

  // Security check: Only allow http and https protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new GraphQLError(
      `Invalid URL protocol: Only http and https protocols are allowed, got ${parsedUrl.protocol}`
    );
  }
  
  const hostname = parsedUrl.hostname;
  
  // Check for localhost
  if (!config.allowLocalhost && 
      (hostname === 'localhost' || hostname.endsWith('.localhost'))) {
    throw new GraphQLError('Security violation: localhost URLs are not allowed');
  }
  
  // Check for private IP addresses (SSRF protection)
  if (!config.allowPrivateNetworks && isPrivateIP(hostname)) {
    throw new GraphQLError('Security violation: Private network URLs are not allowed');
  }
  
  // Check against blocked domains
  if (config.blockedDomains && config.blockedDomains.length > 0) {
    if (config.blockedDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`))) {
      throw new GraphQLError(`Security violation: Domain ${hostname} is blocked`);
    }
  }
  
  // Check against allowed domains whitelist (if configured)
  if (config.allowedDomains && config.allowedDomains.length > 0) {
    if (!config.allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`))) {
      throw new GraphQLError(
        `Security violation: Domain ${hostname} is not in the allowed domains whitelist`
      );
    }
  }
  
    // Return the normalized URL
  return parsedUrl.toString();
};

/**
 * GraphQL URL Scalar Type Implementation
 * 
 * Provides serialization, parsing, and validation for URL values in the GraphQL schema.
 */
export const URLScalar: URLScalarType = new GraphQLScalarType({
  name: 'URL',
  description: 'A URL scalar that validates and normalizes URL strings with security protections against SSRF attacks',
  
  // Convert internal value to JSON-compatible value
  serialize(value: unknown): string {
    return validateUrl(value as string);
  },
  
  // Convert JSON-compatible value to internal value
  parseValue(value: unknown): string {
    return validateUrl(value as string);
  },
  
  // Convert AST literal to internal value
  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `URL cannot represent a non-string value: ${ast.kind}`
      );
    }
    
    return validateUrl(ast.value);
  },
});

/**
 * GraphQL URL Scalar Type Implementation
 * 
 * Provides serialization, parsing, and validation for URL values in the GraphQL schema.
 */
export const URLScalar: URLScalarType = new GraphQLScalarType({
  name: 'URL',
  description: 'A URL scalar that validates and normalizes URL strings',
  
  // Convert internal value to JSON-compatible value
  serialize(value: unknown): string {
    return validateUrl(value as string);
  },
  
  // Convert JSON-compatible value to internal value
  parseValue(value: unknown): string {
    return validateUrl(value as string);
  },
  
  // Convert AST literal to internal value
  parseLiteral(ast): string {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `URL cannot represent a non-string value: ${ast.kind}`
      );
    }
    
    return validateUrl(ast.value);
  },
});