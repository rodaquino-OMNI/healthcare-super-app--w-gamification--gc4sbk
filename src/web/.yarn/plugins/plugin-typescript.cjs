/**
 * Yarn plugin for TypeScript integration
 * 
 * This plugin provides enhanced TypeScript support for the AUSTA SuperApp:
 * - Resolves module path aliases (@app/auth, @app/shared, @austa/*)
 * - Coordinates TypeScript project references for proper build ordering
 * - Enables automatic type declaration generation for design system packages
 */

module.exports = {
  name: 'plugin-typescript',
  factory: require => {
    // Import required Yarn packages
    const { Configuration, Project } = require('@yarnpkg/core');
    const { xfs, ppath, npath } = require('@yarnpkg/fslib');
    const { execUtils } = require('@yarnpkg/plugin-exec');
    
    // Return the plugin implementation
    return {
      hooks: {
        // Hook that runs after all packages are installed
        afterAllInstalled: async (project) => {
          // Process TypeScript configuration for all workspaces
          await processTypeScriptConfig(project);
        },
        
        // Hook that runs before a build
        beforeWorkspaceBuild: async (workspace, options) => {
          // Ensure TypeScript declarations are generated for design system packages
          if (workspace.manifest.name.startsWith('@austa/design-system') || 
              workspace.manifest.name === '@design-system/primitives' ||
              workspace.manifest.name.startsWith('@austa/interfaces') ||
              workspace.manifest.name.startsWith('@austa/journey-context')) {
            await ensureTypeDeclarations(workspace, options);
          }
        }
      }
    };
    
    /**
     * Process TypeScript configuration for all workspaces
     * - Updates tsconfig.json files to resolve path aliases
     * - Sets up project references for proper build ordering
     */
    async function processTypeScriptConfig(project) {
      const workspaces = project.workspaces;
      
      for (const workspace of workspaces) {
        const tsconfigPath = ppath.join(workspace.cwd, 'tsconfig.json');
        
        // Skip if no tsconfig.json exists
        if (!await xfs.existsPromise(tsconfigPath)) {
          continue;
        }
        
        try {
          // Read and parse the tsconfig.json file
          const tsconfigContent = await xfs.readFilePromise(tsconfigPath, 'utf8');
          const tsconfig = JSON.parse(tsconfigContent);
          
          // Ensure compilerOptions exists
          if (!tsconfig.compilerOptions) {
            tsconfig.compilerOptions = {};
          }
          
          // Set up baseUrl if not already set
          if (!tsconfig.compilerOptions.baseUrl) {
            tsconfig.compilerOptions.baseUrl = './src';
          }
          
          // Ensure moduleResolution is set to node
          if (!tsconfig.compilerOptions.moduleResolution) {
            tsconfig.compilerOptions.moduleResolution = 'node';
          }
          
          // Set up paths for module resolution if not already set
          if (!tsconfig.compilerOptions.paths) {
            tsconfig.compilerOptions.paths = {};
          }
          
          // Add standard path aliases if they don't exist
          const pathAliases = {
            '@app/*': ['*'],
            '@app/auth/*': ['../auth-service/src/*'],
            '@app/shared/*': ['../shared/*'],
            '@austa/*': ['../../../src/web/*']
          };
          
          // Add specific path aliases for design system packages
          if (workspace.manifest.name.includes('web')) {
            pathAliases['@design-system/primitives/*'] = ['../primitives/src/*'];
            pathAliases['@austa/design-system/*'] = ['../design-system/src/*'];
            pathAliases['@austa/interfaces/*'] = ['../interfaces/*'];
            pathAliases['@austa/journey-context/*'] = ['../journey-context/src/*'];
          }
          
          // Merge path aliases with existing ones
          tsconfig.compilerOptions.paths = {
            ...tsconfig.compilerOptions.paths,
            ...pathAliases
          };
          
          // Set up project references for proper build ordering
          setupProjectReferences(project, workspace, tsconfig);
          
          // Write the updated tsconfig back to disk
          await xfs.writeFilePromise(tsconfigPath, JSON.stringify(tsconfig, null, 2));
          
          project.configuration.stdout.write(`✅ Updated TypeScript configuration for ${workspace.manifest.name}\n`);
        } catch (error) {
          project.configuration.stdout.write(`❌ Error processing TypeScript configuration for ${workspace.manifest.name}: ${error.message}\n`);
        }
      }
    }
    
    /**
     * Set up TypeScript project references for proper build ordering
     */
    function setupProjectReferences(project, workspace, tsconfig) {
      // Initialize references array if it doesn't exist
      if (!tsconfig.references) {
        tsconfig.references = [];
      }
      
      // Get workspace dependencies
      const dependencies = [
        ...Object.keys(workspace.manifest.dependencies || {}),
        ...Object.keys(workspace.manifest.devDependencies || {})
      ];
      
      // Find workspace dependencies that have a tsconfig.json
      for (const dependency of dependencies) {
        const dependencyWorkspace = project.workspaces.find(w => w.manifest.name === dependency);
        
        if (dependencyWorkspace) {
          const dependencyTsconfigPath = ppath.join(dependencyWorkspace.cwd, 'tsconfig.json');
          
          // Check if the dependency has a tsconfig.json
          if (xfs.existsSync(dependencyTsconfigPath)) {
            // Add a project reference if it doesn't already exist
            const relativePath = ppath.relative(workspace.cwd, dependencyWorkspace.cwd);
            const reference = { path: npath.fromPortablePath(relativePath) };
            
            // Check if this reference already exists
            const referenceExists = tsconfig.references.some(ref => 
              ref.path === reference.path
            );
            
            if (!referenceExists) {
              tsconfig.references.push(reference);
            }
          }
        }
      }
      
      // Special handling for design system packages
      if (workspace.manifest.name.includes('mobile') || workspace.manifest.name.includes('web/web')) {
        // These packages should reference the design system packages
        const designSystemPackages = [
          '@design-system/primitives',
          '@austa/design-system',
          '@austa/interfaces',
          '@austa/journey-context'
        ];
        
        for (const packageName of designSystemPackages) {
          const designSystemWorkspace = project.workspaces.find(w => w.manifest.name === packageName);
          
          if (designSystemWorkspace) {
            const relativePath = ppath.relative(workspace.cwd, designSystemWorkspace.cwd);
            const reference = { path: npath.fromPortablePath(relativePath) };
            
            // Check if this reference already exists
            const referenceExists = tsconfig.references.some(ref => 
              ref.path === reference.path
            );
            
            if (!referenceExists) {
              tsconfig.references.push(reference);
            }
          }
        }
      }
    }
    
    /**
     * Ensure TypeScript declarations are generated for design system packages
     */
    async function ensureTypeDeclarations(workspace, options) {
      const tsconfigPath = ppath.join(workspace.cwd, 'tsconfig.json');
      
      // Skip if no tsconfig.json exists
      if (!await xfs.existsPromise(tsconfigPath)) {
        return;
      }
      
      try {
        // Read and parse the tsconfig.json file
        const tsconfigContent = await xfs.readFilePromise(tsconfigPath, 'utf8');
        const tsconfig = JSON.parse(tsconfigContent);
        
        // Ensure compilerOptions exists
        if (!tsconfig.compilerOptions) {
          tsconfig.compilerOptions = {};
        }
        
        // Enable declaration generation
        tsconfig.compilerOptions.declaration = true;
        tsconfig.compilerOptions.declarationMap = true;
        
        // Set output directory for declarations if not already set
        if (!tsconfig.compilerOptions.outDir) {
          tsconfig.compilerOptions.outDir = './dist';
        }
        
        // Ensure declaration directory exists
        const declarationDir = tsconfig.compilerOptions.declarationDir || tsconfig.compilerOptions.outDir;
        const declarationDirPath = ppath.join(workspace.cwd, npath.toPortablePath(declarationDir));
        await xfs.mkdirpPromise(declarationDirPath);
        
        // Write the updated tsconfig back to disk
        await xfs.writeFilePromise(tsconfigPath, JSON.stringify(tsconfig, null, 2));
        
        // Run the TypeScript compiler to generate declarations
        const env = {};
        const cwd = npath.fromPortablePath(workspace.cwd);
        
        await execUtils.execvp('tsc', ['--emitDeclarationOnly'], {
          cwd,
          env,
          strict: true,
          stdout: options.stdout,
          stderr: options.stderr,
        });
        
        options.stdout.write(`✅ Generated TypeScript declarations for ${workspace.manifest.name}\n`);
      } catch (error) {
        options.stdout.write(`❌ Error generating TypeScript declarations for ${workspace.manifest.name}: ${error.message}\n`);
      }
    }
  }
};