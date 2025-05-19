/**
 * Rollup configuration for the @austa/design-system package
 * 
 * This configuration:
 * - Defines input/output paths for the bundle
 * - Configures plugins for TypeScript compilation, external dependency handling, and more
 * - Generates both CommonJS and ES modules formats with sourcemaps
 * - Creates TypeScript declarations
 */

import { defineConfig } from 'rollup';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' assert { type: 'json' };

// Define the external dependencies that should not be bundled
const EXTERNAL_DEPS = [
  // React dependencies
  'react',
  'react-dom',
  'react-native',
  'styled-components',
  // Internal packages
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context',
  // React Native dependencies
  'react-native-web',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-svg',
  'victory-native',
  // Regular expressions to match any import from these packages
  /^@design-system\/primitives(\/.*)?$/,
  /^@austa\/interfaces(\/.*)?$/,
  /^@austa\/journey-context(\/.*)?$/,
  /^react-native(\/.*)?$/,
  /^styled-components(\/.*)?$/,
];

// Define the input file
const INPUT_FILE = 'src/index.ts';

// Define the output directory
const OUTPUT_DIR = 'dist';

// Define the output formats
const OUTPUT_FORMATS = {
  cjs: {
    file: pkg.main,
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
  },
  esm: {
    file: pkg.module,
    format: 'es',
    sourcemap: true,
    exports: 'named',
  },
};

// Define the TypeScript configuration
const TS_CONFIG = {
  tsconfig: './tsconfig.json',
  declaration: false, // We'll generate declarations separately
  sourceMap: true,
  inlineSources: true,
};

// Define the Babel configuration
const BABEL_CONFIG = {
  babelHelpers: 'bundled',
  exclude: 'node_modules/**',
  extensions: ['.ts', '.tsx'],
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
};

// Define the main bundle configuration
const mainConfig = defineConfig({
  input: INPUT_FILE,
  output: [
    OUTPUT_FORMATS.cjs,
    OUTPUT_FORMATS.esm,
  ],
  external: EXTERNAL_DEPS,
  plugins: [
    // Extract peer dependencies
    peerDepsExternal(),
    // Resolve node modules
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      preferBuiltins: true,
    }),
    // Convert CommonJS modules to ES6
    commonjs(),
    // Compile TypeScript
    typescript(TS_CONFIG),
    // Transform with Babel
    babel(BABEL_CONFIG),
    // Minify the bundle
    terser(),
  ],
});

// Define the TypeScript declarations configuration
const dtsConfig = defineConfig({
  input: 'src/index.ts',
  output: {
    file: pkg.types,
    format: 'es',
  },
  external: EXTERNAL_DEPS,
  plugins: [
    dts(),
  ],
});

export default [mainConfig, dtsConfig];