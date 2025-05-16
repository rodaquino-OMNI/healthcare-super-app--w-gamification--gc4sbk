/**
 * @file security.ts
 * @description Provides SSRF (Server-Side Request Forgery) protection utilities for HTTP clients.
 * This module implements request validation against private IP ranges, localhost, and other restricted targets.
 */

import { URL } from 'url';
import { isIP } from 'net';

/**
 * Configuration options for the SSRF protection
 */
export interface SSRFProtectionOptions {
  /**
   * Whether to block requests to private IP ranges
   * @default true
   */
  blockPrivateIPs?: boolean;
  
  /**
   * Whether to block requests to localhost
   * @default true
   */
  blockLocalhost?: boolean;
  
  /**
   * Whether to block requests to link-local addresses
   * @default true
   */
  blockLinkLocal?: boolean;
  
  /**
   * Whether to block requests to .local domains
   * @default true
   */
  blockDotLocal?: boolean;
  
  /**
   * Custom IP ranges to block in CIDR notation (e.g., '192.168.0.0/16')
   * @default []
   */
  customBlockedRanges?: string[];
  
  /**
   * Allowed hosts that bypass SSRF protection
   * @default []
   */
  allowedHosts?: string[];
  
  /**
   * Whether to log security violations
   * @default true
   */
  logViolations?: boolean;
}

/**
 * Default SSRF protection options
 */
const defaultOptions: SSRFProtectionOptions = {
  blockPrivateIPs: true,
  blockLocalhost: true,
  blockLinkLocal: true,
  blockDotLocal: true,
  customBlockedRanges: [],
  allowedHosts: [],
  logViolations: true
};

/**
 * Error thrown when a security violation is detected
 */
export class SSRFDetectionError extends Error {
  constructor(message: string, public readonly url: string, public readonly violationType: string) {
    super(message);
    this.name = 'SSRFDetectionError';
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SSRFDetectionError.prototype);
  }
}

/**
 * Checks if an IPv4 address is within a CIDR range
 * @param ip - The IP address to check
 * @param cidr - The CIDR range (e.g., '192.168.0.0/16')
 * @returns Whether the IP is in the CIDR range
 */
export function isIPv4InCIDR(ip: string, cidr: string): boolean {
  const [range, bits = '32'] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
  
  const ipInt = ip.split('.').reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0);
  const rangeInt = range.split('.').reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0);
  
  return (ipInt & mask) === (rangeInt & mask);
}

/**
 * Checks if an IPv6 address is within a CIDR range
 * @param ip - The IPv6 address to check
 * @param cidr - The CIDR range (e.g., '2001:db8::/32')
 * @returns Whether the IP is in the CIDR range
 */
export function isIPv6InCIDR(ip: string, cidr: string): boolean {
  // Convert IPv6 address to binary representation
  function ipv6ToBinary(addr: string): bigint {
    // Expand :: notation and pad each segment to 4 characters
    const expanded = addr.includes('::')
      ? addr.replace('::', ':' + '0000:'.repeat(8 - addr.split(':').filter(Boolean).length) + ':')
      : addr;
    
    // Convert each hexadecimal segment to a number and combine into a binary representation
    return expanded
      .split(':')
      .filter(Boolean)
      .reduce((acc, segment) => (acc << 16n) | BigInt(parseInt(segment, 16)), 0n);
  }
  
  const [range, bits = '128'] = cidr.split('/');
  const prefixLength = parseInt(bits, 10);
  const mask = ~((1n << (128n - BigInt(prefixLength))) - 1n);
  
  const ipBinary = ipv6ToBinary(ip);
  const rangeBinary = ipv6ToBinary(range);
  
  return (ipBinary & mask) === (rangeBinary & mask);
}

/**
 * Predefined IPv4 private address ranges
 */
const PRIVATE_IPV4_RANGES = [
  '10.0.0.0/8',      // Private network
  '172.16.0.0/12',   // Private network
  '192.168.0.0/16',  // Private network
  '127.0.0.0/8',     // Localhost
  '169.254.0.0/16',  // Link-local
  '0.0.0.0/8',       // Current network
  '100.64.0.0/10',   // Shared address space
  '192.0.0.0/24',    // IETF Protocol Assignments
  '192.0.2.0/24',    // TEST-NET-1
  '198.18.0.0/15',   // Network benchmark tests
  '198.51.100.0/24', // TEST-NET-2
  '203.0.113.0/24',  // TEST-NET-3
  '224.0.0.0/4',     // Multicast
  '240.0.0.0/4',     // Reserved
];

/**
 * Predefined IPv6 private address ranges
 */
const PRIVATE_IPV6_RANGES = [
  '::/128',          // Unspecified address
  '::1/128',         // Localhost
  'fe80::/10',       // Link-local
  'fc00::/7',        // Unique local address
  'ff00::/8',        // Multicast
  '2001:db8::/32',   // Documentation
  '2001:10::/28',    // ORCHID
  '2001:20::/28',    // ORCHIDv2
];

/**
 * Checks if a hostname is a private or restricted address
 * @param hostname - The hostname to check
 * @param options - SSRF protection options
 * @returns Whether the hostname is restricted
 */
export function isRestrictedHostname(hostname: string, options: SSRFProtectionOptions = defaultOptions): boolean {
  // Check if hostname is in allowed hosts list
  if (options.allowedHosts?.includes(hostname)) {
    return false;
  }
  
  // Check for localhost
  if (options.blockLocalhost && (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname === '0:0:0:0:0:0:0:1'
  )) {
    return true;
  }
  
  // Check for .local domain
  if (options.blockDotLocal && hostname.endsWith('.local')) {
    return true;
  }
  
  // Check if hostname is an IP address
  const ipVersion = isIP(hostname);
  if (ipVersion === 0) {
    // Not an IP address
    return false;
  }
  
  // Check IPv4 private ranges
  if (ipVersion === 4 && options.blockPrivateIPs) {
    for (const range of PRIVATE_IPV4_RANGES) {
      if (isIPv4InCIDR(hostname, range)) {
        return true;
      }
    }
  }
  
  // Check IPv6 private ranges
  if (ipVersion === 6 && options.blockPrivateIPs) {
    for (const range of PRIVATE_IPV6_RANGES) {
      if (isIPv6InCIDR(hostname, range)) {
        return true;
      }
    }
  }
  
  // Check custom blocked ranges
  if (options.customBlockedRanges?.length) {
    for (const range of options.customBlockedRanges) {
      if (
        (ipVersion === 4 && range.includes('.') && isIPv4InCIDR(hostname, range)) ||
        (ipVersion === 6 && range.includes(':') && isIPv6InCIDR(hostname, range))
      ) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Validates a URL against SSRF vulnerabilities
 * @param urlString - The URL to validate
 * @param baseUrl - Optional base URL for relative URLs
 * @param options - SSRF protection options
 * @throws {SSRFDetectionError} If the URL is restricted
 */
export function validateUrlAgainstSSRF(
  urlString: string,
  baseUrl?: string,
  options: SSRFProtectionOptions = defaultOptions
): void {
  try {
    const url = new URL(urlString, baseUrl);
    const hostname = url.hostname;
    
    if (isRestrictedHostname(hostname, options)) {
      const violationType = hostname === 'localhost' || hostname === '::1' 
        ? 'localhost' 
        : hostname.endsWith('.local')
          ? 'local-domain'
          : 'private-ip';
      
      const errorMessage = `SSRF Protection: Blocked request to restricted target: ${hostname}`;
      
      if (options.logViolations) {
        console.warn(`[Security Warning] ${errorMessage} (${violationType})`);
      }
      
      throw new SSRFDetectionError(errorMessage, urlString, violationType);
    }
  } catch (error) {
    if (error instanceof SSRFDetectionError) {
      throw error;
    }
    // If there's an error parsing the URL, it's likely invalid
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

/**
 * Creates a URL validator function that can be used with HTTP clients
 * @param options - SSRF protection options
 * @returns A function that validates URLs against SSRF vulnerabilities
 */
export function createUrlValidator(options: SSRFProtectionOptions = defaultOptions): (
  url: string,
  baseUrl?: string
) => void {
  return (url: string, baseUrl?: string) => validateUrlAgainstSSRF(url, baseUrl, options);
}

/**
 * Creates a secure HTTP client configuration with SSRF protection
 * This function is intended to be used with various HTTP clients like axios, fetch, etc.
 * 
 * @param options - SSRF protection options
 * @returns An object with utility functions for HTTP client security
 */
export function createSecureHttpClient(options: SSRFProtectionOptions = defaultOptions) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return {
    /**
     * Validates a URL against SSRF vulnerabilities
     */
    validateUrl: (url: string, baseUrl?: string) => validateUrlAgainstSSRF(url, baseUrl, mergedOptions),
    
    /**
     * Checks if a hostname is restricted
     */
    isRestrictedHost: (hostname: string) => isRestrictedHostname(hostname, mergedOptions),
    
    /**
     * The current security options
     */
    options: mergedOptions,
  };
}

export default createSecureHttpClient;