#!/usr/bin/env node

/**
 * AUSTA SuperApp Security Report Generator
 * 
 * This script automates a monorepo-wide security audit by invoking the package manager CLI,
 * parsing its JSON output, and producing both a human-readable HTML report and a 
 * machine-readable JSON file. It captures vulnerability information, generates remediation
 * recommendations, and provides a comprehensive security overview.
 * 
 * Features:
 * - Supports npm, yarn, and pnpm package managers
 * - Handles monorepo structure with workspace-aware scanning
 * - Generates journey-specific vulnerability reports
 * - Validates against standardized versions from technical specifications
 * - Produces both HTML and JSON reports
 * 
 * Usage: node generate-security-report.js [--package-manager=<npm|yarn|pnpm>] [--output-dir=<path>]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Configuration
const CONFIG = {
  // Default package manager
  packageManager: 'pnpm',
  // Output directory for reports
  outputDir: path.join(process.cwd(), 'security-reports'),
  // Repository root directory
  repoRoot: path.join(process.cwd(), '..'),
  // Date format for report
  dateFormat: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  // Journey paths for specialized reporting
  journeyPaths: {
    health: 'src/backend/health-service',
    care: 'src/backend/care-service',
    plan: 'src/backend/plan-service'
  },
  // New monorepo structure packages
  newPackages: [
    'src/web/design-system',
    'src/web/primitives',
    'src/web/interfaces',
    'src/web/journey-context'
  ],
  // Standardized versions from technical specification
  standardizedVersions: {
    // Backend
    'nestjs': '10.3.0',
    'prisma': '5.10.2',
    'typeorm': '0.3.20',
    'kafkajs': '2.2.4',
    'ioredis': '5.3.2',
    'class-validator': '0.14.1',
    'class-transformer': '0.5.1',
    // Frontend
    'react': '18.2.0',
    'react-native': '0.71.8',
    'axios': '1.6.8',
    'react-router-dom': '6.21.1',
    'react-hook-form': '7.45.0',
    'react-native-reanimated': '3.3.0',
    'react-native-gesture-handler': '2.12.0',
    'react-native-svg': '13.10.0',
    // Node.js version
    'node': '18.15.0'
  },
  // Severity levels for vulnerabilities
  severityLevels: ['critical', 'high', 'moderate', 'low'],
  // Vulnerability categories
  vulnerabilityCategories: {
    'RCE': 'Remote Code Execution',
    'XSS': 'Cross-Site Scripting',
    'CSRF': 'Cross-Site Request Forgery',
    'SSRF': 'Server-Side Request Forgery',
    'DOS': 'Denial of Service',
    'INJECTION': 'Injection Attack',
    'PROTOTYPE_POLLUTION': 'Prototype Pollution',
    'INFORMATION_DISCLOSURE': 'Information Disclosure',
    'AUTHORIZATION': 'Authorization Issues',
    'AUTHENTICATION': 'Authentication Issues',
    'OTHER': 'Other Vulnerabilities'
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  args.forEach(arg => {
    if (arg.startsWith('--package-manager=')) {
      CONFIG.packageManager = arg.split('=')[1];
    } else if (arg.startsWith('--output-dir=')) {
      CONFIG.outputDir = arg.split('=')[1];
    }
  });

  // Validate package manager
  if (!['npm', 'yarn', 'pnpm'].includes(CONFIG.packageManager)) {
    console.error(`Error: Unsupported package manager '${CONFIG.packageManager}'. Use npm, yarn, or pnpm.`);
    process.exit(1);
  }
}

// Ensure output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

// Run security audit with the selected package manager
function runSecurityAudit() {
  console.log(`Running security audit with ${CONFIG.packageManager}...`);
  
  try {
    let auditCommand;
    switch (CONFIG.packageManager) {
      case 'npm':
        auditCommand = 'npm audit --json';
        break;
      case 'yarn':
        auditCommand = 'yarn audit --json';
        break;
      case 'pnpm':
        auditCommand = 'pnpm audit --json';
        break;
    }
    
    const auditOutput = execSync(auditCommand, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(auditOutput);
  } catch (error) {
    // Package managers exit with non-zero code when vulnerabilities are found
    // We need to capture the output and parse it
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch (parseError) {
        console.error('Error parsing audit output:', parseError);
        console.error('Raw output:', error.stdout);
        process.exit(1);
      }
    } else {
      console.error('Error running audit command:', error.message);
      process.exit(1);
    }
  }
}

// Get workspace information for monorepo
function getWorkspaces() {
  console.log('Analyzing workspace structure...');
  
  try {
    let workspaceCommand;
    switch (CONFIG.packageManager) {
      case 'npm':
        workspaceCommand = 'npm query ".workspace"';
        break;
      case 'yarn':
        workspaceCommand = 'yarn workspaces info --json';
        break;
      case 'pnpm':
        workspaceCommand = 'pnpm ls -r --depth -1 --json';
        break;
    }
    
    const workspaceOutput = execSync(workspaceCommand, { encoding: 'utf8' });
    let workspaces;
    
    if (CONFIG.packageManager === 'npm') {
      workspaces = JSON.parse(workspaceOutput);
    } else if (CONFIG.packageManager === 'yarn') {
      // Extract the JSON part from yarn's output
      const jsonStart = workspaceOutput.indexOf('{');
      const jsonEnd = workspaceOutput.lastIndexOf('}') + 1;
      workspaces = JSON.parse(workspaceOutput.substring(jsonStart, jsonEnd));
    } else if (CONFIG.packageManager === 'pnpm') {
      workspaces = JSON.parse(workspaceOutput);
    }
    
    return workspaces;
  } catch (error) {
    console.warn('Warning: Could not determine workspace structure:', error.message);
    return null;
  }
}

// Process audit results and organize by workspace/journey
function processAuditResults(auditResults, workspaces) {
  console.log('Processing audit results...');
  
  // Initialize processed results structure
  const processed = {
    summary: {
      total: 0,
      bySeverity: {},
      byCategory: {},
      byJourney: {},
      byPackage: {}
    },
    vulnerabilities: [],
    journeys: {
      health: { vulnerabilities: [] },
      care: { vulnerabilities: [] },
      plan: { vulnerabilities: [] }
    },
    newPackages: {
      'design-system': { vulnerabilities: [] },
      'primitives': { vulnerabilities: [] },
      'interfaces': { vulnerabilities: [] },
      'journey-context': { vulnerabilities: [] }
    },
    versionMismatches: [],
    remediations: {}
  };
  
  // Different package managers have different output formats
  let vulnerabilities = [];
  let advisories = {};
  
  if (CONFIG.packageManager === 'npm') {
    advisories = auditResults.advisories || {};
    vulnerabilities = Object.values(advisories);
  } else if (CONFIG.packageManager === 'yarn') {
    advisories = auditResults.data?.advisories || {};
    vulnerabilities = Object.values(advisories);
  } else if (CONFIG.packageManager === 'pnpm') {
    vulnerabilities = auditResults.vulnerabilities || [];
    // Convert to a format similar to npm/yarn for consistency
    vulnerabilities = vulnerabilities.map(vuln => ({
      id: vuln.id,
      title: vuln.title,
      module_name: vuln.name,
      vulnerable_versions: vuln.range,
      severity: vuln.severity,
      overview: vuln.description,
      recommendation: vuln.recommendation || `Update ${vuln.name} to a non-vulnerable version`,
      url: vuln.url,
      findings: vuln.dependencyOf?.map(dep => ({ version: dep.version, paths: [dep.path] })) || []
    }));
  }
  
  // Process each vulnerability
  vulnerabilities.forEach(vuln => {
    // Add to total count
    processed.summary.total++;
    
    // Count by severity
    processed.summary.bySeverity[vuln.severity] = (processed.summary.bySeverity[vuln.severity] || 0) + 1;
    
    // Determine category based on title/overview
    const category = determineCategory(vuln);
    processed.summary.byCategory[category] = (processed.summary.byCategory[category] || 0) + 1;
    
    // Count by package
    processed.summary.byPackage[vuln.module_name] = (processed.summary.byPackage[vuln.module_name] || 0) + 1;
    
    // Add remediation info
    if (vuln.recommendation) {
      processed.remediations[vuln.module_name] = vuln.recommendation;
    }
    
    // Create enriched vulnerability object
    const enrichedVuln = {
      ...vuln,
      category,
      affectedJourneys: [],
      affectedNewPackages: [],
      isStandardizedVersion: isStandardizedDependency(vuln.module_name)
    };
    
    // Determine affected journeys and new packages
    if (vuln.findings) {
      vuln.findings.forEach(finding => {
        if (finding.paths) {
          finding.paths.forEach(path => {
            // Check journeys
            Object.keys(CONFIG.journeyPaths).forEach(journey => {
              if (path.includes(CONFIG.journeyPaths[journey])) {
                if (!enrichedVuln.affectedJourneys.includes(journey)) {
                  enrichedVuln.affectedJourneys.push(journey);
                  processed.journeys[journey].vulnerabilities.push(enrichedVuln);
                  processed.summary.byJourney[journey] = (processed.summary.byJourney[journey] || 0) + 1;
                }
              }
            });
            
            // Check new packages
            CONFIG.newPackages.forEach(pkg => {
              const pkgName = pkg.split('/').pop();
              if (path.includes(pkg)) {
                if (!enrichedVuln.affectedNewPackages.includes(pkgName)) {
                  enrichedVuln.affectedNewPackages.push(pkgName);
                  processed.newPackages[pkgName].vulnerabilities.push(enrichedVuln);
                }
              }
            });
          });
        }
      });
    }
    
    // Add to main vulnerabilities list
    processed.vulnerabilities.push(enrichedVuln);
  });
  
  // Check for version mismatches with standardized versions
  processed.versionMismatches = checkVersionMismatches();
  
  return processed;
}

// Determine vulnerability category based on title and overview
function determineCategory(vulnerability) {
  const title = (vulnerability.title || '').toLowerCase();
  const overview = (vulnerability.overview || '').toLowerCase();
  const combinedText = `${title} ${overview}`;
  
  if (combinedText.includes('remote code execution') || combinedText.includes('rce')) {
    return 'RCE';
  } else if (combinedText.includes('cross-site scripting') || combinedText.includes('xss')) {
    return 'XSS';
  } else if (combinedText.includes('cross-site request forgery') || combinedText.includes('csrf')) {
    return 'CSRF';
  } else if (combinedText.includes('server-side request forgery') || combinedText.includes('ssrf')) {
    return 'SSRF';
  } else if (combinedText.includes('denial of service') || combinedText.includes('dos')) {
    return 'DOS';
  } else if (combinedText.includes('injection') || combinedText.includes('sql injection')) {
    return 'INJECTION';
  } else if (combinedText.includes('prototype pollution')) {
    return 'PROTOTYPE_POLLUTION';
  } else if (combinedText.includes('information disclosure') || combinedText.includes('data leak')) {
    return 'INFORMATION_DISCLOSURE';
  } else if (combinedText.includes('authorization') || combinedText.includes('permission')) {
    return 'AUTHORIZATION';
  } else if (combinedText.includes('authentication') || combinedText.includes('login')) {
    return 'AUTHENTICATION';
  } else {
    return 'OTHER';
  }
}

// Check if a dependency has a standardized version
function isStandardizedDependency(packageName) {
  return Object.keys(CONFIG.standardizedVersions).some(key => {
    return packageName === key || packageName.startsWith(`@${key}/`) || packageName.includes(key);
  });
}

// Check for version mismatches with standardized versions
function checkVersionMismatches() {
  console.log('Checking for version mismatches...');
  
  const mismatches = [];
  
  try {
    let listCommand;
    switch (CONFIG.packageManager) {
      case 'npm':
        listCommand = 'npm ls --json --all';
        break;
      case 'yarn':
        listCommand = 'yarn list --json --pattern "*"';
        break;
      case 'pnpm':
        listCommand = 'pnpm ls -r --json';
        break;
    }
    
    const listOutput = execSync(listCommand, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const dependencies = JSON.parse(listOutput);
    
    // Process dependencies based on package manager format
    let allDeps = {};
    
    if (CONFIG.packageManager === 'npm') {
      extractDependencies(dependencies, allDeps);
    } else if (CONFIG.packageManager === 'yarn') {
      dependencies.data.trees.forEach(tree => {
        const name = tree.name.split('@')[0];
        const version = tree.name.split('@')[1];
        allDeps[name] = version;
      });
    } else if (CONFIG.packageManager === 'pnpm') {
      dependencies.forEach(pkg => {
        if (pkg.dependencies) {
          Object.entries(pkg.dependencies).forEach(([name, version]) => {
            allDeps[name] = version;
          });
        }
      });
    }
    
    // Check for mismatches with standardized versions
    Object.entries(CONFIG.standardizedVersions).forEach(([name, standardVersion]) => {
      if (allDeps[name] && allDeps[name] !== standardVersion) {
        mismatches.push({
          packageName: name,
          currentVersion: allDeps[name],
          standardizedVersion: standardVersion,
          severity: determineMismatchSeverity(name, allDeps[name], standardVersion)
        });
      }
    });
    
    return mismatches;
  } catch (error) {
    console.warn('Warning: Could not check for version mismatches:', error.message);
    return [];
  }
}

// Recursively extract dependencies from npm ls output
function extractDependencies(node, result) {
  if (node.dependencies) {
    Object.entries(node.dependencies).forEach(([name, info]) => {
      if (info.version) {
        result[name] = info.version;
      }
      extractDependencies(info, result);
    });
  }
}

// Determine severity of version mismatch
function determineMismatchSeverity(packageName, currentVersion, standardVersion) {
  // Major version mismatch is high severity
  const currentMajor = parseInt(currentVersion.split('.')[0]);
  const standardMajor = parseInt(standardVersion.split('.')[0]);
  
  if (currentMajor !== standardMajor) {
    return 'high';
  }
  
  // Minor version mismatch is moderate severity
  const currentMinor = parseInt(currentVersion.split('.')[1]);
  const standardMinor = parseInt(standardVersion.split('.')[1]);
  
  if (currentMinor !== standardMinor) {
    return 'moderate';
  }
  
  // Patch version mismatch is low severity
  return 'low';
}

// Generate HTML report
function generateHtmlReport(results) {
  console.log('Generating HTML report...');
  
  const reportDate = new Date().toLocaleDateString('en-US', CONFIG.dateFormat);
  const reportPath = path.join(CONFIG.outputDir, `security-report-${Date.now()}.html`);
  
  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AUSTA SuperApp Security Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 {
      color: #2c3e50;
    }
    .header {
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .summary-box {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .summary-item {
      background-color: white;
      border-radius: 5px;
      padding: 10px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .vulnerability-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .vulnerability-table th {
      background-color: #f1f1f1;
      text-align: left;
      padding: 10px;
    }
    .vulnerability-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .severity-critical {
      color: #fff;
      background-color: #e74c3c;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
    .severity-high {
      color: #fff;
      background-color: #e67e22;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
    .severity-moderate {
      color: #fff;
      background-color: #f39c12;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
    .severity-low {
      color: #fff;
      background-color: #3498db;
      padding: 3px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
    .journey-badge {
      display: inline-block;
      background-color: #9b59b6;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      margin-right: 5px;
      font-size: 0.8em;
    }
    .package-badge {
      display: inline-block;
      background-color: #2ecc71;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      margin-right: 5px;
      font-size: 0.8em;
    }
    .standardized {
      background-color: #3498db;
    }
    .tab {
      overflow: hidden;
      border: 1px solid #ccc;
      background-color: #f1f1f1;
      border-radius: 5px 5px 0 0;
    }
    .tab button {
      background-color: inherit;
      float: left;
      border: none;
      outline: none;
      cursor: pointer;
      padding: 10px 16px;
      transition: 0.3s;
      font-size: 16px;
    }
    .tab button:hover {
      background-color: #ddd;
    }
    .tab button.active {
      background-color: #3498db;
      color: white;
    }
    .tabcontent {
      display: none;
      padding: 20px;
      border: 1px solid #ccc;
      border-top: none;
      border-radius: 0 0 5px 5px;
      animation: fadeEffect 1s;
    }
    @keyframes fadeEffect {
      from {opacity: 0;}
      to {opacity: 1;}
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AUSTA SuperApp Security Report</h1>
    <p>Generated on: ${reportDate}</p>
    <p>Package Manager: ${CONFIG.packageManager}</p>
  </div>
  
  <div class="summary-box">
    <h2>Executive Summary</h2>
    <p>Total vulnerabilities found: <strong>${results.summary.total}</strong></p>
    
    <div class="summary-grid">
      <div class="summary-item">
        <h3>By Severity</h3>
        <ul>
          ${CONFIG.severityLevels.map(severity => 
            `<li><span class="severity-${severity}">${severity}</span>: ${results.summary.bySeverity[severity] || 0}</li>`
          ).join('')}
        </ul>
      </div>
      
      <div class="summary-item">
        <h3>By Category</h3>
        <ul>
          ${Object.entries(CONFIG.vulnerabilityCategories).map(([key, label]) => 
            `<li>${label}: ${results.summary.byCategory[key] || 0}</li>`
          ).join('')}
        </ul>
      </div>
      
      <div class="summary-item">
        <h3>By Journey</h3>
        <ul>
          <li>Health Journey: ${results.summary.byJourney.health || 0}</li>
          <li>Care Journey: ${results.summary.byJourney.care || 0}</li>
          <li>Plan Journey: ${results.summary.byJourney.plan || 0}</li>
        </ul>
      </div>
      
      <div class="summary-item">
        <h3>New Packages</h3>
        <ul>
          <li>Design System: ${results.newPackages['design-system'].vulnerabilities.length}</li>
          <li>Primitives: ${results.newPackages.primitives.vulnerabilities.length}</li>
          <li>Interfaces: ${results.newPackages.interfaces.vulnerabilities.length}</li>
          <li>Journey Context: ${results.newPackages['journey-context'].vulnerabilities.length}</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="tab">
    <button class="tablinks" onclick="openTab(event, 'AllVulnerabilities')" id="defaultOpen">All Vulnerabilities</button>
    <button class="tablinks" onclick="openTab(event, 'JourneyVulnerabilities')">By Journey</button>
    <button class="tablinks" onclick="openTab(event, 'NewPackages')">New Packages</button>
    <button class="tablinks" onclick="openTab(event, 'VersionMismatches')">Version Mismatches</button>
    <button class="tablinks" onclick="openTab(event, 'Remediations')">Remediations</button>
  </div>
  
  <div id="AllVulnerabilities" class="tabcontent">
    <h2>All Vulnerabilities</h2>
    ${generateVulnerabilityTable(results.vulnerabilities)}
  </div>
  
  <div id="JourneyVulnerabilities" class="tabcontent">
    <h2>Vulnerabilities by Journey</h2>
    
    <h3>Health Journey</h3>
    ${results.journeys.health.vulnerabilities.length > 0 
      ? generateVulnerabilityTable(results.journeys.health.vulnerabilities)
      : '<p>No vulnerabilities found.</p>'}
    
    <h3>Care Journey</h3>
    ${results.journeys.care.vulnerabilities.length > 0 
      ? generateVulnerabilityTable(results.journeys.care.vulnerabilities)
      : '<p>No vulnerabilities found.</p>'}
    
    <h3>Plan Journey</h3>
    ${results.journeys.plan.vulnerabilities.length > 0 
      ? generateVulnerabilityTable(results.journeys.plan.vulnerabilities)
      : '<p>No vulnerabilities found.</p>'}
  </div>
  
  <div id="NewPackages" class="tabcontent">
    <h2>Vulnerabilities in New Packages</h2>
    
    <h3>Design System</h3>
    ${results.newPackages['design-system'].vulnerabilities.length > 0 
      ? generateVulnerabilityTable(results.newPackages['design-system'].vulnerabilities)
      : '<p>No vulnerabilities found.</p>'}
    
    <h3>Primitives</h3>
    ${results.newPackages.primitives.vulnerabilities.length > 0 
      ? generateVulnerabilityTable(results.newPackages.primitives.vulnerabilities)
      : '<p>No vulnerabilities found.</p>'}
    
    <h3>Interfaces</h3>
    ${results.newPackages.interfaces.vulnerabilities.length > 0 
      ? generateVulnerabilityTable(results.newPackages.interfaces.vulnerabilities)
      : '<p>No vulnerabilities found.</p>'}
    
    <h3>Journey Context</h3>
    ${results.newPackages['journey-context'].vulnerabilities.length > 0 
      ? generateVulnerabilityTable(results.newPackages['journey-context'].vulnerabilities)
      : '<p>No vulnerabilities found.</p>'}
  </div>
  
  <div id="VersionMismatches" class="tabcontent">
    <h2>Version Mismatches with Technical Specification</h2>
    ${generateVersionMismatchTable(results.versionMismatches)}
  </div>
  
  <div id="Remediations" class="tabcontent">
    <h2>Remediation Recommendations</h2>
    <ul>
      ${Object.entries(results.remediations).map(([pkg, recommendation]) => 
        `<li><strong>${pkg}</strong>: ${recommendation}</li>`
      ).join('')}
    </ul>
  </div>
  
  <script>
    function openTab(evt, tabName) {
      var i, tabcontent, tablinks;
      tabcontent = document.getElementsByClassName("tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
      document.getElementById(tabName).style.display = "block";
      evt.currentTarget.className += " active";
    }
    
    // Get the element with id="defaultOpen" and click on it
    document.getElementById("defaultOpen").click();
  </script>
</body>
</html>
  `;
  
  // Write HTML report to file
  fs.writeFileSync(reportPath, html);
  console.log(`HTML report generated: ${reportPath}`);
  
  return reportPath;
}

// Generate vulnerability table HTML
function generateVulnerabilityTable(vulnerabilities) {
  if (vulnerabilities.length === 0) {
    return '<p>No vulnerabilities found.</p>';
  }
  
  return `
    <table class="vulnerability-table">
      <thead>
        <tr>
          <th>Package</th>
          <th>Severity</th>
          <th>Title</th>
          <th>Category</th>
          <th>Affected</th>
        </tr>
      </thead>
      <tbody>
        ${vulnerabilities.map(vuln => `
          <tr>
            <td>${vuln.module_name} ${vuln.isStandardizedVersion ? '<span class="package-badge standardized">Standardized</span>' : ''}</td>
            <td><span class="severity-${vuln.severity}">${vuln.severity}</span></td>
            <td>
              <a href="${vuln.url || '#'}" target="_blank">${vuln.title}</a>
              <div>${vuln.overview ? vuln.overview.substring(0, 100) + '...' : ''}</div>
            </td>
            <td>${CONFIG.vulnerabilityCategories[vuln.category] || vuln.category}</td>
            <td>
              ${vuln.affectedJourneys.map(journey => 
                `<span class="journey-badge">${journey}</span>`
              ).join('')}
              ${vuln.affectedNewPackages.map(pkg => 
                `<span class="package-badge">${pkg}</span>`
              ).join('')}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Generate version mismatch table HTML
function generateVersionMismatchTable(mismatches) {
  if (mismatches.length === 0) {
    return '<p>No version mismatches found.</p>';
  }
  
  return `
    <table class="vulnerability-table">
      <thead>
        <tr>
          <th>Package</th>
          <th>Current Version</th>
          <th>Required Version</th>
          <th>Severity</th>
        </tr>
      </thead>
      <tbody>
        ${mismatches.map(mismatch => `
          <tr>
            <td>${mismatch.packageName}</td>
            <td>${mismatch.currentVersion}</td>
            <td>${mismatch.standardizedVersion}</td>
            <td><span class="severity-${mismatch.severity}">${mismatch.severity}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Generate JSON report
function generateJsonReport(results) {
  console.log('Generating JSON report...');
  
  const reportPath = path.join(CONFIG.outputDir, `security-report-${Date.now()}.json`);
  
  // Write JSON report to file
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`JSON report generated: ${reportPath}`);
  
  return reportPath;
}

// Main function
async function main() {
  try {
    // Parse command line arguments
    parseArgs();
    
    // Ensure output directory exists
    ensureOutputDir();
    
    // Get workspace information
    const workspaces = getWorkspaces();
    
    // Run security audit
    const auditResults = runSecurityAudit();
    
    // Process audit results
    const processedResults = processAuditResults(auditResults, workspaces);
    
    // Generate reports
    const htmlReportPath = generateHtmlReport(processedResults);
    const jsonReportPath = generateJsonReport(processedResults);
    
    console.log('\nSecurity report generation completed successfully!');
    console.log(`HTML Report: ${htmlReportPath}`);
    console.log(`JSON Report: ${jsonReportPath}`);
    console.log(`\nSummary: ${processedResults.summary.total} vulnerabilities found.`);
    
    // Exit with appropriate code based on vulnerabilities
    if (processedResults.summary.total > 0) {
      const criticalCount = processedResults.summary.bySeverity.critical || 0;
      const highCount = processedResults.summary.bySeverity.high || 0;
      
      if (criticalCount > 0 || highCount > 0) {
        console.error(`\nCritical/High severity vulnerabilities found: ${criticalCount + highCount}`);
        process.exit(1);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating security report:', error);
    process.exit(1);
  }
}

// Run the main function
main();