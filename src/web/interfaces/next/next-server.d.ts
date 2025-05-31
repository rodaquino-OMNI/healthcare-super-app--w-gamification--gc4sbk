/**
 * Type declarations for Next.js 14.2.0 server components
 * @package @austa/interfaces
 */

declare module 'next/server' {
  /**
   * NextRequest extends the Web Request API with additional convenience methods
   */
  export interface NextRequest extends Request {
    /**
     * Headers for the incoming request
     */
    headers: Headers;

    /**
     * Original URL string of the request
     */
    url: string;

    /**
     * Parsed URL object of the request with Next.js specific properties
     */
    nextUrl: URL;

    /**
     * Cookie management for the request
     */
    cookies: {
      /**
       * Get a cookie by name
       * @param name The name of the cookie to get
       * @returns The cookie value or undefined if not found
       */
      get(name: string): { name: string; value: string } | undefined;

      /**
       * Get all cookies with the given name, or all cookies if no name is provided
       * @param name Optional name of cookies to retrieve
       * @returns Array of cookie objects
       */
      getAll(name?: string): { name: string; value: string }[];

      /**
       * Set a cookie on the request
       * @param name The name of the cookie to set
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
       * Delete a cookie or multiple cookies by name
       * @param name The name or names of cookies to delete
       * @returns Whether any cookies were deleted
       */
      delete(name: string | string[]): boolean;

      /**
       * Check if a cookie exists
       * @param name The name of the cookie to check
       * @returns Whether the cookie exists
       */
      has(name: string): boolean;

      /**
       * Delete all cookies
       */
      clear(): void;
    };

    /**
     * Geo location data if enabled
     */
    geo?: {
      city?: string;
      country?: string;
      region?: string;
      latitude?: string;
      longitude?: string;
    };

    /**
     * IP address of the request if enabled
     */
    ip?: string;
  }

  /**
   * NextFetchEvent extends the native FetchEvent with additional methods
   */
  export interface NextFetchEvent {
    /**
     * The source page of the request
     */
    sourcePage: string;

    /**
     * The original request
     */
    request: Request;

    /**
     * Extends the lifetime of the middleware to perform background work
     * @param promise A promise that will be awaited before completing the response
     */
    waitUntil(promise: Promise<any>): void;
  }

  /**
   * ResponseCookies interface for manipulating cookies in responses
   */
  export interface ResponseCookies {
    /**
     * Set a cookie on the response
     * @param name The name of the cookie to set
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
     * @param name The name of the cookie to get
     * @returns The cookie value or undefined if not found
     */
    get(name: string): { name: string; value: string } | undefined;

    /**
     * Get all cookies with the given name, or all cookies if no name is provided
     * @param name Optional name of cookies to retrieve
     * @returns Array of cookie objects
     */
    getAll(name?: string): { name: string; value: string }[];

    /**
     * Delete a cookie by name
     * @param name The name of the cookie to delete
     * @returns Whether the cookie was deleted
     */
    delete(name: string): boolean;
  }

  /**
   * Response initialization options
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
     * Cookie management for the response
     */
    cookies: ResponseCookies;

    /**
     * Headers for the response
     */
    headers: Headers;

    /**
     * HTTP status text
     */
    statusText: string;

    /**
     * HTTP status code
     */
    status: number;

    /**
     * Create a redirect response to the given URL
     * @param url The URL to redirect to
     * @param init Response initialization options or status code
     */
    redirect(url: string | URL, init?: number | ResponseInit): NextResponse;

    /**
     * Create a rewrite response to the given URL
     * @param url The URL to rewrite to
     * @param init Response initialization options or status code
     */
    rewrite(url: string | URL, init?: number | ResponseInit): NextResponse;

    /**
     * Create a response that continues the middleware chain
     * @param init Response initialization options
     */
    next(init?: ResponseInit): NextResponse;

    /**
     * Create a JSON response
     * @param body The JSON body
     * @param init Response initialization options
     */
    json<T>(body: T, init?: ResponseInit): NextResponse;
  }

  /**
   * NextResponse constructor and static methods
   */
  export const NextResponse: {
    /**
     * Create a new NextResponse instance
     * @param body The response body
     * @param init Response initialization options
     */
    new(body?: BodyInit | null, init?: ResponseInit): NextResponse;

    /**
     * Create a redirect response to the given URL
     * @param url The URL to redirect to
     * @param init Response initialization options or status code
     */
    redirect(url: string | URL, init?: number | ResponseInit): NextResponse;

    /**
     * Create a rewrite response to the given URL
     * @param url The URL to rewrite to
     * @param init Response initialization options or status code
     */
    rewrite(url: string | URL, init?: number | ResponseInit): NextResponse;

    /**
     * Create a response that continues the middleware chain
     * @param init Response initialization options
     */
    next(init?: ResponseInit): NextResponse;

    /**
     * Create a JSON response
     * @param body The JSON body
     * @param init Response initialization options
     */
    json<T>(body: T, init?: ResponseInit): NextResponse;
  };

  /**
   * User agent helper for middleware
   * @param request The incoming request
   */
  export function userAgent(request: NextRequest | Request): {
    /**
     * Whether the request comes from a known bot
     */
    isBot: boolean;

    /**
     * The type of the device
     * Can be one of: console, mobile, tablet, smarttv, wearable, embedded, or undefined
     */
    device: {
      type?: string;
      model?: string;
      vendor?: string;
    };

    /**
     * The engine information
     */
    engine: {
      name?: string;
      version?: string;
    };

    /**
     * The operating system information
     */
    os: {
      name?: string;
      version?: string;
    };

    /**
     * The CPU information
     */
    cpu: {
      architecture?: string;
    };

    /**
     * The browser information
     */
    browser: {
      name?: string;
      version?: string;
    };
  };
}