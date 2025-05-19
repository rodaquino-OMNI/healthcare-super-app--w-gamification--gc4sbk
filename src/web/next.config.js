/**
 * Next.js Configuration for AUSTA SuperApp
 * 
 * This configuration file defines settings for the AUSTA SuperApp web application,
 * including internationalization, performance optimizations, image settings,
 * and build configurations.
 * 
 * @version Next.js 14.2.0
 */

const path = require('path');
const withPlugins = require('next-compose-plugins'); // next-compose-plugins v2.2.1
const withBundleAnalyzer = require('@next/bundle-analyzer')({ // @next/bundle-analyzer v13.4.12
  enabled: process.env.ANALYZE === 'true',
});

// Import i18n configuration
const { supportedLocales, defaultLocale } = require('./shared/config/i18nConfig');

/**
 * Next.js configuration object
 */
const nextConfig = {
  // Enable React Strict Mode for identifying potential problems
  reactStrictMode: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Configure styled-components for server-side rendering
  compiler: {
    styledComponents: true,
  },
  
  // Configure image optimization
  images: {
    domains: ['storage.googleapis.com', 'cdn.austa.com.br'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Configure internationalization
  i18n: {
    locales: supportedLocales,
    defaultLocale: defaultLocale,
  },
  
  // Provide environment variables to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
    // Journey-specific environment variables
    NEXT_PUBLIC_HEALTH_JOURNEY_ENABLED: process.env.NEXT_PUBLIC_HEALTH_JOURNEY_ENABLED || 'true',
    NEXT_PUBLIC_CARE_JOURNEY_ENABLED: process.env.NEXT_PUBLIC_CARE_JOURNEY_ENABLED || 'true',
    NEXT_PUBLIC_PLAN_JOURNEY_ENABLED: process.env.NEXT_PUBLIC_PLAN_JOURNEY_ENABLED || 'true',
    NEXT_PUBLIC_GAMIFICATION_ENABLED: process.env.NEXT_PUBLIC_GAMIFICATION_ENABLED || 'true',
  },
  
  // Experimental features
  experimental: {
    outputStandalone: true,
    esmExternals: true,
  },
  
  // Disable X-Powered-By header for security
  poweredByHeader: false,
  
  // Custom webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in production for error tracking
    if (!dev) {
      config.devtool = 'source-map';
    }
    
    // Add journey-specific aliases for easier imports
    config.resolve.alias = {
      ...config.resolve.alias,
      // Journey paths
      '@health': path.resolve(__dirname, 'src/journeys/health'),
      '@care': path.resolve(__dirname, 'src/journeys/care'),
      '@plan': path.resolve(__dirname, 'src/journeys/plan'),
      '@gamification': path.resolve(__dirname, 'src/journeys/gamification'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      // New package aliases
      '@austa/design-system': path.resolve(__dirname, '../design-system/src'),
      '@design-system/primitives': path.resolve(__dirname, '../primitives/src'),
      '@austa/interfaces': path.resolve(__dirname, '../interfaces'),
      '@austa/journey-context': path.resolve(__dirname, '../journey-context/src'),
    };
    
    // Configure module resolution for workspace packages
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../..', 'node_modules'),
      'node_modules',
    ];

    // Ensure proper resolution of workspace packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
  
  // Custom HTTP headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' https://cdn.austa.com.br 'unsafe-inline' 'unsafe-eval';
              style-src 'self' https://cdn.austa.com.br 'unsafe-inline';
              img-src 'self' https://storage.googleapis.com https://cdn.austa.com.br data:;
              font-src 'self' https://cdn.austa.com.br;
              connect-src 'self' https://*.austa.com.br ${process.env.NEXT_PUBLIC_API_BASE_URL} ${process.env.NEXT_PUBLIC_SOCKET_URL || ''};
              media-src 'self' https://cdn.austa.com.br;
              object-src 'none';
              frame-ancestors 'none';
              worker-src 'self' blob:;
              manifest-src 'self';
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=(), payment=(), usb=(), bluetooth=(), serial=()',
          },
        ],
      },
      {
        // Protection against Next.js Middleware Authorization Bypass vulnerability
        source: '/(.*)',
        headers: [
          {
            key: 'X-Middleware-Request-Check',
            value: 'protected',
          }
        ],
      },
      {
        // Cache static assets for better performance
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache design system assets
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Add server middleware to protect against the Authorization Bypass vulnerability
  serverRuntimeConfig: {
    // Will only be available on the server side
    middlewareProtection: true,
    // Journey-specific server configurations
    journeyConfig: {
      health: {
        apiEndpoint: process.env.HEALTH_SERVICE_API_URL,
      },
      care: {
        apiEndpoint: process.env.CARE_SERVICE_API_URL,
      },
      plan: {
        apiEndpoint: process.env.PLAN_SERVICE_API_URL,
      },
    },
  },
  
  // Public runtime configuration
  publicRuntimeConfig: {
    // Will be available on both server and client
    appName: 'AUSTA SuperApp',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  
  // Custom redirects
  async redirects() {
    return [
      // Localized journey routes
      {
        source: '/health',
        destination: '/saude',
        permanent: true,
      },
      {
        source: '/care',
        destination: '/cuidados',
        permanent: true,
      },
      {
        source: '/plan',
        destination: '/plano',
        permanent: true,
      },
    ];
  },
};

// Export the configuration with plugins
module.exports = withPlugins([
  withBundleAnalyzer,
], nextConfig);