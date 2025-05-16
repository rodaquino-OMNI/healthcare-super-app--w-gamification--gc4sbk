/**
 * Type declarations for Next.js 14.2.0 server components
 * 
 * This file augments the 'next/server' module with project-specific type definitions
 * needed for server-side and edge-function code in the AUSTA SuperApp.
 */

declare module 'next/server' {
  /**
   * NextRequest extends the Web Request API with additional convenience methods
   * for handling cookies, headers, and URL manipulation.
   */
  export interface NextRequest extends Request {
    /**
     * Headers from the incoming request
     */
    readonly headers: Headers;

    /**
     * Original URL string of the request
     */
    readonly url: string;

    /**
     * Parsed URL object with Next.js specific properties
     */
    readonly nextUrl: URL & {
      /**
       * Pathname of the URL (e.g., /blog/123)
       */
      readonly pathname: string;
      
      /**
       * Base path of the URL if configured
       */
      readonly basePath: string;
      
      /**
       * Whether the URL has a trailing slash
       */
      readonly trailingSlash: boolean;
      
      /**
       * Locale information if i18n is configured
       */
      readonly locale?: {
        /**
         * The detected locale for the request
         */
        readonly locale: string;
        
        /**
         * All configured locales
         */
        readonly locales: string[];
        
        /**
         * The default locale
         */
        readonly defaultLocale: string;
      };
    };

    /**
     * Cookies from the request with convenience methods
     */
    readonly cookies: {
      /**
       * Get a cookie by name
       * @param name The name of the cookie to get
       * @returns The cookie value or undefined if not found
       */
      get(name: string): { name: string; value: string } | undefined;
      
      /**
       * Get all cookies with a specific name or all cookies if no name is provided
       * @param name Optional name of cookies to retrieve
       * @returns Array of cookie objects
       */
      getAll(name?: string): { name: string; value: string }[];
      
      /**
       * Check if a cookie exists
       * @param name The name of the cookie to check
       * @returns Whether the cookie exists
       */
      has(name: string): boolean;
      
      /**
       * Set a cookie
       * @param name The name of the cookie
       * @param value The value of the cookie
       * @param options Cookie options
       */
      set(name: string, value: string, options?: {
        path?: string;
        expires?: Date;
        maxAge?: number;
        domain?: string;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
      }): void;
      
      /**
       * Delete a cookie
       * @param name The name of the cookie to delete
       * @returns Whether the cookie was deleted
       */
      delete(name: string): boolean;
      
      /**
       * Delete all cookies
       */
      clear(): void;
    };

    /**
     * Geo information from the request (available in edge runtime)
     */
    readonly geo?: {
      /**
       * City of the request
       */
      city?: string;
      
      /**
       * Country of the request
       */
      country?: string;
      
      /**
       * Region/state of the request
       */
      region?: string;
      
      /**
       * Latitude of the request
       */
      latitude?: string;
      
      /**
       * Longitude of the request
       */
      longitude?: string;
    };

    /**
     * IP address of the request (available in edge runtime)
     */
    readonly ip?: string;
  }

  /**
   * NextFetchEvent extends the native FetchEvent object with additional methods
   * for handling background work after a response has been sent.
   */
  export interface NextFetchEvent {
    /**
     * The source page that triggered the middleware
     */
    readonly sourcePage: string;
    
    /**
     * The original request
     */
    readonly request: Request;
    
    /**
     * Extends the lifetime of the middleware to perform background work
     * after the response has been sent.
     * 
     * @param promise A promise that will be awaited before the middleware is terminated
     */
    waitUntil(promise: Promise<any>): void;
  }

  /**
   * ResponseCookies provides methods for manipulating cookies in responses
   */
  export interface ResponseCookies {
    /**
     * Set a cookie in the response
     * 
     * @param name The name of the cookie
     * @param value The value of the cookie
     * @param options Cookie options
     */
    set(name: string, value: string, options?: {
      path?: string;
      expires?: Date;
      maxAge?: number;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    }): void;
    
    /**
     * Get a cookie by name
     * 
     * @param name The name of the cookie to get
     * @returns The cookie value or undefined if not found
     */
    get(name: string): { name: string; value: string } | undefined;
    
    /**
     * Get all cookies with a specific name or all cookies if no name is provided
     * 
     * @param name Optional name of cookies to retrieve
     * @returns Array of cookie objects
     */
    getAll(name?: string): { name: string; value: string }[];
    
    /**
     * Delete a cookie
     * 
     * @param name The name of the cookie to delete
     * @returns Whether the cookie was deleted
     */
    delete(name: string): boolean;
    
    /**
     * Check if a cookie exists
     * 
     * @param name The name of the cookie to check
     * @returns Whether the cookie exists
     */
    has(name: string): boolean;
    
    /**
     * Delete all cookies
     */
    clear(): void;
  }

  /**
   * ResponseInit interface for initializing responses
   */
  export interface ResponseInit {
    /**
     * Response headers
     */
    headers?: HeadersInit;
    
    /**
     * HTTP status code
     */
    status?: number;
    
    /**
     * HTTP status text
     */
    statusText?: string;
  }

  /**
   * NextResponse extends the Web Response API with additional convenience methods
   */
  export interface NextResponse extends Response {
    /**
     * Cookies from the response with convenience methods
     */
    readonly cookies: ResponseCookies;
    
    /**
     * Headers from the response
     */
    readonly headers: Headers;
    
    /**
     * HTTP status text
     */
    readonly statusText: string;
    
    /**
     * HTTP status code
     */
    readonly status: number;
  }

  /**
   * NextResponse constructor and static methods
   */
  export const NextResponse: {
    /**
     * Create a new NextResponse instance
     * 
     * @param body The response body
     * @param init Response initialization options
     */
    new(body?: BodyInit | null, init?: ResponseInit): NextResponse;
    
    /**
     * Create a redirect response
     * 
     * @param url The URL to redirect to
     * @param init Response initialization options or status code
     */
    redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    
    /**
     * Create a rewrite response (proxies to the given URL while preserving the original URL)
     * 
     * @param url The URL to rewrite to
     * @param init Response initialization options or status code
     */
    rewrite(url: string | URL, init?: number | ResponseInit): NextResponse;
    
    /**
     * Create a response that continues the middleware chain
     * 
     * @param init Response initialization options
     */
    next(init?: ResponseInit): NextResponse;
    
    /**
     * Create a JSON response
     * 
     * @param body The JSON body
     * @param init Response initialization options
     */
    json<T>(body: T, init?: ResponseInit): NextResponse;
  };

  /**
   * UserAgent helper for parsing user agent information
   * 
   * @param request The request to parse the user agent from
   */
  export function userAgent(request: NextRequest | Request): {
    /**
     * Whether the request comes from a known bot
     */
    isBot: boolean;
    
    /**
     * User agent details
     */
    ua: string;
    
    /**
     * Browser information
     */
    browser: {
      /**
       * Browser name
       */
      name?: string;
      
      /**
       * Browser version
       */
      version?: string;
    };
    
    /**
     * Device information
     */
    device: {
      /**
       * Device model
       */
      model?: string;
      
      /**
       * Device type (mobile, tablet, desktop, etc.)
       */
      type?: string;
      
      /**
       * Device vendor
       */
      vendor?: string;
    };
    
    /**
     * Engine information
     */
    engine: {
      /**
       * Engine name
       */
      name?: string;
      
      /**
       * Engine version
       */
      version?: string;
    };
    
    /**
     * Operating system information
     */
    os: {
      /**
       * OS name
       */
      name?: string;
      
      /**
       * OS version
       */
      version?: string;
    };
    
    /**
     * CPU information
     */
    cpu: {
      /**
       * CPU architecture
       */
      architecture?: string;
    };
  };

  /**
   * Type definition for middleware function
   */
  export type NextMiddleware = (
    request: NextRequest,
    event: NextFetchEvent
  ) => NextResponse | Response | Promise<NextResponse | Response | null | undefined> | null | undefined;

  /**
   * Type definition for middleware config
   */
  export type MiddlewareConfig = {
    /**
     * Matcher for the middleware
     * Can be a string, array of strings, or a complex matcher with negative lookaheads
     */
    matcher?: string | string[] | { source: string; has?: { type: string; key: string }[]; missing?: { type: string; key: string }[] }[];
  };
}