module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2022, // Updated to match ES2022 as specified in the technical spec
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint/eslint-plugin', // v5.59.5
    'prettier', // v4.2.1
    'import', // v2.27.5
    'nestjs', // v1.2.3
    'eslint-plugin-path-alias', // Added for path alias validation
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:nestjs/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', '**/*.js', 'node_modules', 'dist', 'coverage'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
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
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
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
          // Define path groups for the new package structure
          { pattern: '@austa/**', group: 'internal', position: 'before' },
          { pattern: '@design-system/**', group: 'internal', position: 'before' },
          { pattern: '@app/**', group: 'internal', position: 'before' },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/no-cycle': 'error', // Prevent circular dependencies
    'import/no-useless-path-segments': 'error', // Prevent unnecessary path segments
    'import/no-relative-packages': 'error', // Prevent relative imports from packages
    'import/no-self-import': 'error', // Prevent a module from importing itself
    'nestjs/use-validation-pipe': 'error',
    'nestjs/use-injectable-decorator': 'error',
    'max-len': [
      'error',
      {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-duplicate-imports': 'error',
    'no-return-await': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'prefer-const': 'error',
    // New rules for enforcing proper path alias usage
    'path-alias/no-relative': [
      'error',
      {
        allowSameFolder: true,
        alias: {
          '@app': './src',
          '@austa': '../packages',
        },
      },
    ],
    // Enhanced TypeScript-specific rules
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: true },
    ],
    '@typescript-eslint/consistent-type-exports': [
      'error',
      { fixMixedExportsWithInlineTypeSpecifier: true },
    ],
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
      node: {
        extensions: ['.js', '.ts'],
      },
      // Add support for path aliases
      alias: {
        map: [
          ['@app', './src'],
          ['@austa', '../packages'],
          ['@design-system', '../packages/design-system'],
        ],
        extensions: ['.ts', '.js', '.json'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
  },
  overrides: [
    {
      files: ['*.spec.ts', '*.test.ts', '*.e2e-spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
      },
    },
    {
      files: ['src/main.ts'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Rules specific to NestJS modules
      files: ['*.module.ts'],
      rules: {
        'import/no-cycle': 'off', // Allow circular dependencies in modules
      },
    },
    {
      // Rules for barrel files (index.ts)
      files: ['index.ts'],
      rules: {
        'import/export': 'error',
        'import/first': 'error',
        'import/no-duplicates': 'error',
        'max-len': 'off', // Allow longer lines in barrel files
      },
    },
  ],
};