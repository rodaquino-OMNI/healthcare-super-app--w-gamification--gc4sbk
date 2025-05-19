/**
 * ESLint configuration for AUSTA SuperApp web applications
 * This configuration enforces code quality, consistency, and best practices
 * across all frontend components, including web, mobile, and shared packages.
 * 
 * Version: 8.57.0
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2021,
    ecmaFeatures: {
      jsx: true
    },
    // Enable TypeScript project references for proper monorepo resolution
    tsconfigRootDir: __dirname
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier',
    'import',
    'react',
    'react-hooks',
    'jsx-a11y'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:storybook/recommended',
    'plugin:@next/next/recommended'
  ],
  root: true,
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
      },
      // Add alias configuration for the new monorepo structure
      alias: {
        map: [
          // New packages
          ['@design-system/primitives', './primitives/src'],
          ['@austa/design-system', './design-system/src'],
          ['@austa/interfaces', './interfaces'],
          ['@austa/journey-context', './journey-context/src'],
          // Existing aliases
          ['@app/shared', './shared'],
          ['@app/web', './web/src'],
          ['@app/mobile', './mobile/src']
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
    // Add specific import groups for the new packages
    'import/internal-regex': '^(@design-system|@austa|@app)'
  },
  ignorePatterns: [
    '.eslintrc.js',
    '**/*.js',
    'node_modules',
    'dist',
    '.next',
    'out',
    'coverage',
    'public'
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
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
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false
        }
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      }
    ],
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true
      }
    ],
    // Enhanced import ordering to handle the new packages
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
          // Primitives should be imported first
          {
            pattern: '@design-system/primitives/**',
            group: 'internal',
            position: 'before'
          },
          // Interfaces should be imported before design system
          {
            pattern: '@austa/interfaces/**',
            group: 'internal',
            position: 'before'
          },
          // Design system components
          {
            pattern: '@austa/design-system/**',
            group: 'internal'
          },
          // Journey context
          {
            pattern: '@austa/journey-context/**',
            group: 'internal'
          },
          // Other internal packages
          {
            pattern: '@app/**',
            group: 'internal'
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
    // Add rule to prevent importing from incorrect paths
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './primitives/src/**',
            from: './design-system/src/**',
            message: 'Primitives cannot import from design-system to prevent circular dependencies.'
          },
          {
            target: './interfaces/**',
            from: './design-system/src/**',
            message: 'Interfaces cannot import from design-system to prevent circular dependencies.'
          }
        ]
      }
    ],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
        aspects: ['invalidHref', 'preferButton']
      }
    ],
    'max-len': [
      'error',
      {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }
    ],
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
    // Test files
    {
      files: ['*.spec.ts', '*.spec.tsx', '*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        // Allow importing dev dependencies in test files
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true }
        ]
      }
    },
    // Storybook files
    {
      files: ['*.stories.tsx'],
      rules: {
        'import/no-anonymous-default-export': 'off',
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true }
        ]
      }
    },
    // Next.js pages
    {
      files: ['src/pages/**/*.tsx'],
      rules: {
        'import/no-default-export': 'off'
      }
    },
    // Design system primitives
    {
      files: ['primitives/src/**/*.{ts,tsx}'],
      rules: {
        // Primitives should not import from design-system
        'import/no-restricted-imports': [
          'error',
          {
            patterns: ['@austa/design-system*']
          }
        ]
      }
    },
    // Interfaces package
    {
      files: ['interfaces/**/*.{ts,tsx}'],
      rules: {
        // Interfaces should not have side effects
        'import/no-side-effects': 'error',
        // Interfaces should not import from design-system
        'import/no-restricted-imports': [
          'error',
          {
            patterns: ['@austa/design-system*']
          }
        ]
      }
    },
    // Journey context package
    {
      files: ['journey-context/src/**/*.{ts,tsx}'],
      rules: {
        // Ensure proper imports for journey context
        'import/no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../../../*'],
                message: 'Use package imports instead of relative paths across packages.'
              }
            ]
          }
        ]
      }
    }
  ]
};