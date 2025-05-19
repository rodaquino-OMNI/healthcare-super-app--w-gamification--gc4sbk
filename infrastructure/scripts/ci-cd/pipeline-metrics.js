#!/usr/bin/env node

/**
 * @fileoverview CI/CD Pipeline Metrics Collection and Analysis
 * 
 * This script collects, analyzes, and reports on CI/CD pipeline performance metrics
 * including build times, success rates, and resource usage to enable continuous
 * optimization of the CI/CD process.
 * 
 * Features:
 * - Collects comprehensive metrics from GitHub Actions workflows
 * - Analyzes historical trends to identify performance regressions
 * - Exports metrics to Prometheus and CloudWatch
 * - Generates actionable optimization recommendations
 * - Supports monorepo-specific metrics for workspace-aware builds
 * 
 * Usage:
 * - As a standalone metrics collector: node pipeline-metrics.js collect
 * - As a build analyzer: node pipeline-metrics.js analyze --workflow=<workflow-id>
 * - As a report generator: node pipeline-metrics.js report --days=30
 * - As a Prometheus exporter: node pipeline-metrics.js export --port=9090
 * 
 * @requires aws-sdk - For CloudWatch metrics integration
 * @requires prom-client - For Prometheus metrics export
 * @requires node-fetch - For GitHub API requests
 * @requires fs-extra - For file system operations
 */

'use strict';

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');
const { program } = require('commander');
const AWS = require('aws-sdk');
const promClient = require('prom-client');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'pipeline-metrics' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    }),
    new winston.transports.File({ filename: 'pipeline-metrics.log' })
  ],
});

// Constants
const METRICS_DIR = process.env.METRICS_DIR || path.join(process.cwd(), 'metrics');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'austa/superapp';
const GITHUB_API_URL = 'https://api.github.com';
const CLOUDWATCH_NAMESPACE = 'AUSTA/CI-CD-Pipeline';
const DEFAULT_PORT = 9090;
const WORKSPACES = [
  'src/backend',
  'src/web',
  'src/web/design-system',
  'src/web/primitives',
  'src/web/interfaces',
  'src/web/journey-context',
  'src/web/mobile',
  'src/web/web'
];

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const buildDurationHistogram = new promClient.Histogram({
  name: 'cicd_build_duration_seconds',
  help: 'Build duration in seconds',
  labelNames: ['workflow', 'workspace', 'branch'],
  buckets: [60, 180, 300, 600, 900, 1800, 3600],
  registers: [register]
});

const buildSuccessCounter = new promClient.Counter({
  name: 'cicd_build_success_total',
  help: 'Total number of successful builds',
  labelNames: ['workflow', 'workspace', 'branch'],
  registers: [register]
});

const buildFailureCounter = new promClient.Counter({
  name: 'cicd_build_failure_total',
  help: 'Total number of failed builds',
  labelNames: ['workflow', 'workspace', 'branch'],
  registers: [register]
});

const dependencyValidationErrorsCounter = new promClient.Counter({
  name: 'cicd_dependency_validation_errors_total',
  help: 'Total number of dependency validation errors',
  labelNames: ['workspace', 'error_type'],
  registers: [register]
});

const cacheHitRatioGauge = new promClient.Gauge({
  name: 'cicd_cache_hit_ratio',
  help: 'Cache hit ratio for builds',
  labelNames: ['workflow', 'workspace', 'cache_type'],
  registers: [register]
});

const buildResourceUsageGauge = new promClient.Gauge({
  name: 'cicd_build_resource_usage',
  help: 'Resource usage during builds',
  labelNames: ['workflow', 'workspace', 'resource_type'],
  registers: [register]
});

/**
 * Initialize the metrics directory
 */
function initMetricsDir() {
  try {
    fs.ensureDirSync(METRICS_DIR);
    logger.info(`Metrics directory initialized at ${METRICS_DIR}`);
  } catch (error) {
    logger.error(`Failed to initialize metrics directory: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Fetch workflow runs from GitHub API
 * @param {string} workflow - Workflow name or ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Array of workflow runs
 */
async function fetchWorkflowRuns(workflow, days = 7) {
  if (!GITHUB_TOKEN) {
    logger.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/actions/workflows/${workflow}/runs?created=>${since.toISOString()}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info(`Fetched ${data.workflow_runs.length} workflow runs for ${workflow}`);
    return data.workflow_runs;
  } catch (error) {
    logger.error(`Failed to fetch workflow runs: ${error.message}`);
    return [];
  }
}

/**
 * Fetch job details for a workflow run
 * @param {string} runId - Workflow run ID
 * @returns {Promise<Array>} - Array of jobs
 */
async function fetchJobsForRun(runId) {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/actions/runs/${runId}/jobs`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.jobs;
  } catch (error) {
    logger.error(`Failed to fetch jobs for run ${runId}: ${error.message}`);
    return [];
  }
}

/**
 * Parse build logs to extract metrics
 * @param {string} logUrl - URL to the build log
 * @returns {Promise<Object>} - Extracted metrics
 */
async function parseBuildLogs(logUrl) {
  try {
    const response = await fetch(logUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }

    const logText = await response.text();
    
    // Extract metrics from logs
    const metrics = {
      dependencyErrors: extractDependencyErrors(logText),
      cacheInfo: extractCacheInfo(logText),
      resourceUsage: extractResourceUsage(logText),
      buildSteps: extractBuildStepTiming(logText)
    };

    return metrics;
  } catch (error) {
    logger.error(`Failed to parse build logs: ${error.message}`);
    return {
      dependencyErrors: [],
      cacheInfo: { hits: 0, misses: 0 },
      resourceUsage: { cpu: 0, memory: 0 },
      buildSteps: []
    };
  }
}

/**
 * Extract dependency validation errors from log text
 * @param {string} logText - Build log text
 * @returns {Array<Object>} - Array of dependency errors
 */
function extractDependencyErrors(logText) {
  const errors = [];
  
  // Extract npm ls errors
  const npmLsErrorRegex = /npm ERR! ([^\n]+)/g;
  let match;
  while ((match = npmLsErrorRegex.exec(logText)) !== null) {
    errors.push({
      type: 'npm_ls',
      message: match[1].trim()
    });
  }
  
  // Extract TypeScript errors
  const tsErrorRegex = /error TS\d+: ([^\n]+)/g;
  while ((match = tsErrorRegex.exec(logText)) !== null) {
    errors.push({
      type: 'typescript',
      message: match[1].trim()
    });
  }
  
  // Extract circular dependency errors
  const circularDepRegex = /Circular dependency detected: ([^\n]+)/g;
  while ((match = circularDepRegex.exec(logText)) !== null) {
    errors.push({
      type: 'circular_dependency',
      message: match[1].trim()
    });
  }
  
  return errors;
}

/**
 * Extract cache information from log text
 * @param {string} logText - Build log text
 * @returns {Object} - Cache hit/miss information
 */
function extractCacheInfo(logText) {
  const cacheInfo = {
    hits: 0,
    misses: 0,
    types: {}
  };
  
  // Extract cache hits
  const cacheHitRegex = /Cache hit occurred on key ([^\n]+)/g;
  let match;
  while ((match = cacheHitRegex.exec(logText)) !== null) {
    cacheInfo.hits++;
    const cacheKey = match[1].trim();
    const cacheType = determineCacheType(cacheKey);
    
    if (!cacheInfo.types[cacheType]) {
      cacheInfo.types[cacheType] = { hits: 0, misses: 0 };
    }
    cacheInfo.types[cacheType].hits++;
  }
  
  // Extract cache misses
  const cacheMissRegex = /Cache miss occurred on key ([^\n]+)/g;
  while ((match = cacheMissRegex.exec(logText)) !== null) {
    cacheInfo.misses++;
    const cacheKey = match[1].trim();
    const cacheType = determineCacheType(cacheKey);
    
    if (!cacheInfo.types[cacheType]) {
      cacheInfo.types[cacheType] = { hits: 0, misses: 0 };
    }
    cacheInfo.types[cacheType].misses++;
  }
  
  return cacheInfo;
}

/**
 * Determine cache type from cache key
 * @param {string} cacheKey - Cache key
 * @returns {string} - Cache type
 */
function determineCacheType(cacheKey) {
  if (cacheKey.includes('node_modules')) {
    return 'dependencies';
  } else if (cacheKey.includes('buildx')) {
    return 'docker_layers';
  } else if (cacheKey.includes('typescript') || cacheKey.includes('tsc')) {
    return 'typescript';
  } else if (cacheKey.includes('test-results')) {
    return 'test_results';
  } else {
    return 'other';
  }
}

/**
 * Extract resource usage information from log text
 * @param {string} logText - Build log text
 * @returns {Object} - Resource usage information
 */
function extractResourceUsage(logText) {
  const resourceUsage = {
    cpu: 0,
    memory: 0,
    disk: 0
  };
  
  // Extract CPU usage
  const cpuRegex = /CPU usage: ([\d.]+)%/;
  const cpuMatch = logText.match(cpuRegex);
  if (cpuMatch) {
    resourceUsage.cpu = parseFloat(cpuMatch[1]);
  }
  
  // Extract memory usage
  const memoryRegex = /Memory usage: ([\d.]+) MB/;
  const memoryMatch = logText.match(memoryRegex);
  if (memoryMatch) {
    resourceUsage.memory = parseFloat(memoryMatch[1]);
  }
  
  // Extract disk usage
  const diskRegex = /Disk usage: ([\d.]+) GB/;
  const diskMatch = logText.match(diskRegex);
  if (diskMatch) {
    resourceUsage.disk = parseFloat(diskMatch[1]);
  }
  
  return resourceUsage;
}

/**
 * Extract build step timing information from log text
 * @param {string} logText - Build log text
 * @returns {Array<Object>} - Array of build step timing information
 */
function extractBuildStepTiming(logText) {
  const buildSteps = [];
  
  // Match step start and end times
  const stepRegex = /##\[group\](.+?)\n[\s\S]+?Duration: (\d+)s/g;
  let match;
  while ((match = stepRegex.exec(logText)) !== null) {
    const stepName = match[1].trim();
    const duration = parseInt(match[2], 10);
    
    buildSteps.push({
      name: stepName,
      duration: duration
    });
  }
  
  return buildSteps;
}

/**
 * Calculate metrics for a workflow run
 * @param {Object} run - Workflow run object
 * @param {Array} jobs - Jobs for the workflow run
 * @returns {Promise<Object>} - Calculated metrics
 */
async function calculateRunMetrics(run, jobs) {
  const metrics = {
    id: run.id,
    workflow: run.workflow_id,
    workflowName: run.name,
    branch: run.head_branch,
    status: run.conclusion,
    startTime: new Date(run.created_at),
    endTime: new Date(run.updated_at),
    duration: (new Date(run.updated_at) - new Date(run.created_at)) / 1000,
    jobs: [],
    workspaceMetrics: {},
    dependencyErrors: [],
    cacheHitRatio: 0,
    resourceUsage: {
      cpu: 0,
      memory: 0,
      disk: 0
    }
  };
  
  // Process each job
  for (const job of jobs) {
    const jobMetrics = {
      id: job.id,
      name: job.name,
      status: job.conclusion,
      startTime: new Date(job.started_at),
      endTime: new Date(job.completed_at),
      duration: job.completed_at ? (new Date(job.completed_at) - new Date(job.started_at)) / 1000 : 0,
      workspace: determineWorkspace(job.name),
      logUrl: job.logs_url
    };
    
    // Parse build logs for additional metrics
    if (job.logs_url) {
      const logMetrics = await parseBuildLogs(job.logs_url);
      jobMetrics.dependencyErrors = logMetrics.dependencyErrors;
      jobMetrics.cacheInfo = logMetrics.cacheInfo;
      jobMetrics.resourceUsage = logMetrics.resourceUsage;
      jobMetrics.buildSteps = logMetrics.buildSteps;
      
      // Add to overall metrics
      metrics.dependencyErrors = metrics.dependencyErrors.concat(logMetrics.dependencyErrors);
      
      // Update resource usage (take max values)
      metrics.resourceUsage.cpu = Math.max(metrics.resourceUsage.cpu, logMetrics.resourceUsage.cpu);
      metrics.resourceUsage.memory = Math.max(metrics.resourceUsage.memory, logMetrics.resourceUsage.memory);
      metrics.resourceUsage.disk = Math.max(metrics.resourceUsage.disk, logMetrics.resourceUsage.disk);
    }
    
    metrics.jobs.push(jobMetrics);
    
    // Aggregate metrics by workspace
    if (jobMetrics.workspace) {
      if (!metrics.workspaceMetrics[jobMetrics.workspace]) {
        metrics.workspaceMetrics[jobMetrics.workspace] = {
          duration: 0,
          status: 'success',
          dependencyErrors: [],
          cacheHits: 0,
          cacheMisses: 0
        };
      }
      
      metrics.workspaceMetrics[jobMetrics.workspace].duration += jobMetrics.duration;
      
      if (jobMetrics.status === 'failure') {
        metrics.workspaceMetrics[jobMetrics.workspace].status = 'failure';
      }
      
      if (jobMetrics.dependencyErrors) {
        metrics.workspaceMetrics[jobMetrics.workspace].dependencyErrors = 
          metrics.workspaceMetrics[jobMetrics.workspace].dependencyErrors.concat(jobMetrics.dependencyErrors);
      }
      
      if (jobMetrics.cacheInfo) {
        metrics.workspaceMetrics[jobMetrics.workspace].cacheHits += jobMetrics.cacheInfo.hits;
        metrics.workspaceMetrics[jobMetrics.workspace].cacheMisses += jobMetrics.cacheInfo.misses;
      }
    }
  }
  
  // Calculate overall cache hit ratio
  let totalHits = 0;
  let totalMisses = 0;
  
  Object.values(metrics.workspaceMetrics).forEach(workspace => {
    totalHits += workspace.cacheHits;
    totalMisses += workspace.cacheMisses;
  });
  
  metrics.cacheHitRatio = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;
  
  return metrics;
}

/**
 * Determine workspace from job name
 * @param {string} jobName - Job name
 * @returns {string|null} - Workspace name or null if not found
 */
function determineWorkspace(jobName) {
  for (const workspace of WORKSPACES) {
    if (jobName.includes(workspace) || 
        jobName.includes(workspace.replace('src/', '')) || 
        jobName.includes(workspace.split('/').pop())) {
      return workspace;
    }
  }
  
  // Special cases
  if (jobName.includes('backend')) return 'src/backend';
  if (jobName.includes('web-app')) return 'src/web/web';
  if (jobName.includes('mobile-app')) return 'src/web/mobile';
  if (jobName.includes('design-system')) return 'src/web/design-system';
  if (jobName.includes('primitives')) return 'src/web/primitives';
  if (jobName.includes('interfaces')) return 'src/web/interfaces';
  if (jobName.includes('journey')) return 'src/web/journey-context';
  
  return null;
}

/**
 * Save metrics to file
 * @param {string} runId - Workflow run ID
 * @param {Object} metrics - Metrics object
 */
function saveMetricsToFile(runId, metrics) {
  try {
    const filePath = path.join(METRICS_DIR, `${runId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2));
    logger.info(`Metrics saved to ${filePath}`);
  } catch (error) {
    logger.error(`Failed to save metrics to file: ${error.message}`);
  }
}

/**
 * Load metrics from file
 * @param {string} runId - Workflow run ID
 * @returns {Object|null} - Metrics object or null if not found
 */
function loadMetricsFromFile(runId) {
  try {
    const filePath = path.join(METRICS_DIR, `${runId}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  } catch (error) {
    logger.error(`Failed to load metrics from file: ${error.message}`);
    return null;
  }
}

/**
 * Export metrics to Prometheus
 * @param {Object} metrics - Metrics object
 */
function exportToPrometheus(metrics) {
  // Reset metrics to avoid duplication
  buildDurationHistogram.reset();
  buildSuccessCounter.reset();
  buildFailureCounter.reset();
  dependencyValidationErrorsCounter.reset();
  cacheHitRatioGauge.reset();
  buildResourceUsageGauge.reset();
  
  // Record workflow-level metrics
  if (metrics.status === 'success') {
    buildSuccessCounter.inc({ workflow: metrics.workflowName, branch: metrics.branch });
  } else if (metrics.status === 'failure') {
    buildFailureCounter.inc({ workflow: metrics.workflowName, branch: metrics.branch });
  }
  
  buildDurationHistogram.observe({ workflow: metrics.workflowName, branch: metrics.branch }, metrics.duration);
  
  // Record workspace-level metrics
  Object.entries(metrics.workspaceMetrics).forEach(([workspace, workspaceMetrics]) => {
    if (workspaceMetrics.status === 'success') {
      buildSuccessCounter.inc({ workflow: metrics.workflowName, workspace, branch: metrics.branch });
    } else if (workspaceMetrics.status === 'failure') {
      buildFailureCounter.inc({ workflow: metrics.workflowName, workspace, branch: metrics.branch });
    }
    
    buildDurationHistogram.observe(
      { workflow: metrics.workflowName, workspace, branch: metrics.branch },
      workspaceMetrics.duration
    );
    
    // Record dependency errors
    workspaceMetrics.dependencyErrors.forEach(error => {
      dependencyValidationErrorsCounter.inc({ workspace, error_type: error.type });
    });
    
    // Record cache hit ratio
    const totalCacheAttempts = workspaceMetrics.cacheHits + workspaceMetrics.cacheMisses;
    if (totalCacheAttempts > 0) {
      const hitRatio = workspaceMetrics.cacheHits / totalCacheAttempts;
      cacheHitRatioGauge.set(
        { workflow: metrics.workflowName, workspace, cache_type: 'all' },
        hitRatio
      );
    }
  });
  
  // Record resource usage
  buildResourceUsageGauge.set(
    { workflow: metrics.workflowName, resource_type: 'cpu' },
    metrics.resourceUsage.cpu
  );
  
  buildResourceUsageGauge.set(
    { workflow: metrics.workflowName, resource_type: 'memory' },
    metrics.resourceUsage.memory
  );
  
  buildResourceUsageGauge.set(
    { workflow: metrics.workflowName, resource_type: 'disk' },
    metrics.resourceUsage.disk
  );
}

/**
 * Export metrics to CloudWatch
 * @param {Object} metrics - Metrics object
 */
async function exportToCloudWatch(metrics) {
  const cloudwatch = new AWS.CloudWatch();
  const timestamp = new Date();
  
  const metricData = [
    {
      MetricName: 'BuildDuration',
      Dimensions: [
        { Name: 'Workflow', Value: metrics.workflowName },
        { Name: 'Branch', Value: metrics.branch }
      ],
      Value: metrics.duration,
      Unit: 'Seconds',
      Timestamp: timestamp
    },
    {
      MetricName: 'BuildStatus',
      Dimensions: [
        { Name: 'Workflow', Value: metrics.workflowName },
        { Name: 'Branch', Value: metrics.branch }
      ],
      Value: metrics.status === 'success' ? 1 : 0,
      Unit: 'Count',
      Timestamp: timestamp
    },
    {
      MetricName: 'CacheHitRatio',
      Dimensions: [
        { Name: 'Workflow', Value: metrics.workflowName }
      ],
      Value: metrics.cacheHitRatio,
      Unit: 'None',
      Timestamp: timestamp
    },
    {
      MetricName: 'DependencyErrors',
      Dimensions: [
        { Name: 'Workflow', Value: metrics.workflowName }
      ],
      Value: metrics.dependencyErrors.length,
      Unit: 'Count',
      Timestamp: timestamp
    }
  ];
  
  // Add workspace-specific metrics
  Object.entries(metrics.workspaceMetrics).forEach(([workspace, workspaceMetrics]) => {
    metricData.push({
      MetricName: 'WorkspaceBuildDuration',
      Dimensions: [
        { Name: 'Workflow', Value: metrics.workflowName },
        { Name: 'Workspace', Value: workspace },
        { Name: 'Branch', Value: metrics.branch }
      ],
      Value: workspaceMetrics.duration,
      Unit: 'Seconds',
      Timestamp: timestamp
    });
    
    metricData.push({
      MetricName: 'WorkspaceBuildStatus',
      Dimensions: [
        { Name: 'Workflow', Value: metrics.workflowName },
        { Name: 'Workspace', Value: workspace },
        { Name: 'Branch', Value: metrics.branch }
      ],
      Value: workspaceMetrics.status === 'success' ? 1 : 0,
      Unit: 'Count',
      Timestamp: timestamp
    });
    
    metricData.push({
      MetricName: 'WorkspaceDependencyErrors',
      Dimensions: [
        { Name: 'Workflow', Value: metrics.workflowName },
        { Name: 'Workspace', Value: workspace }
      ],
      Value: workspaceMetrics.dependencyErrors.length,
      Unit: 'Count',
      Timestamp: timestamp
    });
  });
  
  // Split into chunks of 20 (CloudWatch API limit)
  const chunkSize = 20;
  for (let i = 0; i < metricData.length; i += chunkSize) {
    const chunk = metricData.slice(i, i + chunkSize);
    
    try {
      await cloudwatch.putMetricData({
        Namespace: CLOUDWATCH_NAMESPACE,
        MetricData: chunk
      }).promise();
      
      logger.info(`Exported ${chunk.length} metrics to CloudWatch`);
    } catch (error) {
      logger.error(`Failed to export metrics to CloudWatch: ${error.message}`);
    }
  }
}

/**
 * Analyze metrics to identify trends and issues
 * @param {Array<Object>} metricsArray - Array of metrics objects
 * @returns {Object} - Analysis results
 */
function analyzeMetrics(metricsArray) {
  if (!metricsArray || metricsArray.length === 0) {
    return {
      trends: {},
      issues: [],
      recommendations: []
    };
  }
  
  // Sort by start time
  metricsArray.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  
  const analysis = {
    trends: {
      buildDuration: calculateTrend(metricsArray.map(m => m.duration)),
      successRate: calculateSuccessRate(metricsArray),
      cacheHitRatio: calculateTrend(metricsArray.map(m => m.cacheHitRatio)),
      workspaces: {}
    },
    issues: [],
    recommendations: []
  };
  
  // Calculate workspace-specific trends
  const workspaces = new Set();
  metricsArray.forEach(metrics => {
    Object.keys(metrics.workspaceMetrics).forEach(workspace => workspaces.add(workspace));
  });
  
  workspaces.forEach(workspace => {
    const workspaceMetrics = metricsArray
      .filter(m => m.workspaceMetrics[workspace])
      .map(m => ({
        duration: m.workspaceMetrics[workspace].duration,
        status: m.workspaceMetrics[workspace].status,
        dependencyErrors: m.workspaceMetrics[workspace].dependencyErrors.length,
        cacheHitRatio: m.workspaceMetrics[workspace].cacheHits / 
          (m.workspaceMetrics[workspace].cacheHits + m.workspaceMetrics[workspace].cacheMisses || 1)
      }));
    
    if (workspaceMetrics.length > 0) {
      analysis.trends.workspaces[workspace] = {
        buildDuration: calculateTrend(workspaceMetrics.map(m => m.duration)),
        successRate: calculateSuccessRate(workspaceMetrics),
        dependencyErrors: calculateTrend(workspaceMetrics.map(m => m.dependencyErrors)),
        cacheHitRatio: calculateTrend(workspaceMetrics.map(m => m.cacheHitRatio))
      };
    }
  });
  
  // Identify issues
  analysis.issues = identifyIssues(metricsArray, analysis.trends);
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis.issues, analysis.trends);
  
  return analysis;
}

/**
 * Calculate trend from array of values
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} - Trend information
 */
function calculateTrend(values) {
  if (!values || values.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      trend: 'stable'
    };
  }
  
  // Calculate basic statistics
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  
  // Calculate standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Determine trend
  let trend = 'stable';
  if (values.length >= 3) {
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstHalfMean = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondHalfMean = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const percentChange = (secondHalfMean - firstHalfMean) / firstHalfMean * 100;
    
    if (percentChange > 10) {
      trend = 'increasing';
    } else if (percentChange < -10) {
      trend = 'decreasing';
    }
  }
  
  return {
    mean,
    median,
    min,
    max,
    stdDev,
    trend
  };
}

/**
 * Calculate success rate from array of metrics
 * @param {Array<Object>} metricsArray - Array of metrics objects
 * @returns {Object} - Success rate information
 */
function calculateSuccessRate(metricsArray) {
  if (!metricsArray || metricsArray.length === 0) {
    return {
      rate: 0,
      trend: 'stable'
    };
  }
  
  const successCount = metricsArray.filter(m => m.status === 'success').length;
  const rate = successCount / metricsArray.length;
  
  // Determine trend
  let trend = 'stable';
  if (metricsArray.length >= 3) {
    const firstHalf = metricsArray.slice(0, Math.floor(metricsArray.length / 2));
    const secondHalf = metricsArray.slice(Math.floor(metricsArray.length / 2));
    
    const firstHalfRate = firstHalf.filter(m => m.status === 'success').length / firstHalf.length;
    const secondHalfRate = secondHalf.filter(m => m.status === 'success').length / secondHalf.length;
    
    const percentChange = (secondHalfRate - firstHalfRate) / firstHalfRate * 100;
    
    if (percentChange > 5) {
      trend = 'improving';
    } else if (percentChange < -5) {
      trend = 'degrading';
    }
  }
  
  return {
    rate,
    trend
  };
}

/**
 * Identify issues from metrics and trends
 * @param {Array<Object>} metricsArray - Array of metrics objects
 * @param {Object} trends - Trend analysis
 * @returns {Array<Object>} - Array of identified issues
 */
function identifyIssues(metricsArray, trends) {
  const issues = [];
  
  // Check overall build duration
  if (trends.buildDuration.trend === 'increasing') {
    issues.push({
      type: 'build_duration',
      severity: 'warning',
      message: 'Build duration is increasing over time',
      details: `Average build duration increased from ${trends.buildDuration.min.toFixed(1)}s to ${trends.buildDuration.max.toFixed(1)}s`
    });
  }
  
  // Check success rate
  if (trends.successRate.trend === 'degrading') {
    issues.push({
      type: 'success_rate',
      severity: 'critical',
      message: 'Build success rate is decreasing',
      details: `Current success rate is ${(trends.successRate.rate * 100).toFixed(1)}%`
    });
  } else if (trends.successRate.rate < 0.9) {
    issues.push({
      type: 'success_rate',
      severity: 'warning',
      message: 'Build success rate is below 90%',
      details: `Current success rate is ${(trends.successRate.rate * 100).toFixed(1)}%`
    });
  }
  
  // Check cache hit ratio
  if (trends.cacheHitRatio.trend === 'decreasing') {
    issues.push({
      type: 'cache_hit_ratio',
      severity: 'warning',
      message: 'Cache hit ratio is decreasing',
      details: `Current cache hit ratio is ${(trends.cacheHitRatio.mean * 100).toFixed(1)}%`
    });
  } else if (trends.cacheHitRatio.mean < 0.7) {
    issues.push({
      type: 'cache_hit_ratio',
      severity: 'info',
      message: 'Cache hit ratio is below 70%',
      details: `Current cache hit ratio is ${(trends.cacheHitRatio.mean * 100).toFixed(1)}%`
    });
  }
  
  // Check workspace-specific issues
  Object.entries(trends.workspaces).forEach(([workspace, workspaceTrends]) => {
    // Check workspace build duration
    if (workspaceTrends.buildDuration.trend === 'increasing') {
      issues.push({
        type: 'workspace_build_duration',
        severity: 'warning',
        workspace,
        message: `Build duration for ${workspace} is increasing`,
        details: `Average build duration increased from ${workspaceTrends.buildDuration.min.toFixed(1)}s to ${workspaceTrends.buildDuration.max.toFixed(1)}s`
      });
    }
    
    // Check workspace success rate
    if (workspaceTrends.successRate.trend === 'degrading') {
      issues.push({
        type: 'workspace_success_rate',
        severity: 'critical',
        workspace,
        message: `Build success rate for ${workspace} is decreasing`,
        details: `Current success rate is ${(workspaceTrends.successRate.rate * 100).toFixed(1)}%`
      });
    } else if (workspaceTrends.successRate.rate < 0.8) {
      issues.push({
        type: 'workspace_success_rate',
        severity: 'warning',
        workspace,
        message: `Build success rate for ${workspace} is below 80%`,
        details: `Current success rate is ${(workspaceTrends.successRate.rate * 100).toFixed(1)}%`
      });
    }
    
    // Check dependency errors
    if (workspaceTrends.dependencyErrors.trend === 'increasing') {
      issues.push({
        type: 'dependency_errors',
        severity: 'critical',
        workspace,
        message: `Dependency errors for ${workspace} are increasing`,
        details: `Average dependency errors increased from ${workspaceTrends.dependencyErrors.min.toFixed(1)} to ${workspaceTrends.dependencyErrors.max.toFixed(1)}`
      });
    } else if (workspaceTrends.dependencyErrors.mean > 0) {
      issues.push({
        type: 'dependency_errors',
        severity: 'warning',
        workspace,
        message: `Dependency errors detected in ${workspace}`,
        details: `Average of ${workspaceTrends.dependencyErrors.mean.toFixed(1)} dependency errors per build`
      });
    }
  });
  
  // Check for specific error patterns in the most recent build
  const latestBuild = metricsArray[metricsArray.length - 1];
  if (latestBuild) {
    // Check for circular dependencies
    const circularDeps = latestBuild.dependencyErrors.filter(e => e.type === 'circular_dependency');
    if (circularDeps.length > 0) {
      issues.push({
        type: 'circular_dependency',
        severity: 'critical',
        message: 'Circular dependencies detected',
        details: `${circularDeps.length} circular dependencies found in the latest build`
      });
    }
    
    // Check for TypeScript errors
    const tsErrors = latestBuild.dependencyErrors.filter(e => e.type === 'typescript');
    if (tsErrors.length > 0) {
      issues.push({
        type: 'typescript_errors',
        severity: 'critical',
        message: 'TypeScript errors detected',
        details: `${tsErrors.length} TypeScript errors found in the latest build`
      });
    }
  }
  
  return issues;
}

/**
 * Generate recommendations based on identified issues and trends
 * @param {Array<Object>} issues - Array of identified issues
 * @param {Object} trends - Trend analysis
 * @returns {Array<Object>} - Array of recommendations
 */
function generateRecommendations(issues, trends) {
  const recommendations = [];
  
  // Group issues by type
  const issuesByType = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) {
      acc[issue.type] = [];
    }
    acc[issue.type].push(issue);
    return acc;
  }, {});
  
  // Build duration recommendations
  if (issuesByType.build_duration || issuesByType.workspace_build_duration) {
    recommendations.push({
      type: 'build_duration',
      title: 'Optimize Build Duration',
      description: 'Build times are increasing and could be optimized.',
      actions: [
        'Review the build steps and identify the slowest components',
        'Optimize TypeScript compilation with incremental builds',
        'Improve Docker layer caching strategy',
        'Consider parallelizing more build steps',
        'Evaluate if all tests need to run on every build'
      ]
    });
    
    // Workspace-specific recommendations
    const workspaceIssues = issuesByType.workspace_build_duration || [];
    workspaceIssues.forEach(issue => {
      recommendations.push({
        type: 'workspace_build_duration',
        title: `Optimize ${issue.workspace} Build Duration`,
        description: `Build times for ${issue.workspace} are increasing significantly.`,
        actions: [
          `Review the build steps for ${issue.workspace}`,
          'Check for unnecessary dependencies that might slow down the build',
          'Implement more granular caching for this workspace',
          'Consider splitting the workspace into smaller, more manageable pieces'
        ]
      });
    });
  }
  
  // Success rate recommendations
  if (issuesByType.success_rate || issuesByType.workspace_success_rate) {
    recommendations.push({
      type: 'success_rate',
      title: 'Improve Build Stability',
      description: 'Build success rate is decreasing and needs attention.',
      actions: [
        'Review recent build failures and identify common patterns',
        'Add more comprehensive tests for problematic areas',
        'Implement stricter pre-commit hooks to catch issues earlier',
        'Consider implementing feature flags for risky changes'
      ]
    });
    
    // Workspace-specific recommendations
    const workspaceIssues = issuesByType.workspace_success_rate || [];
    workspaceIssues.forEach(issue => {
      recommendations.push({
        type: 'workspace_success_rate',
        title: `Improve ${issue.workspace} Build Stability`,
        description: `Build success rate for ${issue.workspace} is concerning.`,
        actions: [
          `Review recent failures in ${issue.workspace}`,
          'Add more unit tests for this workspace',
          'Consider implementing a pre-build validation step',
          'Review dependencies for potential conflicts'
        ]
      });
    });
  }
  
  // Cache hit ratio recommendations
  if (issuesByType.cache_hit_ratio) {
    recommendations.push({
      type: 'cache_hit_ratio',
      title: 'Optimize Cache Usage',
      description: 'Cache hit ratio is decreasing, which is affecting build performance.',
      actions: [
        'Review cache key generation to ensure proper invalidation',
        'Implement more granular caching strategies',
        'Ensure lockfiles are properly used for cache keys',
        'Consider using workspace-specific caching for better isolation'
      ]
    });
  }
  
  // Dependency error recommendations
  if (issuesByType.dependency_errors) {
    recommendations.push({
      type: 'dependency_errors',
      title: 'Resolve Dependency Issues',
      description: 'Dependency errors are affecting build stability.',
      actions: [
        'Run dependency validation locally to identify issues',
        'Review package.json files for inconsistent versions',
        'Check for missing peer dependencies',
        'Consider using stricter version pinning'
      ]
    });
  }
  
  // Circular dependency recommendations
  if (issuesByType.circular_dependency) {
    recommendations.push({
      type: 'circular_dependency',
      title: 'Resolve Circular Dependencies',
      description: 'Circular dependencies can cause build and runtime issues.',
      actions: [
        'Use a tool like madge to visualize dependency cycles',
        'Refactor code to break circular dependencies',
        'Consider introducing interface packages to separate implementations',
        'Review import patterns and module boundaries'
      ]
    });
  }
  
  // TypeScript error recommendations
  if (issuesByType.typescript_errors) {
    recommendations.push({
      type: 'typescript_errors',
      title: 'Fix TypeScript Errors',
      description: 'TypeScript errors are causing build failures.',
      actions: [
        'Run TypeScript compilation locally to identify issues',
        'Review tsconfig.json files for proper configuration',
        'Check for missing type definitions',
        'Consider using stricter TypeScript settings gradually'
      ]
    });
  }
  
  return recommendations;
}

/**
 * Generate a report from analysis results
 * @param {Object} analysis - Analysis results
 * @returns {string} - Formatted report
 */
function generateReport(analysis) {
  let report = '# CI/CD Pipeline Performance Report\n\n';
  
  // Overall metrics
  report += '## Overall Metrics\n\n';
  report += '| Metric | Value | Trend |\n';
  report += '|--------|-------|-------|\n';
  report += `| Build Duration | ${analysis.trends.buildDuration.mean.toFixed(1)}s | ${getTrendSymbol(analysis.trends.buildDuration.trend)} |\n`;
  report += `| Success Rate | ${(analysis.trends.successRate.rate * 100).toFixed(1)}% | ${getTrendSymbol(analysis.trends.successRate.trend, true)} |\n`;
  report += `| Cache Hit Ratio | ${(analysis.trends.cacheHitRatio.mean * 100).toFixed(1)}% | ${getTrendSymbol(analysis.trends.cacheHitRatio.trend, true)} |\n`;
  
  // Workspace metrics
  report += '\n## Workspace Metrics\n\n';
  report += '| Workspace | Build Duration | Success Rate | Dependency Errors |\n';
  report += '|-----------|----------------|--------------|-------------------|\n';
  
  Object.entries(analysis.trends.workspaces).forEach(([workspace, trends]) => {
    report += `| ${workspace} | ${trends.buildDuration.mean.toFixed(1)}s ${getTrendSymbol(trends.buildDuration.trend)} | ${(trends.successRate.rate * 100).toFixed(1)}% ${getTrendSymbol(trends.successRate.trend, true)} | ${trends.dependencyErrors.mean.toFixed(1)} ${getTrendSymbol(trends.dependencyErrors.trend, false)} |\n`;
  });
  
  // Issues
  if (analysis.issues.length > 0) {
    report += '\n## Identified Issues\n\n';
    
    // Group by severity
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
    const warningIssues = analysis.issues.filter(i => i.severity === 'warning');
    const infoIssues = analysis.issues.filter(i => i.severity === 'info');
    
    if (criticalIssues.length > 0) {
      report += '### Critical Issues\n\n';
      criticalIssues.forEach(issue => {
        report += `- **${issue.message}**\n  - ${issue.details}\n`;
      });
      report += '\n';
    }
    
    if (warningIssues.length > 0) {
      report += '### Warning Issues\n\n';
      warningIssues.forEach(issue => {
        report += `- **${issue.message}**\n  - ${issue.details}\n`;
      });
      report += '\n';
    }
    
    if (infoIssues.length > 0) {
      report += '### Informational Issues\n\n';
      infoIssues.forEach(issue => {
        report += `- **${issue.message}**\n  - ${issue.details}\n`;
      });
      report += '\n';
    }
  }
  
  // Recommendations
  if (analysis.recommendations.length > 0) {
    report += '\n## Recommendations\n\n';
    
    analysis.recommendations.forEach(recommendation => {
      report += `### ${recommendation.title}\n\n`;
      report += `${recommendation.description}\n\n`;
      report += 'Recommended actions:\n\n';
      recommendation.actions.forEach(action => {
        report += `- ${action}\n`;
      });
      report += '\n';
    });
  }
  
  return report;
}

/**
 * Get a symbol representing a trend
 * @param {string} trend - Trend direction
 * @param {boolean} inverted - Whether higher is better (inverted logic)
 * @returns {string} - Trend symbol
 */
function getTrendSymbol(trend, inverted = false) {
  if (trend === 'stable') return '→';
  
  if (inverted) {
    return trend === 'increasing' ? '↑ (better)' : '↓ (worse)';
  } else {
    return trend === 'increasing' ? '↑ (worse)' : '↓ (better)';
  }
}

/**
 * Start Prometheus metrics server
 * @param {number} port - Port to listen on
 */
function startPrometheusServer(port) {
  const http = require('http');
  
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  });
  
  server.listen(port, () => {
    logger.info(`Prometheus metrics server listening on port ${port}`);
  });
}

/**
 * Main function for collecting metrics
 * @param {Object} options - Command options
 */
async function collectMetrics(options) {
  initMetricsDir();
  
  const workflow = options.workflow || 'ci.yml';
  const days = parseInt(options.days, 10) || 7;
  
  logger.info(`Collecting metrics for workflow ${workflow} over the last ${days} days`);
  
  const runs = await fetchWorkflowRuns(workflow, days);
  
  for (const run of runs) {
    // Skip if metrics already exist
    const existingMetrics = loadMetricsFromFile(run.id);
    if (existingMetrics) {
      logger.info(`Metrics for run ${run.id} already exist, skipping`);
      continue;
    }
    
    logger.info(`Processing run ${run.id} (${run.name})`);
    
    const jobs = await fetchJobsForRun(run.id);
    const metrics = await calculateRunMetrics(run, jobs);
    
    saveMetricsToFile(run.id, metrics);
    
    // Export metrics to monitoring systems
    exportToPrometheus(metrics);
    
    if (options.cloudwatch) {
      await exportToCloudWatch(metrics);
    }
  }
  
  logger.info('Metrics collection complete');
}

/**
 * Main function for analyzing metrics
 * @param {Object} options - Command options
 */
async function analyzeMetricsCommand(options) {
  initMetricsDir();
  
  const workflow = options.workflow;
  const days = parseInt(options.days, 10) || 30;
  
  logger.info(`Analyzing metrics for workflow ${workflow} over the last ${days} days`);
  
  // Load metrics files
  const metricsFiles = fs.readdirSync(METRICS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(METRICS_DIR, file));
  
  logger.info(`Found ${metricsFiles.length} metrics files`);
  
  // Load and filter metrics
  const allMetrics = metricsFiles
    .map(file => {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (error) {
        logger.error(`Failed to parse metrics file ${file}: ${error.message}`);
        return null;
      }
    })
    .filter(metrics => metrics !== null);
  
  // Filter by workflow and date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filteredMetrics = allMetrics
    .filter(metrics => {
      if (workflow && metrics.workflowName !== workflow && metrics.workflow !== workflow) {
        return false;
      }
      
      const startTime = new Date(metrics.startTime);
      return startTime >= cutoffDate;
    });
  
  logger.info(`Analyzing ${filteredMetrics.length} metrics records`);
  
  if (filteredMetrics.length === 0) {
    logger.warn('No metrics found for the specified criteria');
    return;
  }
  
  // Perform analysis
  const analysis = analyzeMetrics(filteredMetrics);
  
  // Generate report
  const report = generateReport(analysis);
  
  if (options.output) {
    fs.writeFileSync(options.output, report);
    logger.info(`Report written to ${options.output}`);
  } else {
    console.log(report);
  }
  
  // Export analysis results
  if (options.json) {
    const jsonOutput = options.json === true ? 'analysis.json' : options.json;
    fs.writeFileSync(jsonOutput, JSON.stringify(analysis, null, 2));
    logger.info(`Analysis results written to ${jsonOutput}`);
  }
}

/**
 * Main function for exporting metrics to Prometheus
 * @param {Object} options - Command options
 */
function exportMetricsCommand(options) {
  initMetricsDir();
  
  const port = parseInt(options.port, 10) || DEFAULT_PORT;
  
  logger.info(`Starting Prometheus metrics server on port ${port}`);
  
  // Load the most recent metrics for each workflow
  const metricsFiles = fs.readdirSync(METRICS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(METRICS_DIR, file));
  
  logger.info(`Found ${metricsFiles.length} metrics files`);
  
  // Group by workflow and get the most recent for each
  const workflowMetrics = {};
  
  metricsFiles.forEach(file => {
    try {
      const metrics = JSON.parse(fs.readFileSync(file, 'utf8'));
      const workflow = metrics.workflowName || metrics.workflow;
      
      if (!workflowMetrics[workflow] || new Date(metrics.startTime) > new Date(workflowMetrics[workflow].startTime)) {
        workflowMetrics[workflow] = metrics;
      }
    } catch (error) {
      logger.error(`Failed to parse metrics file ${file}: ${error.message}`);
    }
  });
  
  // Export metrics to Prometheus
  Object.values(workflowMetrics).forEach(metrics => {
    exportToPrometheus(metrics);
  });
  
  // Start Prometheus server
  startPrometheusServer(port);
}

/**
 * Main function for generating reports
 * @param {Object} options - Command options
 */
async function reportCommand(options) {
  initMetricsDir();
  
  const days = parseInt(options.days, 10) || 30;
  
  logger.info(`Generating report for the last ${days} days`);
  
  // Load metrics files
  const metricsFiles = fs.readdirSync(METRICS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(METRICS_DIR, file));
  
  logger.info(`Found ${metricsFiles.length} metrics files`);
  
  // Load metrics
  const allMetrics = metricsFiles
    .map(file => {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (error) {
        logger.error(`Failed to parse metrics file ${file}: ${error.message}`);
        return null;
      }
    })
    .filter(metrics => metrics !== null);
  
  // Filter by date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filteredMetrics = allMetrics
    .filter(metrics => {
      const startTime = new Date(metrics.startTime);
      return startTime >= cutoffDate;
    });
  
  logger.info(`Analyzing ${filteredMetrics.length} metrics records`);
  
  if (filteredMetrics.length === 0) {
    logger.warn('No metrics found for the specified criteria');
    return;
  }
  
  // Group by workflow
  const workflowMetrics = {};
  
  filteredMetrics.forEach(metrics => {
    const workflow = metrics.workflowName || metrics.workflow;
    
    if (!workflowMetrics[workflow]) {
      workflowMetrics[workflow] = [];
    }
    
    workflowMetrics[workflow].push(metrics);
  });
  
  // Generate reports for each workflow
  for (const [workflow, metrics] of Object.entries(workflowMetrics)) {
    logger.info(`Generating report for workflow ${workflow}`);
    
    const analysis = analyzeMetrics(metrics);
    const report = generateReport(analysis);
    
    const outputFile = options.output ? 
      options.output.replace('.md', `-${workflow}.md`) : 
      `${workflow}-report.md`;
    
    fs.writeFileSync(outputFile, report);
    logger.info(`Report written to ${outputFile}`);
  }
  
  // Generate overall report
  if (Object.keys(workflowMetrics).length > 1) {
    logger.info('Generating overall report');
    
    const analysis = analyzeMetrics(filteredMetrics);
    const report = generateReport(analysis);
    
    const outputFile = options.output || 'ci-cd-report.md';
    
    fs.writeFileSync(outputFile, report);
    logger.info(`Overall report written to ${outputFile}`);
  }
}

// Command line interface
program
  .version('1.0.0')
  .description('CI/CD Pipeline Metrics Collection and Analysis');

program
  .command('collect')
  .description('Collect metrics from GitHub Actions workflows')
  .option('-w, --workflow <workflow>', 'Workflow name or ID')
  .option('-d, --days <days>', 'Number of days to look back', '7')
  .option('-c, --cloudwatch', 'Export metrics to CloudWatch')
  .action(collectMetrics);

program
  .command('analyze')
  .description('Analyze collected metrics')
  .option('-w, --workflow <workflow>', 'Filter by workflow name or ID')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .option('-o, --output <file>', 'Output file for report')
  .option('-j, --json [file]', 'Output analysis results as JSON')
  .action(analyzeMetricsCommand);

program
  .command('export')
  .description('Export metrics to Prometheus')
  .option('-p, --port <port>', 'Port to listen on', DEFAULT_PORT.toString())
  .action(exportMetricsCommand);

program
  .command('report')
  .description('Generate reports from collected metrics')
  .option('-d, --days <days>', 'Number of days to include in report', '30')
  .option('-o, --output <file>', 'Output file for report')
  .action(reportCommand);

// Parse command line arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}