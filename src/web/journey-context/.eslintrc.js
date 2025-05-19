/**
 * ESLint configuration for @austa/journey-context package
 * This configuration enforces code quality, consistency, and best practices
 * for the journey context management system used across web and mobile platforms.
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2021,
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier',
    'import',
    'react',
    'react-hooks',
    'react-native'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    '../.eslintrc.js'
  ],
  root: false,
  env: {
    browser: true,
    node: true,
    jest: true,
    es2021: true
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json'
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  ignorePatterns: [
    '.eslintrc.js',
    '**/*.js',
    'node_modules',
    'dist',
    'coverage'
  ],
  rules: {
    // Override rules from the root configuration as needed
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    // Journey-context specific rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index']
        ],
        pathGroups: [
          {
            pattern: '@austa/**',
            group: 'internal',
            position: 'before'
          },
          {
            pattern: '@design-system/**',
            group: 'internal',
            position: 'before'
          }
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    'import/no-duplicates': 'error',
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error']
      }
    ],
    'no-duplicate-imports': 'error',
    'no-return-await': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'prefer-const': 'error'
  },
  overrides: [
    {
      files: ['*.spec.ts', '*.spec.tsx', '*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    },
    {
      // Rules specific to React Native platform code
      files: ['src/adapters/mobile/**/*.ts', 'src/adapters/mobile/**/*.tsx'],
      rules: {
        // React Native specific rules
        'react-native/no-unused-styles': 'error',
        'react-native/split-platform-components': 'error',
        'react-native/no-inline-styles': 'warn',
        'react-native/no-color-literals': 'warn',
        'react-native/no-raw-text': 'error',
        'react-native/no-single-element-style-arrays': 'error'
      }
    },
    {
      // Rules specific to Web platform code
      files: ['src/adapters/web/**/*.ts', 'src/adapters/web/**/*.tsx'],
      rules: {
        // Web-specific rules can be added here
      }
    }
  ]
};