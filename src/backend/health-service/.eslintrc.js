/**
 * ESLint configuration for the health-service service
 * 
 * This configuration enforces code quality standards, consistent formatting,
 * and TypeScript best practices across the health-service service.
 * It includes rules for import organization, error handling, type safety,
 * and NestJS-specific patterns.
 */

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'import',
    'jest',
    'prettier',
    'consistent-path-alias',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules', 'coverage'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
    ],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Object: {
            message: 'Use object instead',
            fixWith: 'object',
          },
          Function: {
            message: 'Use specific function type instead',
          },
          Boolean: {
            message: 'Use boolean instead',
            fixWith: 'boolean',
          },
          Number: {
            message: 'Use number instead',
            fixWith: 'number',
          },
          String: {
            message: 'Use string instead',
            fixWith: 'string',
          },
        },
      },
    ],

    // Import organization rules - enforces consistent import ordering and grouping
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',          // Node.js built-in modules
          'external',         // npm packages
          'internal',         // Aliased imports
          ['parent', 'sibling', 'index'], // Relative imports
        ],
        'pathGroups': [
          // Journey-specific imports
          {
            pattern: '@app/auth/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@app/health/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@app/care/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@app/plan/**',
            group: 'internal',
            position: 'before',
          },
          // Shared packages
          {
            pattern: '@austa/interfaces/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@austa/design-system/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@austa/journey-context/**',
            group: 'internal',
            position: 'before',
          },
          // Internal health imports
          {
            pattern: '@health/**',
            group: 'internal',
            position: 'before',
          },
        ],
        'pathGroupsExcludedImportTypes': ['builtin'],
        'newlines-between': 'always',
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // TypeScript handles this

    // Error handling rules - enforces consistent error handling patterns
    'no-throw-literal': 'error', // Only throw Error objects
    'prefer-promise-reject-errors': 'error', // Only reject with Error objects
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Prefer LoggerService over console
    '@typescript-eslint/no-floating-promises': 'error', // Prevent unhandled promise rejections
    'max-nested-callbacks': ['error', 3], // Prevent callback hell
    'no-return-await': 'error', // Unnecessary return await
    'require-await': 'error', // Async functions should use await

    // Path alias validation - enforces standardized path alias usage
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../../*'],
            message: 'Use path aliases (@app/*, @austa/*) instead of relative paths',
          },
          {
            group: ['../../*'],
            message: 'Consider using path aliases (@app/*, @austa/*) for deep imports',
          },
          {
            group: ['src/*'],
            message: 'Use path aliases (@app/health/* or @health/*) instead of src/* imports',
          },
          {
            group: ['../auth-service/*', '../care-service/*', '../plan-service/*', '../gamification-engine/*'],
            message: 'Use path aliases (@app/auth/*, @app/care/*, @app/plan/*, @app/gamification/*) for cross-service imports',
          },
        ],
      },
    ],
    
    // Enforce consistent path alias usage
    'consistent-path-alias/import': [
      'error',
      {
        aliases: {
          '@app/health': './src',
          '@health': './src',
          '@app/auth': '../auth-service/src',
          '@app/care': '../care-service/src',
          '@app/plan': '../plan-service/src',
          '@app/gamification': '../gamification-engine/src',
          '@app/shared': '../shared/src',
          '@austa/interfaces': '../../web/interfaces',
        },
      },
    ],

    // NestJS specific patterns - enforces best practices for NestJS applications
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    'no-empty-function': ['error', { 'allow': ['constructors'] }], // Allow empty constructors for DI
    'class-methods-use-this': 'off', // NestJS services often don't use 'this'
    'no-unused-vars': 'off', // TypeScript handles this better
    'no-use-before-define': 'off', // TypeScript handles this better
    '@typescript-eslint/no-use-before-define': ['error'], // Use TypeScript version instead

    // Event processing patterns - enforces standardized event handling
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.property.name="emit"][arguments.length<2]',
        message: 'Event emissions should include a payload object as the second argument',
      },
      {
        selector: 'CallExpression[callee.property.name="publish"][arguments.length<2]',
        message: 'Kafka publish calls should include a payload object as the second argument',
      },
      {
        selector: 'CallExpression[callee.property.name="publish"][arguments.length>1][arguments.1.type!="ObjectExpression"]',
        message: 'Kafka publish payload should be an object literal for better readability',
      },
      {
        selector: 'CallExpression[callee.property.name="emit"][arguments.length>1][arguments.1.type!="ObjectExpression"]',
        message: 'Event payload should be an object literal for better readability',
      },
      {
        selector: 'MethodDefinition[key.name="onEvent"][value.params.length<1]',
        message: 'Event handlers should accept at least one parameter (the event payload)',
      },
    ],
    
    // Enforce type safety for event processing
    '@typescript-eslint/explicit-function-return-type': ['error', {
      'allowExpressions': true,
      'allowTypedFunctionExpressions': true,
      'allowHigherOrderFunctions': true,
      'allowDirectConstAssertionInArrowFunctions': true,
      'allowConciseArrowFunctionExpressionsStartingWithVoid': true,
    }],

    // Health-service-specific rules - enforces patterns specific to the health service
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message: 'Use ConfigService instead of process.env directly',
      },
    ],
    
    // Enforce consistent error classification
    'no-restricted-globals': [
      'error',
      {
        name: 'Error',
        message: 'Use AppException with proper error classification instead of generic Error',
      },
    ],
    
    // Enforce proper error handling
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TryStatement > CatchClause > BlockStatement > ThrowStatement > NewExpression[callee.name!="AppException"]',
        message: 'Always wrap caught errors in AppException with proper error classification',
      },
    ],
    
    // Enforce proper health data handling
    'no-restricted-syntax': [
      'error',
      {
        selector: 'NewExpression[callee.name="AppException"][arguments.length<2]',
        message: 'AppException should include an error code as the second argument',
      },
      {
        selector: 'MethodDefinition[key.name="processHealthMetric"][value.params.length<2]',
        message: 'Health metric processing should specify both user and metric data',
      },
      {
        selector: 'MethodDefinition[key.name="processEvent"][value.async=false]',
        message: 'Event processing methods should be async to handle potential database operations',
      },
    ],

    // General code quality rules
    'prettier/prettier': 'error',
    'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'no-param-reassign': 'error',
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/extensions': ['.js', '.ts'],
    'jest': {
      'version': 29,
    },
  },
  overrides: [
    {
      // Specific rules for test files
      files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
      rules: {
        'max-nested-callbacks': 'off', // Allow nested callbacks in test files
        '@typescript-eslint/no-explicit-any': 'off', // Allow any in test mocks
        'no-restricted-globals': 'off', // Allow Error in tests
        'no-restricted-syntax': 'off', // Allow any syntax in tests
        'no-restricted-properties': 'off', // Allow process.env in tests
      },
    },
    {
      // Specific rules for DTOs
      files: ['**/dto/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
        '@typescript-eslint/member-ordering': ['error', { default: ['field', 'constructor', 'method'] }],
      },
    },
    {
      // Specific rules for entities
      files: ['**/entities/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
        '@typescript-eslint/member-ordering': ['error', { default: ['field', 'constructor', 'method'] }],
      },
    },
    {
      // Specific rules for FHIR integration
      files: ['**/integrations/fhir/**/*.ts'],
      rules: {
        '@typescript-eslint/naming-convention': 'off', // FHIR resources have their own naming conventions
        'camelcase': 'off', // FHIR resources often use snake_case
      },
    },
  ],
};