# VSCode Extensions for AUSTA SuperApp

This directory contains configuration files for Visual Studio Code to ensure a consistent development experience across the team. The `extensions.json` file recommends essential extensions for working with the AUSTA SuperApp monorepo.

## Purpose

These recommended extensions help address several critical issues identified in the technical specification:

1. **Path Resolution Failures**: Extensions like Path Intellisense help with proper resolution of path aliases (`@app/*`, `@austa/*`)
2. **Module Resolution Issues**: TypeScript and ESLint extensions ensure proper module resolution and type checking
3. **Standardized Development Environment**: Consistent extensions across the team help maintain code quality and standards
4. **Support for New Packages**: Extensions provide proper intellisense for the new packages:
   - `@austa/design-system`
   - `@design-system/primitives`
   - `@austa/interfaces`
   - `@austa/journey-context`

## Key Extensions

### Core Development
- **TypeScript Language Features**: Support for TypeScript v5.3.3
- **ESLint**: Code linting with monorepo support
- **Prettier**: Consistent code formatting
- **Yarn**: Better PnP integration with VSCode

### Path and Module Resolution
- **Path Intellisense**: Support for path aliases
- **Monorepo Workspace**: Better monorepo support
- **Import Cost**: Visualize the size of imported packages

### React and React Native
- **ES7+ React/Redux/React-Native snippets**: Useful code snippets
- **React Native Tools**: React Native development support
- **Styled Components**: Syntax highlighting for styled-components
- **Simple React Snippets**: Additional React code snippets
- **React Refactor**: Helps extract JSX to components and files

### Database and API
- **Prisma**: Support for Prisma schema files
- **GraphQL**: GraphQL schema support

### Debugging and Testing
- **JavaScript Debugger**: Enhanced debugging capabilities
- **Jest**: Test runner integration

### Other Utilities
- **DotENV**: Support for environment variables
- **EditorConfig**: Consistent coding styles
- **Code Spell Checker**: Spell checking for code and comments
- **GitLens**: Enhanced Git capabilities
- **Docker**: Docker support
- **YAML**: Support for Kubernetes manifests

## Installation

When opening the project in VSCode, you should be prompted to install the recommended extensions. Alternatively, you can view all recommended extensions by:

1. Opening the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
2. Clicking on "Show Recommended Extensions" in the Extensions view

## Additional Configuration

Some extensions may require additional configuration in your user or workspace settings. Refer to the extension documentation for specific configuration options.