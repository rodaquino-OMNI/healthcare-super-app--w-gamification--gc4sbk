/**
 * Type declarations for Next.js server components
 * Compatible with Next.js 14.2.0
 */

declare module 'next/server' {
  export interface NextRequest {
    headers: Headers;
    url: string;
    nextUrl: URL;
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(name?: string): { name: string; value: string }[];
      set(name: string, value: string, options?: {
        path?: string;
        expires?: Date;
        maxAge?: number;
        domain?: string;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
      }): void;
      has(name: string): boolean;
      delete(name: string): boolean;
      clear(): void;
    };
    geo?: {
      city?: string;
      country?: string;
      region?: string;
    };
    ip?: string;
  }

  export interface NextFetchEvent {
    sourcePage: string;
    request: Request;
    waitUntil(promise: Promise<any>): void;
  }

  export interface ResponseCookies {
    set(name: string, value: string, options?: {
      path?: string;
      expires?: Date;
      maxAge?: number;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    }): void;
    get(name: string): { name: string; value: string } | undefined;
    getAll(name?: string): { name: string; value: string }[];
    delete(name: string): boolean;
  }

  export interface NextResponse {
    cookies: ResponseCookies;
    headers: Headers;
    statusText: string;
    status: number;
    redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    rewrite(url: string | URL, init?: number | ResponseInit): NextResponse;
    next(init?: ResponseInit): NextResponse;
    json<T>(body: T, init?: ResponseInit): NextResponse;
  }

  export interface ResponseInit {
    headers?: HeadersInit;
    status?: number;
    statusText?: string;
  }

  export const NextResponse: {
    new(body?: BodyInit | null, init?: ResponseInit): NextResponse;
    redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    rewrite(url: string | URL, init?: number | ResponseInit): NextResponse;
    next(init?: ResponseInit): NextResponse;
    json<T>(body: T, init?: ResponseInit): NextResponse;
  };

  export function userAgent(request: NextRequest | Request): {
    isBot: boolean;
    ua: string;
    browser: {
      name?: string;
      version?: string;
    };
    device: {
      model?: string;
      type?: string;
      vendor?: string;
    };
    engine: {
      name?: string;
      version?: string;
    };
    os: {
      name?: string;
      version?: string;
    };
    cpu: {
      architecture?: string;
    };
  };
}