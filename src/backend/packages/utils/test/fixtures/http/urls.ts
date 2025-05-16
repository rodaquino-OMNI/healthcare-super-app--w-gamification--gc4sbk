/**
 * URL fixtures for testing HTTP utilities, especially SSRF protection mechanisms.
 * These fixtures are designed to test the secure-axios utility's ability to detect
 * and block potentially malicious request targets.
 */

/**
 * Interface for URL fixture collections
 */
export interface UrlFixtures {
  /** URLs that should be allowed by SSRF protection */
  safe: {
    /** Public domain URLs */
    publicDomains: string[];
    /** Valid public IP addresses */
    publicIps: string[];
  };
  /** URLs that should be blocked by SSRF protection */
  unsafe: {
    /** Private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x) */
    privateIps: string[];
    /** Localhost variants */
    localhost: string[];
    /** Internal domain patterns */
    internalDomains: string[];
    /** IPv6 loopback and link-local addresses */
    ipv6Special: string[];
  };
}

/**
 * Safe URLs that should pass SSRF protection
 */
export const safeUrls = {
  /**
   * Public domain URLs that should be allowed
   */
  publicDomains: [
    'https://example.com',
    'https://api.example.org/v1/resources',
    'http://subdomain.example.net/path?query=value',
    'https://multiple.subdomain.levels.example.com',
    'https://dash-separated-domain.com',
    'https://domain-with-port.com:8080',
    'https://www.gov.br',
    'https://austa-health.com',
  ],

  /**
   * Valid public IP addresses that should be allowed
   */
  publicIps: [
    'https://203.0.113.1',           // TEST-NET-3 block for documentation
    'https://198.51.100.1',           // TEST-NET-2 block for documentation
    'https://192.0.2.1',              // TEST-NET-1 block for documentation
    'http://198.51.100.1:8080/path',  // With port and path
    'https://[2001:db8::1]',          // IPv6 documentation prefix
    'https://[2001:db8::1]:8443',     // IPv6 with port
  ],
};

/**
 * Unsafe URLs that should be blocked by SSRF protection
 */
export const unsafeUrls = {
  /**
   * Private IP ranges that should be blocked
   */
  privateIps: [
    // Class A private range (10.0.0.0/8)
    'http://10.0.0.1',
    'https://10.10.10.10',
    'http://10.255.255.255',
    
    // Class B private range (172.16.0.0/12)
    'http://172.16.0.1',
    'https://172.16.10.10',
    'http://172.17.0.1',             // Common Docker container IP
    'https://172.20.10.15',
    'http://172.31.255.255',
    
    // Class C private range (192.168.0.0/16)
    'http://192.168.0.1',             // Common router IP
    'https://192.168.1.1',            // Common router IP
    'http://192.168.1.254',
    'https://192.168.0.10:8080',      // With port
    
    // Alternative notations for private IPs
    'http://0xA.0x0.0x0.0x1',         // Hex notation for 10.0.0.1
    'http://0xAC10.0x0.0x0.0x1',      // Hex notation for 172.16.0.1
    'http://0xC0A80001',              // Hex notation for 192.168.0.1
    'http://10.0.0.1:80',             // With explicit port
    'http://172.16.0.1:443',          // With explicit port
    'http://192.168.0.1:8080/path',   // With port and path
  ],

  /**
   * Localhost variants that should be blocked
   */
  localhost: [
    // Loopback addresses
    'http://127.0.0.1',
    'http://127.0.0.1:8080',
    'https://127.0.0.1',
    'http://127.1.1.1',               // Any 127.x.x.x is loopback
    'http://127.255.255.255',
    
    // Localhost names
    'http://localhost',
    'https://localhost',
    'http://localhost:8080',
    'https://localhost:3000/api',
    
    // Zero addresses
    'http://0.0.0.0',
    'https://0.0.0.0:8080',
    
    // Alternative notations for localhost
    'http://0x7f000001',              // Hex notation for 127.0.0.1
    'http://0x7f.0x0.0x0.0x1',        // Hex notation for 127.0.0.1
    'http://2130706433',              // Decimal notation for 127.0.0.1
    'http://0177.0.0.01',             // Octal notation for 127.0.0.1
  ],

  /**
   * Internal domain patterns that should be blocked
   */
  internalDomains: [
    'http://service.local',
    'https://api.local',
    'http://localhost.localdomain',
    'https://intranet.company',
    'http://host.internal',
    'https://service.internal',
    'http://machine.corp',
    'https://server.corp',
    'http://router.home',
    'https://nas.home',
    'http://printer.private',
    'https://server.private',
    'http://service.example.local',    // Subdomain with .local TLD
    'https://api.internal.example',    // Subdomain with .internal component
  ],

  /**
   * IPv6 loopback and link-local addresses that should be blocked
   */
  ipv6Special: [
    'http://[::1]',                   // IPv6 loopback
    'https://[::1]',
    'http://[::1]:8080',
    'https://[::1]:3000/api',
    'http://[fe80::1]',               // IPv6 link-local
    'https://[fe80::1]',
    'http://[fe80::1]:8080',
    'https://[fe80::1%eth0]',         // With zone index
    'http://[fe80:0000:0000:0000:0000:0000:0000:0001]', // Expanded notation
    'https://[0:0:0:0:0:0:0:1]',      // Compressed notation for ::1
  ],
};

/**
 * Complete collection of URL fixtures for testing
 */
export const urlFixtures: UrlFixtures = {
  safe: safeUrls,
  unsafe: unsafeUrls,
};

export default urlFixtures;