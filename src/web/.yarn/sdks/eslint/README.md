# ESLint SDK for Yarn Plug'n'Play

This package provides a consistent interface for ESLint to work with Yarn's Plug'n'Play (PnP) module resolution system. It ensures that ESLint can correctly resolve plugins and configurations in both IDE integrations and CI environments.

## Purpose

Without this SDK, ESLint would fail to resolve dependencies in a Yarn PnP environment, which would break code linting in development and CI/CD pipelines. This SDK addresses the following issues:

- Path resolution failures causing build errors
- Standardized module resolution across the monorepo
- Proper ESLint integration with Yarn Plug'n'Play

## Usage

### IDE Integration

For VSCode, add the following to your `.vscode/settings.json` file:

```json
{
  "eslint.nodePath": ".yarn/sdks",
  "eslint.packageManager": "yarn"
}
```

### Command Line

You can run ESLint from the command line using:

```bash
yarn eslint [options] [file|dir|glob]*
```

### Programmatic Usage

```javascript
const { createESLint } = require('./.yarn/sdks/eslint');

const eslint = createESLint({
  // ESLint options
});

const results = await eslint.lintFiles(['src/**/*.js']);
```

## API

- `eslintCliPath`: Path to the ESLint CLI executable
- `runESLint(args)`: Run ESLint with the provided arguments
- `createESLint(options)`: Create an ESLint instance with the provided options
- `resolveESLintModule(moduleName, relativeTo)`: Resolve an ESLint plugin or config in a PnP-aware manner
- `ESLint`: The ESLint constructor
- `CLIEngine`: The ESLint CLIEngine constructor (for backward compatibility)

## Troubleshooting

If you encounter issues with ESLint in a Yarn PnP environment:

1. Make sure you have run `yarn dlx @yarnpkg/sdks vscode` to generate the SDK files
2. Ensure that ESLint and all required plugins are listed in your package.json dependencies
3. Check that your IDE is properly configured to use the SDK
4. Try running ESLint from the command line to see if the issue is specific to your IDE

## Related Documentation

- [Yarn PnP Documentation](https://yarnpkg.com/features/pnp)
- [Yarn Editor SDKs](https://yarnpkg.com/getting-started/editor-sdks)
- [ESLint Documentation](https://eslint.org/docs/user-guide/)