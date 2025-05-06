#!/usr/bin/env node

/**
 * AUSTA SuperApp Repository Health Check
 * 
 * This script performs a comprehensive health check of the repository by:
 * - Analyzing dependencies (outdated packages and security vulnerabilities)
 * - Computing code metrics (test file count and coverage percentage)
 * - Assessing CI workflows for the monorepo structure
 * - Verifying documentation completeness, including journey-specific docs
 * 
 * It generates both JSON and Markdown reports to provide a complete view of the repository's health.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for health check thresholds
const config = {
  warnThresholds: {
    testsPerFile: 1,           // Minimum tests per file ratio
    coveragePercentage: 80,    // Minimum test coverage percentage
    outOfDateWarning: 5,       // Number of outdated packages to trigger warning
    outOfDateCritical: 15,     // Number of outdated packages to trigger critical warning
    allowableVulnerabilities: 0 // Maximum allowable vulnerabilities
  },
  // Standard versions required by the technical specification
  standardVersions: {
    'typescript': '5.3.3',
    'node': '18.15.0',
    'react': '18.2.0',
    'react-native': '0.73.4',
    'next': '14.2.0',
    '@nestjs/core': '10.3.0',
    'prisma': '5.10.2',
    'express': '4.18.2',
    'graphql': '16.9.0',
    'socket.io': '4.7.4',
    'styled-components': '6.1.8',
    '@material-ui/core': '5.15.12',
    'framer-motion': '11.0.8',
    '@design-system/primitives': '1.0.0',
    '@austa/design-system': '1.0.0',
    '@austa/interfaces': '1.0.0',
    '@austa/journey-context': '1.0.0',
    'redux-toolkit': '2.1.0',
    'tanstack-query': '5.25.0',
    'apollo-client': '3.8.10',
    'react-hook-form': '7.51.0',
    'yup': '1.3.3',
    'zod': '3.22.4',
    'joi': '17.12.2',
    'i18next': '23.8.2',
    'date-fns': '3.3.1'
  },
  // Journey-specific paths to check for documentation
  journeyPaths: [
    'src/backend/health-service',
    'src/backend/care-service',
    'src/backend/plan-service',
    'src/web/mobile/src/screens/health',
    'src/web/mobile/src/screens/care',
    'src/web/mobile/src/screens/plan',
    'src/web/web/src/pages/health',
    'src/web/web/src/pages/care',
    'src/web/web/src/pages/plan'
  ]
};

/**
 * Find all package.json files in the repository
 * @returns {Array<string>} Array of package.json file paths
 */
function findPackageJsonFiles() {
  try {
    const result = execSync('find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*"', { encoding: 'utf8' });
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding package.json files:', error.message);
    return [];
  }
}

/**
 * Check for outdated dependencies using yarn
 * @returns {Object} Information about outdated dependencies
 */
function checkOutdatedDependencies() {
  try {
    const result = execSync('yarn outdated --json', { encoding: 'utf8' });
    const lines = result.trim().split('\n').filter(Boolean);
    
    // Parse JSON lines (yarn outdated --json outputs multiple JSON objects)
    const outdatedPackages = [];
    let totalOutdated = 0;
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'table') {
          totalOutdated = Object.keys(data.data).length;
          
          for (const [name, info] of Object.entries(data.data)) {
            outdatedPackages.push({
              name,
              current: info.current,
              wanted: info.wanted,
              latest: info.latest,
              packageType: info.packageType,
              url: info.url
            });
          }
        }
      } catch (e) {
        // Skip lines that aren't valid JSON
      }
    }
    
    return {
      totalOutdated,
      outdatedPackages,
      status: totalOutdated > config.warnThresholds.outOfDateCritical ? 'critical' :
              totalOutdated > config.warnThresholds.outOfDateWarning ? 'warning' : 'ok'
    };
  } catch (error) {
    console.error('Error checking outdated dependencies:', error.message);
    return { totalOutdated: 0, outdatedPackages: [], status: 'error' };
  }
}

/**
 * Check for security vulnerabilities using yarn audit
 * @returns {Object} Information about security vulnerabilities
 */
function checkSecurityVulnerabilities() {
  try {
    const result = execSync('yarn audit --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = result.trim().split('\n').filter(Boolean);
    
    // Parse JSON lines
    const vulnerabilities = [];
    let summary = { low: 0, moderate: 0, high: 0, critical: 0 };
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'auditSummary') {
          summary = {
            low: data.data.vulnerabilities.low,
            moderate: data.data.vulnerabilities.moderate,
            high: data.data.vulnerabilities.high,
            critical: data.data.vulnerabilities.critical
          };
        } else if (data.type === 'auditAdvisory') {
          vulnerabilities.push({
            package: data.data.advisory.module_name,
            severity: data.data.advisory.severity,
            vulnerable_versions: data.data.advisory.vulnerable_versions,
            patched_versions: data.data.advisory.patched_versions,
            recommendation: data.data.advisory.recommendation,
            url: data.data.advisory.url
          });
        }
      } catch (e) {
        // Skip lines that aren't valid JSON
      }
    }
    
    const totalVulnerabilities = summary.low + summary.moderate + summary.high + summary.critical;
    
    return {
      summary,
      totalVulnerabilities,
      vulnerabilities,
      status: summary.critical > 0 ? 'critical' :
              summary.high > 0 ? 'high' :
              summary.moderate > 0 ? 'moderate' :
              summary.low > 0 ? 'low' : 'ok'
    };
  } catch (error) {
    // If yarn audit fails with a non-zero exit code, it might still have output
    if (error.stdout) {
      try {
        const lines = error.stdout.toString().trim().split('\n').filter(Boolean);
        const vulnerabilities = [];
        let summary = { low: 0, moderate: 0, high: 0, critical: 0 };
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'auditSummary') {
              summary = {
                low: data.data.vulnerabilities.low,
                moderate: data.data.vulnerabilities.moderate,
                high: data.data.vulnerabilities.high,
                critical: data.data.vulnerabilities.critical
              };
            } else if (data.type === 'auditAdvisory') {
              vulnerabilities.push({
                package: data.data.advisory.module_name,
                severity: data.data.advisory.severity,
                vulnerable_versions: data.data.advisory.vulnerable_versions,
                patched_versions: data.data.advisory.patched_versions,
                recommendation: data.data.advisory.recommendation,
                url: data.data.advisory.url
              });
            }
          } catch (e) {
            // Skip lines that aren't valid JSON
          }
        }
        
        const totalVulnerabilities = summary.low + summary.moderate + summary.high + summary.critical;
        
        return {
          summary,
          totalVulnerabilities,
          vulnerabilities,
          status: summary.critical > 0 ? 'critical' :
                  summary.high > 0 ? 'high' :
                  summary.moderate > 0 ? 'moderate' :
                  summary.low > 0 ? 'low' : 'ok'
        };
      } catch (e) {
        console.error('Error parsing yarn audit output:', e.message);
      }
    }
    
    console.error('Error checking security vulnerabilities:', error.message);
    return {
      summary: { low: 0, moderate: 0, high: 0, critical: 0 },
      totalVulnerabilities: 0,
      vulnerabilities: [],
      status: 'error'
    };
  }
}

/**
 * Check for test files and compute test coverage
 * @returns {Object} Information about test files and coverage
 */
function checkTestCoverage() {
  try {
    // Count source files (excluding tests, node_modules, dist)
    const sourceFilesCmd = 'find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" | grep -v "node_modules" | grep -v "dist" | grep -v "test" | grep -v "__tests__" | wc -l';
    const sourceFilesCount = parseInt(execSync(sourceFilesCmd, { encoding: 'utf8' }).trim(), 10);
    
    // Count test files
    const testFilesCmd = 'find . -type f -name "*.test.js" -o -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.test.jsx" -o -name "*.spec.js" -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.spec.jsx" | grep -v "node_modules" | grep -v "dist" | wc -l';
    const testFilesCount = parseInt(execSync(testFilesCmd, { encoding: 'utf8' }).trim(), 10);
    
    // Calculate test-to-source ratio
    const testToSourceRatio = sourceFilesCount > 0 ? testFilesCount / sourceFilesCount : 0;
    
    // Check if coverage report exists
    let coveragePercentage = 0;
    let hasCoverageReport = false;
    
    if (fs.existsSync('coverage/coverage-summary.json')) {
      hasCoverageReport = true;
      const coverageData = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
      coveragePercentage = coverageData.total.statements.pct || 0;
    } else if (fs.existsSync('coverage/lcov-report/index.html')) {
      hasCoverageReport = true;
      // Try to extract coverage from HTML report (less accurate)
      const htmlContent = fs.readFileSync('coverage/lcov-report/index.html', 'utf8');
      const match = htmlContent.match(/All files[\s\S]*?(\d+\.\d+)%/i);
      if (match && match[1]) {
        coveragePercentage = parseFloat(match[1]);
      }
    }
    
    return {
      sourceFilesCount,
      testFilesCount,
      testToSourceRatio,
      hasCoverageReport,
      coveragePercentage,
      status: testToSourceRatio < config.warnThresholds.testsPerFile ? 'warning' :
              hasCoverageReport && coveragePercentage < config.warnThresholds.coveragePercentage ? 'warning' : 'ok'
    };
  } catch (error) {
    console.error('Error checking test coverage:', error.message);
    return {
      sourceFilesCount: 0,
      testFilesCount: 0,
      testToSourceRatio: 0,
      hasCoverageReport: false,
      coveragePercentage: 0,
      status: 'error'
    };
  }
}

/**
 * Check CI workflows for the monorepo structure
 * @returns {Object} Information about CI workflows
 */
function checkCIWorkflows() {
  const workflowsDir = '.github/workflows';
  const requiredWorkflows = [
    'ci.yml',                // Main CI workflow
    'dependency-check.yml',  // Dependency validation
    'test.yml',              // Test execution
    'build.yml',             // Build verification
    'deploy-staging.yml',    // Staging deployment
    'deploy-production.yml'  // Production deployment
  ];
  
  try {
    if (!fs.existsSync(workflowsDir)) {
      return {
        hasWorkflowsDir: false,
        workflowFiles: [],
        missingWorkflows: requiredWorkflows,
        status: 'critical'
      };
    }
    
    const workflowFiles = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
    
    // Check for required workflows
    const missingWorkflows = requiredWorkflows.filter(workflow => {
      return !workflowFiles.some(file => file === workflow || file === workflow.replace('.yml', '.yaml'));
    });
    
    // Check if workflows support the monorepo structure
    const monorepoSupport = {
      hasMatrixStrategy: false,
      hasDependencyValidation: false,
      hasWorkspaceAwareBuild: false
    };
    
    for (const file of workflowFiles) {
      const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
      
      // Check for matrix strategy
      if (content.includes('matrix:') && content.includes('strategy:')) {
        monorepoSupport.hasMatrixStrategy = true;
      }
      
      // Check for dependency validation
      if (content.includes('dependency-resolution') || 
          content.includes('validate-dependencies') || 
          content.includes('deps:check-consistency')) {
        monorepoSupport.hasDependencyValidation = true;
      }
      
      // Check for workspace-aware build
      if ((content.includes('workspace') || content.includes('workspaces')) && 
          content.includes('build')) {
        monorepoSupport.hasWorkspaceAwareBuild = true;
      }
    }
    
    return {
      hasWorkflowsDir: true,
      workflowFiles,
      missingWorkflows,
      monorepoSupport,
      status: missingWorkflows.length > 0 ? 'warning' :
              !monorepoSupport.hasMatrixStrategy || 
              !monorepoSupport.hasDependencyValidation || 
              !monorepoSupport.hasWorkspaceAwareBuild ? 'warning' : 'ok'
    };
  } catch (error) {
    console.error('Error checking CI workflows:', error.message);
    return {
      hasWorkflowsDir: false,
      workflowFiles: [],
      missingWorkflows: requiredWorkflows,
      monorepoSupport: {
        hasMatrixStrategy: false,
        hasDependencyValidation: false,
        hasWorkspaceAwareBuild: false
      },
      status: 'error'
    };
  }
}

/**
 * Check for documentation completeness
 * @returns {Object} Information about documentation completeness
 */
function checkDocumentation() {
  try {
    // Check for root documentation files
    const rootDocs = ['README.md', 'CONTRIBUTING.md', 'DEPENDENCY_FIXES.md'];
    const missingRootDocs = rootDocs.filter(doc => !fs.existsSync(doc));
    
    // Check for journey-specific documentation
    const journeyDocs = [];
    const missingJourneyDocs = [];
    
    for (const journeyPath of config.journeyPaths) {
      if (fs.existsSync(journeyPath)) {
        // Check for README.md or docs/ directory in journey path
        const hasReadme = fs.existsSync(path.join(journeyPath, 'README.md'));
        const hasDocsDir = fs.existsSync(path.join(journeyPath, 'docs')) && 
                          fs.statSync(path.join(journeyPath, 'docs')).isDirectory();
        
        if (hasReadme || hasDocsDir) {
          journeyDocs.push({
            path: journeyPath,
            hasReadme,
            hasDocsDir
          });
        } else {
          missingJourneyDocs.push(journeyPath);
        }
      }
    }
    
    // Check for API documentation
    const hasApiDocs = fs.existsSync('docs/api') || fs.existsSync('api-docs');
    
    // Check for design system documentation
    const hasDesignSystemDocs = fs.existsSync('src/web/design-system/.storybook') || 
                               fs.existsSync('src/web/design-system/docs');
    
    return {
      missingRootDocs,
      journeyDocs,
      missingJourneyDocs,
      hasApiDocs,
      hasDesignSystemDocs,
      status: missingRootDocs.length > 0 || missingJourneyDocs.length > 0 ? 'warning' : 'ok'
    };
  } catch (error) {
    console.error('Error checking documentation:', error.message);
    return {
      missingRootDocs: [],
      journeyDocs: [],
      missingJourneyDocs: [],
      hasApiDocs: false,
      hasDesignSystemDocs: false,
      status: 'error'
    };
  }
}

/**
 * Check for standardized versions in package.json files
 * @param {Array<string>} packageJsonFiles - Array of package.json file paths
 * @returns {Object} Information about version standardization
 */
function checkStandardizedVersions(packageJsonFiles) {
  try {
    const versionIssues = [];
    const packageVersions = {};
    
    // Collect all package versions
    for (const filePath of packageJsonFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const packageJson = JSON.parse(content);
      
      // Check dependencies, devDependencies, and peerDependencies
      const allDependencies = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {},
        ...packageJson.peerDependencies || {}
      };
      
      for (const [name, version] of Object.entries(allDependencies)) {
        if (config.standardVersions[name]) {
          if (!packageVersions[name]) {
            packageVersions[name] = [];
          }
          
          // Clean version string (remove ^, ~, etc.)
          const cleanVersion = version.replace(/[^0-9.]/g, '');
          
          packageVersions[name].push({
            filePath,
            version: cleanVersion,
            rawVersion: version
          });
        }
      }
    }
    
    // Check for version inconsistencies
    for (const [name, standard] of Object.entries(config.standardVersions)) {
      if (packageVersions[name]) {
        const nonStandardVersions = packageVersions[name].filter(item => {
          return item.version !== standard.replace(/[^0-9.]/g, '');
        });
        
        if (nonStandardVersions.length > 0) {
          versionIssues.push({
            package: name,
            standardVersion: standard,
            nonStandardInstances: nonStandardVersions
          });
        }
      }
    }
    
    // Check for missing required packages
    const missingPackages = Object.keys(config.standardVersions)
      .filter(name => !packageVersions[name] || packageVersions[name].length === 0);
    
    return {
      versionIssues,
      missingPackages,
      status: versionIssues.length > 0 ? 'warning' : 'ok'
    };
  } catch (error) {
    console.error('Error checking standardized versions:', error.message);
    return {
      versionIssues: [],
      missingPackages: [],
      status: 'error'
    };
  }
}

/**
 * Generate a Markdown report from the health check results
 * @param {Object} results - Health check results
 * @returns {string} Markdown report
 */
function generateMarkdownReport(results) {
  const { 
    outdatedDependencies, 
    securityVulnerabilities, 
    testCoverage, 
    ciWorkflows, 
    documentation,
    standardizedVersions
  } = results;
  
  let markdown = `# Repository Health Report\n\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Overall health status
  const statuses = [
    outdatedDependencies.status,
    securityVulnerabilities.status,
    testCoverage.status,
    ciWorkflows.status,
    documentation.status,
    standardizedVersions.status
  ];
  
  const overallStatus = statuses.includes('critical') ? 'Critical Issues' :
                        statuses.includes('high') ? 'High Severity Issues' :
                        statuses.includes('warning') ? 'Warnings' : 'Healthy';
  
  markdown += `## Overall Status: ${overallStatus}\n\n`;
  
  // Dependencies section
  markdown += `## Dependencies\n\n`;
  
  markdown += `### Outdated Dependencies\n\n`;
  markdown += `- Total outdated packages: ${outdatedDependencies.totalOutdated}\n`;
  markdown += `- Status: ${outdatedDependencies.status}\n\n`;
  
  if (outdatedDependencies.outdatedPackages.length > 0) {
    markdown += `| Package | Current | Wanted | Latest |\n`;
    markdown += `|---------|---------|--------|--------|\n`;
    
    for (const pkg of outdatedDependencies.outdatedPackages) {
      markdown += `| ${pkg.name} | ${pkg.current} | ${pkg.wanted} | ${pkg.latest} |\n`;
    }
    markdown += `\n`;
  }
  
  markdown += `### Security Vulnerabilities\n\n`;
  markdown += `- Total vulnerabilities: ${securityVulnerabilities.totalVulnerabilities}\n`;
  markdown += `- Critical: ${securityVulnerabilities.summary.critical}\n`;
  markdown += `- High: ${securityVulnerabilities.summary.high}\n`;
  markdown += `- Moderate: ${securityVulnerabilities.summary.moderate}\n`;
  markdown += `- Low: ${securityVulnerabilities.summary.low}\n`;
  markdown += `- Status: ${securityVulnerabilities.status}\n\n`;
  
  if (securityVulnerabilities.vulnerabilities.length > 0) {
    markdown += `| Package | Severity | Vulnerable Versions | Patched Versions |\n`;
    markdown += `|---------|----------|---------------------|-----------------|\n`;
    
    for (const vuln of securityVulnerabilities.vulnerabilities) {
      markdown += `| ${vuln.package} | ${vuln.severity} | ${vuln.vulnerable_versions} | ${vuln.patched_versions} |\n`;
    }
    markdown += `\n`;
  }
  
  // Standardized Versions section
  markdown += `### Standardized Versions\n\n`;
  markdown += `- Status: ${standardizedVersions.status}\n`;
  markdown += `- Version issues: ${standardizedVersions.versionIssues.length}\n`;
  markdown += `- Missing required packages: ${standardizedVersions.missingPackages.length}\n\n`;
  
  if (standardizedVersions.versionIssues.length > 0) {
    markdown += `#### Non-Standard Versions\n\n`;
    markdown += `| Package | Standard Version | Non-Standard Instances |\n`;
    markdown += `|---------|-----------------|------------------------|\n`;
    
    for (const issue of standardizedVersions.versionIssues) {
      const instances = issue.nonStandardInstances.map(i => `${i.filePath}: ${i.rawVersion}`).join(', ');
      markdown += `| ${issue.package} | ${issue.standardVersion} | ${instances} |\n`;
    }
    markdown += `\n`;
  }
  
  if (standardizedVersions.missingPackages.length > 0) {
    markdown += `#### Missing Required Packages\n\n`;
    markdown += `The following required packages are missing from the repository:\n\n`;
    
    for (const pkg of standardizedVersions.missingPackages) {
      markdown += `- ${pkg} (standard version: ${config.standardVersions[pkg]})\n`;
    }
    markdown += `\n`;
  }
  
  // Test Coverage section
  markdown += `## Test Coverage\n\n`;
  markdown += `- Source files: ${testCoverage.sourceFilesCount}\n`;
  markdown += `- Test files: ${testCoverage.testFilesCount}\n`;
  markdown += `- Test-to-source ratio: ${testCoverage.testToSourceRatio.toFixed(2)}\n`;
  markdown += `- Has coverage report: ${testCoverage.hasCoverageReport ? 'Yes' : 'No'}\n`;
  
  if (testCoverage.hasCoverageReport) {
    markdown += `- Coverage percentage: ${testCoverage.coveragePercentage.toFixed(2)}%\n`;
  }
  
  markdown += `- Status: ${testCoverage.status}\n\n`;
  
  // CI Workflows section
  markdown += `## CI Workflows\n\n`;
  markdown += `- Has workflows directory: ${ciWorkflows.hasWorkflowsDir ? 'Yes' : 'No'}\n`;
  markdown += `- Workflow files: ${ciWorkflows.workflowFiles.length}\n`;
  markdown += `- Missing workflows: ${ciWorkflows.missingWorkflows.length > 0 ? ciWorkflows.missingWorkflows.join(', ') : 'None'}\n`;
  markdown += `- Status: ${ciWorkflows.status}\n\n`;
  
  if (ciWorkflows.hasWorkflowsDir) {
    markdown += `### Monorepo Support\n\n`;
    markdown += `- Has matrix strategy: ${ciWorkflows.monorepoSupport.hasMatrixStrategy ? 'Yes' : 'No'}\n`;
    markdown += `- Has dependency validation: ${ciWorkflows.monorepoSupport.hasDependencyValidation ? 'Yes' : 'No'}\n`;
    markdown += `- Has workspace-aware build: ${ciWorkflows.monorepoSupport.hasWorkspaceAwareBuild ? 'Yes' : 'No'}\n\n`;
  }
  
  // Documentation section
  markdown += `## Documentation\n\n`;
  markdown += `- Missing root docs: ${documentation.missingRootDocs.length > 0 ? documentation.missingRootDocs.join(', ') : 'None'}\n`;
  markdown += `- Journey docs: ${documentation.journeyDocs.length}\n`;
  markdown += `- Missing journey docs: ${documentation.missingJourneyDocs.length > 0 ? documentation.missingJourneyDocs.join(', ') : 'None'}\n`;
  markdown += `- Has API docs: ${documentation.hasApiDocs ? 'Yes' : 'No'}\n`;
  markdown += `- Has Design System docs: ${documentation.hasDesignSystemDocs ? 'Yes' : 'No'}\n`;
  markdown += `- Status: ${documentation.status}\n\n`;
  
  // Recommendations section
  markdown += `## Recommendations\n\n`;
  
  if (outdatedDependencies.status !== 'ok') {
    markdown += `### Dependencies\n\n`;
    markdown += `- Run \`yarn upgrade-interactive\` to update outdated dependencies\n`;
    markdown += `- Consider using \`scripts/fix-dependencies.js\` to automatically fix common dependency issues\n`;
  }
  
  if (securityVulnerabilities.status !== 'ok') {
    markdown += `### Security\n\n`;
    markdown += `- Run \`scripts/fix-security-vulnerabilities.js\` to automatically fix known security vulnerabilities\n`;
    markdown += `- Review and address remaining security issues manually\n`;
  }
  
  if (standardizedVersions.status !== 'ok') {
    markdown += `### Version Standardization\n\n`;
    markdown += `- Update package versions to match the standardized versions defined in the technical specification\n`;
    markdown += `- Add missing required packages to the appropriate package.json files\n`;
  }
  
  if (testCoverage.status !== 'ok') {
    markdown += `### Testing\n\n`;
    markdown += `- Increase test coverage to at least ${config.warnThresholds.coveragePercentage}%\n`;
    markdown += `- Add more test files to improve the test-to-source ratio\n`;
  }
  
  if (ciWorkflows.status !== 'ok') {
    markdown += `### CI Workflows\n\n`;
    
    if (ciWorkflows.missingWorkflows.length > 0) {
      markdown += `- Add missing workflow files: ${ciWorkflows.missingWorkflows.join(', ')}\n`;
    }
    
    if (!ciWorkflows.monorepoSupport.hasMatrixStrategy) {
      markdown += `- Add matrix strategy to CI workflows to support the monorepo structure\n`;
    }
    
    if (!ciWorkflows.monorepoSupport.hasDependencyValidation) {
      markdown += `- Add dependency validation steps to CI workflows\n`;
    }
    
    if (!ciWorkflows.monorepoSupport.hasWorkspaceAwareBuild) {
      markdown += `- Update build steps to be workspace-aware\n`;
    }
  }
  
  if (documentation.status !== 'ok') {
    markdown += `### Documentation\n\n`;
    
    if (documentation.missingRootDocs.length > 0) {
      markdown += `- Add missing root documentation files: ${documentation.missingRootDocs.join(', ')}\n`;
    }
    
    if (documentation.missingJourneyDocs.length > 0) {
      markdown += `- Add README.md or docs/ directory to journey paths: ${documentation.missingJourneyDocs.join(', ')}\n`;
    }
    
    if (!documentation.hasApiDocs) {
      markdown += `- Add API documentation\n`;
    }
    
    if (!documentation.hasDesignSystemDocs) {
      markdown += `- Add Design System documentation\n`;
    }
  }
  
  return markdown;
}

/**
 * Main function to run the health check
 */
function main() {
  console.log('Starting repository health check...');
  
  // Find all package.json files
  const packageJsonFiles = findPackageJsonFiles();
  console.log(`Found ${packageJsonFiles.length} package.json files`);
  
  // Run all checks
  const results = {
    outdatedDependencies: checkOutdatedDependencies(),
    securityVulnerabilities: checkSecurityVulnerabilities(),
    testCoverage: checkTestCoverage(),
    ciWorkflows: checkCIWorkflows(),
    documentation: checkDocumentation(),
    standardizedVersions: checkStandardizedVersions(packageJsonFiles)
  };
  
  // Generate reports
  const jsonReport = JSON.stringify(results, null, 2);
  const markdownReport = generateMarkdownReport(results);
  
  // Write reports to files
  fs.writeFileSync('repo-health-report.json', jsonReport);
  fs.writeFileSync('REPO_HEALTH.md', markdownReport);
  
  console.log('Repository health check complete');
  console.log('JSON report written to repo-health-report.json');
  console.log('Markdown report written to REPO_HEALTH.md');
  
  // Determine exit code based on results
  const statuses = [
    results.outdatedDependencies.status,
    results.securityVulnerabilities.status,
    results.testCoverage.status,
    results.ciWorkflows.status,
    results.documentation.status,
    results.standardizedVersions.status
  ];
  
  if (statuses.includes('critical') || statuses.includes('high')) {
    console.error('Critical or high severity issues found. Please review the reports and address the issues.');
    process.exit(1);
  } else if (statuses.includes('warning')) {
    console.warn('Warnings found. Please review the reports and address the issues.');
    process.exit(0); // Exit with success but log warnings
  } else {
    console.log('No issues found. Repository is healthy.');
    process.exit(0);
  }
}

// Run the main function
main();