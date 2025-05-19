/**
 * HTTP Headers Test Fixtures
 * 
 * This module provides standardized collections of HTTP headers for testing request and response
 * processing in HTTP utilities. It includes common request headers, response headers, and specialized
 * headers for security testing, enabling consistent header handling tests throughout the codebase.
 */

/**
 * Interface for HTTP header collections with string values
 */
export interface HttpHeaders {
  [key: string]: string;
}

/**
 * Interface for HTTP header collections with string or string array values
 */
export interface HttpHeadersWithArrays {
  [key: string]: string | string[];
}

/**
 * Common Content-Type header values
 */
export const contentTypes = {
  /** application/json Content-Type header */
  json: 'application/json',
  /** application/x-www-form-urlencoded Content-Type header */
  formUrlEncoded: 'application/x-www-form-urlencoded',
  /** multipart/form-data Content-Type header */
  multipartFormData: 'multipart/form-data',
  /** text/plain Content-Type header */
  textPlain: 'text/plain',
  /** text/html Content-Type header */
  textHtml: 'text/html',
  /** application/xml Content-Type header */
  xml: 'application/xml',
  /** application/octet-stream Content-Type header */
  binary: 'application/octet-stream',
};

/**
 * Common Accept header values
 */
export const acceptTypes = {
  /** Accept: application/json header */
  json: 'application/json',
  /** Accept: text/html header */
  html: 'text/html',
  /** Accept: application/xml header */
  xml: 'application/xml',
  /** Accept: */* header (any content type) */
  any: '*/*',
  /** Accept: application/json, text/plain, */* header */
  jsonAndText: 'application/json, text/plain, */*',
};

/**
 * Common Authorization header values
 */
export const authorizationHeaders = {
  /** Bearer token authorization header */
  bearer: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  /** Basic authentication header */
  basic: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=', // username:password
  /** API key authorization header */
  apiKey: 'ApiKey a1b2c3d4e5f6g7h8i9j0',
  /** Invalid authorization header */
  invalid: 'InvalidAuth xyz123',
  /** Empty authorization header */
  empty: '',
};

/**
 * Common User-Agent header values
 */
export const userAgentHeaders = {
  /** Chrome browser on Windows User-Agent */
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  /** Firefox browser on macOS User-Agent */
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
  /** Safari browser on iOS User-Agent */
  safari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  /** AUSTA Mobile App User-Agent */
  austaApp: 'AUSTA-SuperApp/1.0.0 (iOS 15.0; iPhone)',
  /** Postman API testing tool User-Agent */
  postman: 'PostmanRuntime/7.28.0',
  /** Axios HTTP client User-Agent */
  axios: 'axios/0.21.1',
  /** Node.js HTTP client User-Agent */
  node: 'node-fetch/1.0',
};

/**
 * Common Cache-Control header values for requests
 */
export const requestCacheHeaders = {
  /** Cache-Control: no-cache header */
  noCache: 'no-cache',
  /** Cache-Control: no-store header */
  noStore: 'no-store',
  /** Cache-Control: max-age=0 header */
  maxAge0: 'max-age=0',
  /** Cache-Control: max-age=3600 header */
  maxAge1Hour: 'max-age=3600',
  /** Cache-Control: only-if-cached header */
  onlyIfCached: 'only-if-cached',
};

/**
 * Common Cache-Control header values for responses
 */
export const responseCacheHeaders = {
  /** Cache-Control: no-cache header */
  noCache: 'no-cache',
  /** Cache-Control: no-store header */
  noStore: 'no-store',
  /** Cache-Control: private, max-age=3600 header */
  private1Hour: 'private, max-age=3600',
  /** Cache-Control: public, max-age=86400 header */
  public1Day: 'public, max-age=86400',
  /** Cache-Control: must-revalidate, max-age=3600 header */
  mustRevalidate: 'must-revalidate, max-age=3600',
  /** Cache-Control: no-cache, no-store, must-revalidate header */
  noStoreNoCache: 'no-cache, no-store, must-revalidate',
};

/**
 * Common CORS header values
 */
export const corsHeaders = {
  /** Access-Control-Allow-Origin: * header */
  allowAnyOrigin: { 'Access-Control-Allow-Origin': '*' },
  /** Access-Control-Allow-Origin: https://austa.health header */
  allowSpecificOrigin: { 'Access-Control-Allow-Origin': 'https://austa.health' },
  /** Common CORS headers for preflight responses */
  preflight: {
    'Access-Control-Allow-Origin': 'https://austa.health',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  },
  /** CORS headers with credentials allowed */
  withCredentials: {
    'Access-Control-Allow-Origin': 'https://austa.health',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  },
};

/**
 * Security-related header values
 */
export const securityHeaders = {
  /** Content-Security-Policy header */
  contentSecurityPolicy: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://trusted-cdn.com; style-src 'self' https://trusted-cdn.com; img-src 'self' data: https://trusted-cdn.com",
  },
  /** X-XSS-Protection header */
  xssProtection: {
    'X-XSS-Protection': '1; mode=block',
  },
  /** X-Content-Type-Options header */
  noSniff: {
    'X-Content-Type-Options': 'nosniff',
  },
  /** X-Frame-Options header */
  frameOptions: {
    'X-Frame-Options': 'DENY',
  },
  /** Strict-Transport-Security header */
  hsts: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  },
  /** Referrer-Policy header */
  referrerPolicy: {
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
  /** All recommended security headers combined */
  recommended: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://trusted-cdn.com; style-src 'self' https://trusted-cdn.com; img-src 'self' data: https://trusted-cdn.com",
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
};

/**
 * Journey-specific header values
 */
export const journeyHeaders = {
  /** Health journey context header */
  health: {
    'X-Journey-Context': 'health',
    'X-Journey-Version': '1.0.0',
  },
  /** Care journey context header */
  care: {
    'X-Journey-Context': 'care',
    'X-Journey-Version': '1.0.0',
  },
  /** Plan journey context header */
  plan: {
    'X-Journey-Context': 'plan',
    'X-Journey-Version': '1.0.0',
  },
  /** Gamification context header */
  gamification: {
    'X-Journey-Context': 'gamification',
    'X-Journey-Version': '1.0.0',
  },
};

/**
 * Common request header collections for testing
 */
export const requestHeaders = {
  /** Minimal request headers */
  minimal: {
    'Accept': acceptTypes.json,
    'User-Agent': userAgentHeaders.austaApp,
  },
  /** JSON request headers */
  json: {
    'Content-Type': contentTypes.json,
    'Accept': acceptTypes.json,
    'User-Agent': userAgentHeaders.austaApp,
  },
  /** Form data request headers */
  formData: {
    'Content-Type': contentTypes.formUrlEncoded,
    'Accept': acceptTypes.json,
    'User-Agent': userAgentHeaders.austaApp,
  },
  /** Multipart form request headers */
  multipartForm: {
    'Content-Type': contentTypes.multipartFormData,
    'Accept': acceptTypes.json,
    'User-Agent': userAgentHeaders.austaApp,
  },
  /** Authenticated request headers with Bearer token */
  authenticated: {
    'Content-Type': contentTypes.json,
    'Accept': acceptTypes.json,
    'Authorization': authorizationHeaders.bearer,
    'User-Agent': userAgentHeaders.austaApp,
  },
  /** Request headers with API key authentication */
  apiKey: {
    'Content-Type': contentTypes.json,
    'Accept': acceptTypes.json,
    'Authorization': authorizationHeaders.apiKey,
    'User-Agent': userAgentHeaders.austaApp,
  },
  /** Request headers with no caching */
  noCache: {
    'Content-Type': contentTypes.json,
    'Accept': acceptTypes.json,
    'Cache-Control': requestCacheHeaders.noCache,
    'Pragma': 'no-cache',
    'User-Agent': userAgentHeaders.austaApp,
  },
};

/**
 * Common response header collections for testing
 */
export const responseHeaders = {
  /** Minimal response headers */
  minimal: {
    'Content-Type': contentTypes.json,
  },
  /** JSON response headers */
  json: {
    'Content-Type': contentTypes.json,
    'Content-Length': '1024',
  },
  /** HTML response headers */
  html: {
    'Content-Type': contentTypes.textHtml,
    'Content-Length': '2048',
  },
  /** Response headers with no caching */
  noCache: {
    'Content-Type': contentTypes.json,
    'Cache-Control': responseCacheHeaders.noStoreNoCache,
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  /** Response headers with caching */
  cached: {
    'Content-Type': contentTypes.json,
    'Cache-Control': responseCacheHeaders.public1Day,
    'ETag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
  },
  /** Response headers with CORS */
  cors: {
    'Content-Type': contentTypes.json,
    ...corsHeaders.withCredentials,
  },
  /** Response headers with security headers */
  secure: {
    'Content-Type': contentTypes.json,
    ...securityHeaders.recommended,
  },
};

/**
 * Header collections for specific test scenarios
 */
export const testScenarioHeaders = {
  /** Headers for testing SSRF protection */
  ssrfTesting: {
    /** Headers attempting to bypass SSRF protection with Host header */
    bypassWithHost: {
      'Host': 'internal-service.local',
      'X-Forwarded-Host': 'internal-service.local',
      'Content-Type': contentTypes.json,
    },
    /** Headers with suspicious referer */
    suspiciousReferer: {
      'Referer': 'http://localhost:3000/admin',
      'Content-Type': contentTypes.json,
    },
  },
  /** Headers for testing authentication */
  authTesting: {
    /** Headers with expired token */
    expiredToken: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzk5OTl9.f2HKBiRrZqB5QMYRGtPFJR0JdBGIVoVvRuVQdlJZo8A',
      'Content-Type': contentTypes.json,
    },
    /** Headers with malformed token */
    malformedToken: {
      'Authorization': 'Bearer invalid.token.format',
      'Content-Type': contentTypes.json,
    },
    /** Headers with missing token */
    missingToken: {
      'Content-Type': contentTypes.json,
    },
  },
  /** Headers for testing content negotiation */
  contentNegotiation: {
    /** Headers requesting JSON but accepting HTML as fallback */
    jsonWithHtmlFallback: {
      'Accept': 'application/json, text/html',
      'Content-Type': contentTypes.json,
    },
    /** Headers with quality values for content negotiation */
    qualityValues: {
      'Accept': 'application/json;q=0.9, text/html;q=0.8, */*;q=0.5',
      'Content-Type': contentTypes.json,
    },
    /** Headers requesting unsupported content type */
    unsupportedType: {
      'Accept': 'application/vnd.custom-format+json',
      'Content-Type': contentTypes.json,
    },
  },
  /** Headers for testing journey-specific functionality */
  journeyTesting: {
    /** Headers for health journey with authentication */
    healthJourney: {
      ...journeyHeaders.health,
      'Authorization': authorizationHeaders.bearer,
      'Content-Type': contentTypes.json,
    },
    /** Headers for care journey with authentication */
    careJourney: {
      ...journeyHeaders.care,
      'Authorization': authorizationHeaders.bearer,
      'Content-Type': contentTypes.json,
    },
    /** Headers for plan journey with authentication */
    planJourney: {
      ...journeyHeaders.plan,
      'Authorization': authorizationHeaders.bearer,
      'Content-Type': contentTypes.json,
    },
  },
};

/**
 * Headers with special characters or encoding challenges
 */
export const specialHeaders = {
  /** Headers with UTF-8 characters */
  utf8Characters: {
    'X-Custom-Header': 'Value with UTF-8 characters: áéíóúñ',
    'Content-Type': contentTypes.json,
  },
  /** Headers with very long values */
  longValues: {
    'X-Long-Header': 'a'.repeat(4096),
    'Content-Type': contentTypes.json,
  },
  /** Headers with empty values */
  emptyValues: {
    'X-Empty-Header': '',
    'Content-Type': contentTypes.json,
  },
};

/**
 * Default export for all header collections
 */
export default {
  contentTypes,
  acceptTypes,
  authorizationHeaders,
  userAgentHeaders,
  requestCacheHeaders,
  responseCacheHeaders,
  corsHeaders,
  securityHeaders,
  journeyHeaders,
  requestHeaders,
  responseHeaders,
  testScenarioHeaders,
  specialHeaders,
};