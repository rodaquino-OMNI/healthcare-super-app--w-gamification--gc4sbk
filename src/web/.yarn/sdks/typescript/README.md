# TypeScript SDK for Yarn PnP

## Overview

This package provides TypeScript integration with Yarn's Plug'n'Play (PnP) mode for the AUSTA SuperApp monorepo. It ensures that TypeScript can properly resolve modules and path aliases across the monorepo, particularly for the following packages:

- `@austa/design-system` - UI components with journey-specific theming
- `@design-system/primitives` - Fundamental design elements (colors, typography, spacing)
- `@austa/interfaces` - Shared TypeScript interfaces for cross-journey data models
- `@austa/journey-context` - Context provider for journey-specific state management

## Features

- PnP-aware TypeScript resolution for all packages
- Support for path aliases from tsconfig.json files
- Cross-platform type resolution between web and mobile applications
- IDE integration for TypeScript language features

## Usage

This SDK is automatically used by IDEs and editors that support Yarn PnP, such as VS Code with the Yarn extension. It provides the following binaries:

- `tsc` - TypeScript compiler with PnP support
- `tsserver` - TypeScript language server with PnP support

## Configuration

The SDK reads path mappings from tsconfig.json files and configures TypeScript to resolve modules accordingly. It supports the following path aliases:

- `@austa/*` - AUSTA-specific packages
- `@design-system/*` - Design system packages
- `@app/*` - Application-specific imports

## Troubleshooting

If you encounter issues with module resolution:

1. Make sure your IDE is configured to use the Yarn PnP SDK
2. Check that your tsconfig.json has the correct path mappings
3. Verify that the package is correctly listed in the workspace configuration
4. Try running `yarn dlx @yarnpkg/sdks vscode` to update the SDK

## License

MIT