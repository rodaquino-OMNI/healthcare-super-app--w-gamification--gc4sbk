import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import { defineConfig } from 'rollup';
import path from 'path';

// Define input file path
const input = 'src/index.ts';

// Define external dependencies that should not be bundled
const external = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'styled-components',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-svg',
  'victory-native',
  // New external dependencies
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context',
  '@austa/web-shared',
];

// Define plugins used in all configurations
const commonPlugins = [
  // Extract peer dependencies
  peerDepsExternal(),
  // Resolve node modules
  resolve({
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    preferBuiltins: true,
  }),
  // Convert CommonJS modules to ES6
  commonjs(),
  // Compile TypeScript
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: true,
    inlineSources: true,
    declaration: false,
    declarationMap: false,
  }),
  // Transform with Babel
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    extensions: ['.ts', '.tsx'],
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
  }),
];

export default defineConfig([
  // CommonJS build
  {
    input,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      interop: 'auto',
    },
    external,
    plugins: [...commonPlugins],
  },
  // ES Module build
  {
    input,
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      preserveModules: false,
    },
    external,
    plugins: [...commonPlugins],
  },
  // Minified ES Module build for production
  {
    input,
    output: {
      file: 'dist/index.esm.min.js',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      plugins: [terser()],
    },
    external,
    plugins: [...commonPlugins],
  },
  // TypeScript declaration files
  {
    input,
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
      sourcemap: true, // Generate sourcemaps for declaration files
    },
    external,
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@design-system/primitives': ['../primitives/src'],
            '@design-system/primitives/*': ['../primitives/src/*'],
            '@austa/interfaces': ['../interfaces'],
            '@austa/interfaces/*': ['../interfaces/*'],
            '@austa/journey-context': ['../journey-context/src'],
            '@austa/journey-context/*': ['../journey-context/src/*'],
            '~/*': ['./src/*'],
          },
        },
      }),
    ],
  },
]);