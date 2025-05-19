#!/usr/bin/env node

/**
 * fix-duplicate-headings.js
 * 
 * This script fixes MD024 errors by adding unique suffixes to duplicate headings in Markdown files.
 * It can be used on specific files or with stdin/stdout for use with editors and CI/CD pipelines.
 * 
 * Part of the AUSTA SuperApp documentation tooling to ensure proper navigation and anchor links.
 * 
 * Usage:
 * 1. Fix a single file in place:
 *    node fix-duplicate-headings.js path/to/file.md
 * 
 * 2. Fix multiple files in place:
 *    node fix-duplicate-headings.js path/to/file1.md path/to/file2.md
 * 
 * 3. Process stdin and output to stdout (for use with editors or pipes):
 *    cat file.md | node fix-duplicate-headings.js > fixed.md
 * 
 * 4. Preview changes without modifying files (dry run):
 *    node fix-duplicate-headings.js --dry-run path/to/file.md
 * 
 * 5. Fix all markdown files in a directory (non-recursive):
 *    node fix-duplicate-headings.js --dir path/to/directory
 * 
 * Examples for the AUSTA SuperApp project structure:
 * - Fix documentation in backend services:
 *   node fix-duplicate-headings.js src/backend/*/README.md
 * 
 * - Fix documentation in frontend packages:
 *   node fix-duplicate-headings.js src/web/*/README.md
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  processDir: process.argv.includes('--dir'),
  verbose: process.argv.includes('--verbose')
};

// Extract file paths from arguments, filtering out option flags
const filePaths = process.argv.slice(2).filter(arg => !arg.startsWith('--'));

// Process directory if --dir flag is provided
if (config.processDir && filePaths.length === 1) {
  const dirPath = filePaths[0];
  try {
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(dirPath, file));
    
    if (files.length === 0) {
      logError(`No markdown files found in directory: ${dirPath}`);
      process.exit(0);
    }
    
    logInfo(`Found ${files.length} markdown files in ${dirPath}`);
    processFiles(files);
  } catch (err) {
    logError(`Error reading directory ${dirPath}: ${err.message}`);
    process.exit(1);
  }
} else if (filePaths.length > 0) {
  // Process specified files
  processFiles(filePaths);
} else {
  // Process stdin/stdout
  processStdin();
}

/**
 * Process a list of files to fix duplicate headings
 * @param {string[]} files - Array of file paths to process
 */
function processFiles(files) {
  let successCount = 0;
  let errorCount = 0;
  let unchangedCount = 0;
  
  files.forEach(filePath => {
    try {
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Skip empty files
      if (!content.trim()) {
        logWarning(`Skipping empty file: ${filePath}`);
        unchangedCount++;
        return;
      }
      
      // Fix duplicate headings
      const fixedContent = fixDuplicateHeadings(content);
      
      // Check if changes were made
      if (content !== fixedContent) {
        if (config.dryRun) {
          // In dry run mode, just report what would change
          logInfo(`Would fix duplicate headings in: ${filePath}`);
          if (config.verbose) {
            const diff = generateSimpleDiff(content, fixedContent);
            console.log(diff);
          }
        } else {
          // Create backup with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupPath = `${filePath}.${timestamp}.bak`;
          fs.writeFileSync(backupPath, content, 'utf8');
          logInfo(`Backup created: ${backupPath}`);
          
          // Write fixed content
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          logSuccess(`Fixed duplicate headings in: ${filePath}`);
        }
        successCount++;
      } else {
        logInfo(`No duplicate headings found in: ${filePath}`);
        unchangedCount++;
      }
    } catch (err) {
      logError(`Error processing file ${filePath}: ${err.message}`);
      errorCount++;
    }
  });
  
  // Summary
  if (files.length > 1 || config.processDir) {
    logInfo('\nSummary:');
    if (config.dryRun) {
      logInfo(`Would fix: ${successCount} file(s)`);
    } else {
      logSuccess(`Fixed: ${successCount} file(s)`);
    }
    logInfo(`Unchanged: ${unchangedCount} file(s)`);
    if (errorCount > 0) {
      logError(`Errors: ${errorCount} file(s)`);
    }
  }
}

/**
 * Process stdin and output to stdout
 */
function processStdin() {
  let content = '';
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      content += chunk;
    }
  });
  
  process.stdin.on('end', () => {
    if (!content.trim()) {
      // Handle empty input
      process.stdout.write('');
      return;
    }
    
    const fixedContent = fixDuplicateHeadings(content);
    process.stdout.write(fixedContent);
  });
}

/**
 * Fix duplicate headings in markdown text
 * @param {string} text - Markdown text to process
 * @returns {string} - Processed markdown text with fixed headings
 */
function fixDuplicateHeadings(text) {
  // Parse the markdown and track heading text
  const lines = text.split('\n');
  const headings = {}; // Track headings by their text content
  const result = [];
  
  // Regex to match headings (# Heading)
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  
  lines.forEach(line => {
    const match = line.match(headingRegex);
    
    if (match) {
      // This is a heading
      const level = match[1]; // The #'s
      const text = match[2].trim(); // The heading text
      
      if (headings[text]) {
        // This is a duplicate heading, add a suffix
        headings[text]++;
        const newText = `${text} (${headings[text]})`;
        result.push(`${level} ${newText}`);
      } else {
        // First time seeing this heading, record it
        headings[text] = 1;
        result.push(line);
      }
    } else {
      // Not a heading, pass through unchanged
      result.push(line);
    }
  });
  
  return result.join('\n');
}

/**
 * Generate a simple diff between original and fixed content
 * @param {string} original - Original content
 * @param {string} fixed - Fixed content
 * @returns {string} - Simple diff output
 */
function generateSimpleDiff(original, fixed) {
  const originalLines = original.split('\n');
  const fixedLines = fixed.split('\n');
  let diff = '';
  
  // Find differences
  for (let i = 0; i < Math.max(originalLines.length, fixedLines.length); i++) {
    if (i >= originalLines.length) {
      diff += `+ ${fixedLines[i]}\n`;
    } else if (i >= fixedLines.length) {
      diff += `- ${originalLines[i]}\n`;
    } else if (originalLines[i] !== fixedLines[i]) {
      diff += `- ${originalLines[i]}\n`;
      diff += `+ ${fixedLines[i]}\n`;
    }
  }
  
  return diff;
}

/**
 * Log an informational message
 * @param {string} message - Message to log
 */
function logInfo(message) {
  console.log(`\x1b[36mINFO\x1b[0m: ${message}`);
}

/**
 * Log a success message
 * @param {string} message - Message to log
 */
function logSuccess(message) {
  console.log(`\x1b[32mSUCCESS\x1b[0m: ${message}`);
}

/**
 * Log a warning message
 * @param {string} message - Message to log
 */
function logWarning(message) {
  console.log(`\x1b[33mWARNING\x1b[0m: ${message}`);
}

/**
 * Log an error message
 * @param {string} message - Message to log
 */
function logError(message) {
  console.error(`\x1b[31mERROR\x1b[0m: ${message}`);
}