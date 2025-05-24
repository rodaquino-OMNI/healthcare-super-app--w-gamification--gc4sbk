# Prettier SDK for Yarn PnP

## Overview

This SDK provides a compatibility layer for Prettier to work with Yarn's Plug'n'Play (PnP) mode in the AUSTA SuperApp monorepo. It enables Prettier to correctly resolve configuration files, plugins, and dependencies in the PnP environment, ensuring consistent code formatting across both web and mobile platforms.

## Features

- PnP-aware module resolution for Prettier v3.2.5
- Support for path aliases (@app/auth, @app/shared, @austa/*)
- Integration with IDE extensions for consistent code formatting
- Support for the four new packages in the monorepo:
  - @austa/design-system
  - @design-system/primitives
  - @austa/interfaces
  - @austa/journey-context

## Usage

### VSCode Integration

To use this SDK with VSCode, add the following to your `.vscode/settings.json` file:

```json
{
  "prettier.prettierPath": ".yarn/sdks/prettier/index.js"
}
```

### Configuration

This SDK automatically detects and uses your Prettier configuration files (.prettierrc, .prettierrc.js, etc.). It also supports Prettier plugins, which can be specified in your configuration file as usual.

### Troubleshooting

If you encounter issues with Prettier plugins not being resolved correctly, try the following:

1. Make sure the plugin is installed as a dependency in your project
2. If using a plugin with Yarn PnP, you may need to add it to the `dependenciesMeta` section in your package.json:

```json
"dependenciesMeta": {
  "prettier-plugin-name@version": {
    "unplugged": true
  }
}
```

3. Run `yarn install` to update your dependencies

## Implementation Details

This SDK works by intercepting Prettier's module resolution requests and redirecting them to use Yarn's PnP API instead. It also provides special handling for path aliases and plugins to ensure they are correctly resolved in the PnP environment.

## Files

- `index.js`: Main entry point for the SDK
- `internal.js`: Internal implementation details and utility functions
- `package.json`: Package metadata and dependencies

## Related Documentation

- [Yarn PnP Documentation](https://yarnpkg.com/features/pnp)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [VSCode Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)