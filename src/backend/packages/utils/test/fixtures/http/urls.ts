/**
 * URL fixtures for testing HTTP utilities, especially SSRF protection mechanisms.
 * These fixtures are designed to test the secure-axios utility's ability to detect
 * and block malicious request targets.
 */

/**
 * Interface for URL fixture collections
 */
export interface UrlFixtures {
  /** URLs that should be considered safe and allowed */
  safe: string[];
  /** URLs that should be considered unsafe and blocked */
  unsafe: string[];
}

/**
 * Interface for categorized URL fixtures
 */
export interface CategorizedUrlFixtures {
  /** Public domain URLs that should be allowed */
  publicDomains: string[];
  /** Valid public IP addresses that should be allowed */
  publicIpAddresses: string[];
  /** Private IP ranges that should be blocked (10.x.x.x, 172.16-31.x.x, 192.168.x.x) */
  privateIpRanges: string[];
  /** Localhost variants that should be blocked */
  localhost: string[];
  /** Loopback addresses that should be blocked */
  loopback: string[];
  /** Internal domain patterns that should be blocked */
  internalDomains: string[];
  /** URLs with encoded characters to attempt bypass */
  encodedUrls: string[];
  /** Edge cases that test boundary conditions */
  edgeCases: string[];
}

/**
 * Safe URLs that should pass SSRF validation
 */
export const SAFE_URLS: string[] = [
  'https://www.example.com',
  'https://api.github.com',
  'https://austa-health-api.com',
  'https://203.0.113.1', // TEST-NET-3 block (safe for examples)
  'https://198.51.100.1', // TEST-NET-2 block (safe for examples)
  'https://192.0.2.1', // TEST-NET-1 block (safe for examples)
  'https://www.example.com:8080/api/v1/health',
  'https://subdomain.example.org/path/to/resource?query=param',
  'https://user:password@example.com',
  'http://[2001:db8::1]', // IPv6 documentation prefix
  'https://xn--80akhbyknj4f.xn--p1ai', // Punycode domain
];

/**
 * Unsafe URLs that should be blocked by SSRF validation
 */
export const UNSAFE_URLS: string[] = [
  // Private IP ranges
  'http://10.0.0.1',
  'http://10.1.1.1:8080',
  'https://172.16.0.1',
  'https://172.20.10.100',
  'https://172.31.255.255',
  'http://192.168.0.1',
  'http://192.168.1.1:3000/api',
  
  // Localhost variants
  'http://localhost',
  'http://localhost:8080',
  'http://127.0.0.1',
  'http://127.0.0.1:3000/api',
  'http://127.1.1.1',
  'http://127.255.255.255',
  
  // Loopback addresses
  'http://0.0.0.0',
  'http://0.0.0.0:8080',
  'http://[::1]',
  'http://[::1]:8080',
  'http://[fe80::1]',
  'http://[fe80::1%eth0]', // With zone identifier
  
  // Internal domains
  'https://localhost.local',
  'https://server.local',
  'https://api.internal',
  'https://service.internal.company',
  'https://intranet',
  
  // Encoded URLs attempting to bypass filters
  'http://127.0.0.1%2f@example.com', // URL confusion with encoded slash
  'http://example.com@127.0.0.1', // URL confusion with @ symbol
  'http://127.0.0.1%09', // Encoded tab character
  'http://0177.0.0.1', // Octal representation of 127.0.0.1
  'http://0x7f.0.0.1', // Hex representation of 127.0.0.1
  'http://2130706433', // Decimal representation of 127.0.0.1
];

/**
 * Public domain URLs that should be allowed
 */
export const PUBLIC_DOMAIN_URLS: string[] = [
  'https://www.example.com',
  'https://api.github.com',
  'https://austa-health-api.com',
  'https://www.example.com:8080/api/v1/health',
  'https://subdomain.example.org/path/to/resource?query=param',
  'https://user:password@example.com',
  'https://xn--80akhbyknj4f.xn--p1ai', // Punycode domain
];

/**
 * Valid public IP addresses that should be allowed
 */
export const PUBLIC_IP_ADDRESSES: string[] = [
  'https://203.0.113.1', // TEST-NET-3 block (safe for examples)
  'https://198.51.100.1', // TEST-NET-2 block (safe for examples)
  'https://192.0.2.1', // TEST-NET-1 block (safe for examples)
  'http://[2001:db8::1]', // IPv6 documentation prefix
];

/**
 * Private IP ranges that should be blocked
 */
export const PRIVATE_IP_RANGES: string[] = [
  'http://10.0.0.1',
  'http://10.1.1.1:8080',
  'https://172.16.0.1',
  'https://172.20.10.100',
  'https://172.31.255.255',
  'http://192.168.0.1',
  'http://192.168.1.1:3000/api',
];

/**
 * Localhost variants that should be blocked
 */
export const LOCALHOST_URLS: string[] = [
  'http://localhost',
  'http://localhost:8080',
  'http://127.0.0.1',
  'http://127.0.0.1:3000/api',
  'http://127.1.1.1',
  'http://127.255.255.255',
];

/**
 * Loopback addresses that should be blocked
 */
export const LOOPBACK_URLS: string[] = [
  'http://0.0.0.0',
  'http://0.0.0.0:8080',
  'http://[::1]',
  'http://[::1]:8080',
  'http://[fe80::1]',
  'http://[fe80::1%eth0]', // With zone identifier
];

/**
 * Internal domain patterns that should be blocked
 */
export const INTERNAL_DOMAIN_URLS: string[] = [
  'https://localhost.local',
  'https://server.local',
  'https://api.internal',
  'https://service.internal.company',
  'https://intranet',
];

/**
 * URLs with encoded characters attempting to bypass filters
 */
export const ENCODED_URLS: string[] = [
  'http://127.0.0.1%2f@example.com', // URL confusion with encoded slash
  'http://example.com@127.0.0.1', // URL confusion with @ symbol
  'http://127.0.0.1%09', // Encoded tab character
];

/**
 * Edge cases that test boundary conditions
 */
export const EDGE_CASE_URLS: string[] = [
  'http://0177.0.0.1', // Octal representation of 127.0.0.1
  'http://0x7f.0.0.1', // Hex representation of 127.0.0.1
  'http://2130706433', // Decimal representation of 127.0.0.1
];

/**
 * Categorized URL fixtures for comprehensive testing
 */
export const CATEGORIZED_URL_FIXTURES: CategorizedUrlFixtures = {
  publicDomains: PUBLIC_DOMAIN_URLS,
  publicIpAddresses: PUBLIC_IP_ADDRESSES,
  privateIpRanges: PRIVATE_IP_RANGES,
  localhost: LOCALHOST_URLS,
  loopback: LOOPBACK_URLS,
  internalDomains: INTERNAL_DOMAIN_URLS,
  encodedUrls: ENCODED_URLS,
  edgeCases: EDGE_CASE_URLS,
};

/**
 * Complete URL fixtures for testing SSRF protection
 */
export const URL_FIXTURES: UrlFixtures = {
  safe: SAFE_URLS,
  unsafe: UNSAFE_URLS,
};

export default URL_FIXTURES;