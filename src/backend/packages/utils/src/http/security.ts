/**
 * @file HTTP Security Utilities
 * @description Provides SSRF (Server-Side Request Forgery) protection utilities for HTTP clients.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from '@austa/logging';
import { URL } from 'url';
import * as net from 'net';
import * as dns from 'dns';

// Initialize logger
const logger = new Logger({ service: 'http-security' });

/**
 * IPv4 address ranges that should be blocked to prevent SSRF attacks
 * Based on IANA IPv4 Special-Purpose Address Registry
 * @see https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
 */
const BLOCKED_IPV4_RANGES = [
  // This network (RFC 1122)
  '0.0.0.0/8',
  
  // Private networks (RFC 1918)
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  
  // Localhost (RFC 1122)
  '127.0.0.0/8',
  
  // Link-local (RFC 3927)
  '169.254.0.0/16',
  
  // IETF Protocol Assignments (RFC 6890)
  '192.0.0.0/24',
  
  // TEST-NET-1 (RFC 5737)
  '192.0.2.0/24',
  
  // 6to4 Relay Anycast (RFC 3068)
  '192.88.99.0/24',
  
  // Network Interconnect Device Benchmark Testing (RFC 2544)
  '198.18.0.0/15',
  
  // TEST-NET-2 (RFC 5737)
  '198.51.100.0/24',
  
  // TEST-NET-3 (RFC 5737)
  '203.0.113.0/24',
  
  // Reserved for future use (RFC 1112)
  '240.0.0.0/4',
  
  // Broadcast (RFC 919)
  '255.255.255.255/32'
];

/**
 * IPv6 address ranges that should be blocked to prevent SSRF attacks
 * Based on IANA IPv6 Special-Purpose Address Registry
 * @see https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
 */
const BLOCKED_IPV6_RANGES = [
  // Localhost (RFC 4291)
  '::1/128',
  
  // Unspecified address (RFC 4291)
  '::/128',
  
  // IPv4-mapped addresses (RFC 4291)
  '::ffff:0:0/96',
  
  // Discard prefix (RFC 6666)
  '100::/64',
  
  // Unique Local Addresses (RFC 4193)
  'fc00::/7',
  
  // Link-local addresses (RFC 4291)
  'fe80::/10',
  
  // Site-local addresses - deprecated but still used (RFC 3879)
  'fec0::/10',
  
  // Multicast addresses (RFC 4291)
  'ff00::/8'
];

/**
 * Configuration options for SSRF protection
 */
export interface SSRFProtectionOptions {
  /**
   * IPv4 address ranges to block
   * @default BLOCKED_IPV4_RANGES
   */
  blockedIPv4Ranges?: string[];
  
  /**
   * IPv6 address ranges to block
   * @default BLOCKED_IPV6_RANGES
   */
  blockedIPv6Ranges?: string[];
  
  /**
   * Whether to allow requests to localhost
   * @default false
   */
  allowLocalhost?: boolean;
  
  /**
   * Whether to allow requests to private networks
   * @default false
   */
  allowPrivateNetworks?: boolean;
  
  /**
   * Additional hostnames to allow (bypasses IP validation)
   * @default []
   */
  allowedHostnames?: string[];
  
  /**
   * Whether to enable detailed logging for security violations
   * @default true
   */
  enableDetailedLogging?: boolean;
  
  /**
   * Whether to throw an error when a security violation is detected
   * @default true
   */
  throwOnViolation?: boolean;
}

/**
 * Default SSRF protection options
 */
const DEFAULT_SSRF_OPTIONS: SSRFProtectionOptions = {
  blockedIPv4Ranges: BLOCKED_IPV4_RANGES,
  blockedIPv6Ranges: BLOCKED_IPV6_RANGES,
  allowLocalhost: false,
  allowPrivateNetworks: false,
  allowedHostnames: [],
  enableDetailedLogging: true,
  throwOnViolation: true
};

/**
 * Checks if an IPv4 address is within a CIDR range
 * 
 * @param ip - The IPv4 address to check
 * @param cidr - The CIDR range to check against
 * @returns Whether the IP is within the CIDR range
 */
function isIPv4InCIDR(ip: string, cidr: string): boolean {
  const [range, bits = '32'] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  // Convert IP addresses to integers for comparison
  const ipInt = ip.split('.')
    .reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0) >>> 0;
  
  const rangeInt = range.split('.')
    .reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0) >>> 0;
  
  return (ipInt & mask) === (rangeInt & mask);
}

/**
 * Checks if an IPv6 address is within a CIDR range
 * 
 * @param ip - The IPv6 address to check
 * @param cidr - The CIDR range to check against
 * @returns Whether the IP is within the CIDR range
 */
function isIPv6InCIDR(ip: string, cidr: string): boolean {
  // Handle IPv4-mapped IPv6 addresses
  if (ip.startsWith('::ffff:')) {
    const ipv4Part = ip.substring(7);
    if (net.isIPv4(ipv4Part)) {
      // Check if the IPv4 part is in any of the blocked IPv4 ranges
      return BLOCKED_IPV4_RANGES.some(range => isIPv4InCIDR(ipv4Part, range));
    }
  }
  
  const [rangeText, bitsText] = cidr.split('/');
  const bits = parseInt(bitsText, 10);
  
  // Convert IP addresses to normalized form for comparison
  const normalizedIP = normalizeIPv6(ip);
  const normalizedRange = normalizeIPv6(rangeText);
  
  // Compare the first 'bits' bits of the addresses
  for (let i = 0; i < bits; i += 16) {
    const remainingBits = Math.min(16, bits - i);
    const pos = Math.floor(i / 16);
    
    const mask = 0xffff - ((1 << (16 - remainingBits)) - 1);
    
    const ipBlock = parseInt(normalizedIP.split(':')[pos], 16);
    const rangeBlock = parseInt(normalizedRange.split(':')[pos], 16);
    
    if ((ipBlock & mask) !== (rangeBlock & mask)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normalizes an IPv6 address to its full form
 * 
 * @param ip - The IPv6 address to normalize
 * @returns The normalized IPv6 address
 */
function normalizeIPv6(ip: string): string {
  // Handle the empty group case (::)
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const middle = Array(missing).fill('0000');
    const full = [...left, ...middle, ...right];
    return full.map(part => part.padStart(4, '0')).join(':');
  }
  
  // Already full form, just ensure 4 digits per group
  return ip.split(':').map(part => part.padStart(4, '0')).join(':');
}

/**
 * Checks if a hostname or IP address is allowed based on SSRF protection rules
 * 
 * @param hostname - The hostname or IP address to check
 * @param options - SSRF protection options
 * @returns Whether the hostname or IP is allowed
 */
async function isAllowedTarget(hostname: string, options: SSRFProtectionOptions): Promise<boolean> {
  // Check if hostname is in the allowed list
  if (options.allowedHostnames?.includes(hostname)) {
    return true;
  }
  
  // Allow localhost if configured
  if (options.allowLocalhost && 
      (hostname === 'localhost' || hostname === '::1' || hostname === '127.0.0.1')) {
    return true;
  }
  
  // Check if hostname is an IP address
  if (net.isIP(hostname)) {
    // For IPv4
    if (net.isIPv4(hostname)) {
      // Allow private networks if configured
      if (options.allowPrivateNetworks) {
        return true;
      }
      
      // Check against blocked IPv4 ranges
      for (const range of options.blockedIPv4Ranges || []) {
        if (isIPv4InCIDR(hostname, range)) {
          return false;
        }
      }
    }
    // For IPv6
    else if (net.isIPv6(hostname)) {
      // Allow private networks if configured
      if (options.allowPrivateNetworks) {
        return true;
      }
      
      // Check against blocked IPv6 ranges
      for (const range of options.blockedIPv6Ranges || []) {
        if (isIPv6InCIDR(hostname, range)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // For hostnames, resolve to IP addresses and check each one
  try {
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve(hostname, (err, addresses) => {
        if (err) {
          reject(err);
        } else {
          resolve(addresses);
        }
      });
    });
    
    // If any resolved IP is blocked, consider the hostname blocked
    for (const address of addresses) {
      if (!await isAllowedTarget(address, options)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    // DNS resolution error, log and allow by default
    if (options.enableDetailedLogging) {
      logger.warn(`Failed to resolve hostname: ${hostname}`, { error });
    }
    return true;
  }
}

/**
 * Creates a secure HTTP client with SSRF protection
 * 
 * @param options - SSRF protection options
 * @returns A configured Axios instance with SSRF protection
 */
export function createSecureHttpClient(options: SSRFProtectionOptions = {}): AxiosInstance {
  const mergedOptions: SSRFProtectionOptions = {
    ...DEFAULT_SSRF_OPTIONS,
    ...options
  };
  
  const instance = axios.create();
  
  // Add request interceptor to block private IP ranges
  instance.interceptors.request.use(async (config) => {
    if (!config.url) return config;
    
    try {
      const url = new URL(config.url, config.baseURL);
      const hostname = url.hostname;
      
      // Check if the hostname is allowed
      const isAllowed = await isAllowedTarget(hostname, mergedOptions);
      
      if (!isAllowed) {
        const errorMessage = `SSRF Protection: Blocked request to restricted target: ${hostname}`;
        
        if (mergedOptions.enableDetailedLogging) {
          logger.error(errorMessage, {
            url: config.url,
            baseURL: config.baseURL,
            hostname,
            method: config.method,
            headers: config.headers
          });
        }
        
        if (mergedOptions.throwOnViolation) {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('SSRF Protection')) {
        throw error;
      }
      
      // If there's an error parsing the URL, log and continue with the request
      if (mergedOptions.enableDetailedLogging) {
        logger.warn(`Error validating URL for SSRF protection: ${config.url}`, {
          error: error instanceof Error ? error.message : String(error),
          url: config.url,
          baseURL: config.baseURL
        });
      }
    }
    
    return config;
  });

  return instance;
}

/**
 * Creates a secure HTTP client with environment-specific SSRF protection
 * 
 * @returns A configured Axios instance with environment-specific SSRF protection
 */
export function createEnvironmentAwareSecureHttpClient(): AxiosInstance {
  const environment = process.env.NODE_ENV || 'development';
  
  // In development, allow localhost for easier testing
  if (environment === 'development') {
    return createSecureHttpClient({
      allowLocalhost: true,
      enableDetailedLogging: true
    });
  }
  
  // In test environment, allow localhost and private networks
  if (environment === 'test') {
    return createSecureHttpClient({
      allowLocalhost: true,
      allowPrivateNetworks: true,
      enableDetailedLogging: false
    });
  }
  
  // In production, use strict settings
  return createSecureHttpClient({
    allowLocalhost: false,
    allowPrivateNetworks: false,
    enableDetailedLogging: true
  });
}

export default createSecureHttpClient;