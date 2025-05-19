import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import path from 'path';

// Import package.json to extract the output file paths
import pkg from './package.json';

/**
 * Rollup configuration for the @design-system/primitives package
 * 
 * This configuration:
 * - Builds both CommonJS and ES Module formats for maximum compatibility
 * - Generates TypeScript declaration files
 * - Optimizes for tree-shaking with proper external dependencies
 * - Includes sourcemaps for debugging
 * - Properly bundles tokens and primitives as part of the same package
 * - Configures Babel for React and styled-components
 * 
 * The primitives package contains:
 * - Design tokens (colors, typography, spacing, etc.)
 * - Primitive UI components (Box, Text, Stack, Icon, Touchable)
 */

// Define constants for build
const PRODUCTION = process.env.NODE_ENV === 'production';
const DIST_DIR = 'dist';
export default [
  // Main bundle configuration
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
        // Ensure proper interoperability with CommonJS modules
        interop: 'auto',
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
    ],
    // Mark the package as side-effect free for better tree-shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
    external: [
      // React and React DOM are peer dependencies
      'react',
      'react-dom',
      'react-native',
      // Styled components is a peer dependency
      'styled-components',
      // Regular expressions for node modules
      /^@babel\/runtime/,
    ],
    plugins: [
      // Automatically externalize peer dependencies
      peerDepsExternal(),
      
      // Resolve node modules
      resolve({
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      }),
      
      // Convert CommonJS modules to ES6
      commonjs(),
      
      // Compile TypeScript
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true,
        declaration: true,
        declarationDir: 'dist/types',
        rootDir: 'src',
        exclude: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.stories.ts',
          '**/*.stories.tsx',
        ],
      }),
      
      // Transform with Babel
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        presets: [
          '@babel/preset-env',
          '@babel/preset-react',
          '@babel/preset-typescript',
        ],
        plugins: [
          ['@babel/plugin-transform-runtime', { useESModules: true }],
          ['babel-plugin-styled-components', {
            displayName: true,
            ssr: true,
            pure: true,
          }],
        ],
      }),
      
      // Minify in production
      PRODUCTION && terser({
        output: {
          comments: false,
        },
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          passes: 3,
        },
      }),
    ].filter(Boolean),
  },
  
  // TypeScript declaration files bundle
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
    external: [
      // Exclude React types from the declaration bundle
      'react',
      'react-dom',
      'react-native',
      'styled-components',
    ],
  },
];