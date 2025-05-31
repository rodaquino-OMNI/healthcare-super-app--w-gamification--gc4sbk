/**
 * Type declarations for Next.js server components
 * Compatible with Next.js 14.2.0
 */

declare module 'next/server' {
  export interface CookieListItem {
    name: string;
    value: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }

  export interface RequestCookies {
    get(name: string): { name: string; value: string } | undefined;
    getAll(name?: string): { name: string; value: string }[];
    has(name: string): boolean;
    set(name: string, value: string, options?: Partial<CookieListItem>): void;
    delete(name: string): boolean;
  }

  export interface NextRequest extends Request {
    headers: Headers;
    url: string;
    nextUrl: URL;
    cookies: RequestCookies;
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
    delete(name: string): boolean;
  }

  export interface NextResponseInit extends ResponseInit {
    request?: {
      headers?: HeadersInit;
    };
  }

  export interface NextResponse extends Response {
    cookies: ResponseCookies;
    headers: Headers;
    statusText: string;
    status: number;
    redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    rewrite(url: string | URL, init?: number | ResponseInit): NextResponse;
    next(init?: NextResponseInit): NextResponse;
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
    next(init?: NextResponseInit): NextResponse;
    json<T>(body: T, init?: ResponseInit): NextResponse;
  };

  export interface UserAgentData {
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
    isBot: boolean;
  }

  export function userAgent(request: NextRequest | Request): UserAgentData;
}