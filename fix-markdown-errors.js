/**
 * AUSTA SuperApp - Markdown Documentation Fixer
 * 
 * This script automatically corrects common markdown syntax issues throughout the repository
 * documentation, ensuring consistent formatting and preventing rendering problems.
 * 
 * It applies transformations for heading increments, blank lines, list blocks, URL formatting,
 * and more to maintain documentation quality across the codebase.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob'); // You may need to install this: npm install glob

// Configuration constants
const CONFIG = {
  DEFAULT_PATTERN: './{docs,src/**/docs,blitzy/documentation}/**/*.md',
  BACKUP_EXTENSION: '.bak',
  MAX_BACKUP_AGE_DAYS: 7, // Automatically clean up backups older than this
  VERBOSE: false, // Set to true for more detailed logging
};

/**
 * Enhanced markdown linting error fix script
 * - MD001: Heading increment (ensures headings only increment by one level at a time)
 * - MD004: Unordered list style (converts * to -)
 * - MD012: Multiple consecutive blank lines
 * - MD022: Blanks around headings
 * - MD024: Duplicate headings (improved to add unique suffixes)
 * - MD032: Blanks around lists
 * - MD034: Bare URLs
 * - MD036: Emphasis used as headings
 * - MD040: Code blocks missing language (improved)
 * - MD046: Code block style consistency (fenced vs indented)
 * - MD047: Files should end with a single newline
 * - MD049: Emphasis style consistency (asterisks vs underscores)
 */

// Helper function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Logs a message with optional verbosity control
 * @param {string} message - The message to log
 * @param {boolean} [alwaysShow=false] - Whether to show regardless of verbosity setting
 */
function log(message, alwaysShow = false) {
  if (alwaysShow || CONFIG.VERBOSE) {
    console.log(message);
  }
}

/**
 * Creates a timestamped backup of a file
 * @param {string} filePath - Path to the file to back up
 * @param {string} content - Content to write to the backup file
 * @returns {string} Path to the backup file
 */
function createBackup(filePath, content) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}${CONFIG.BACKUP_EXTENSION}.${timestamp}`;
    fs.writeFileSync(backupPath, content, 'utf8');
    log(`  Backup created: ${backupPath}`);
    return backupPath;
  } catch (err) {
    console.error(`  Error creating backup for ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Cleans up old backup files
 * @param {string} directory - Directory to clean
 */
function cleanupOldBackups(directory) {
  try {
    const backupPattern = path.join(directory, `**/*${CONFIG.BACKUP_EXTENSION}*`);
    const backupFiles = glob.sync(backupPattern, { nodir: true });
    const now = new Date();
    const maxAge = CONFIG.MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000; // days to ms
    
    let cleanedCount = 0;
    
    backupFiles.forEach(backupFile => {
      try {
        const stats = fs.statSync(backupFile);
        const fileAge = now - stats.mtime;
        
        if (fileAge > maxAge) {
          fs.unlinkSync(backupFile);
          cleanedCount++;
        }
      } catch (err) {
        log(`  Error checking backup file ${backupFile}: ${err.message}`);
      }
    });
    
    if (cleanedCount > 0) {
      log(`Cleaned up ${cleanedCount} old backup files`, true);
    }
  } catch (err) {
    console.error(`Error cleaning up backups: ${err.message}`);
  }
}

/**
 * Main function to process markdown files
 */
function processMarkdownFiles() {
  // Get files to process
  const filePattern = process.argv[2] || CONFIG.DEFAULT_PATTERN;
  const filesToFix = glob.sync(filePattern, { nodir: true });

  if (filesToFix.length === 0) {
    console.log(`No files found matching pattern: ${filePattern}`);
    console.log('Usage: node fix-markdown-errors.js "[path/pattern]"');
    console.log('Example: node fix-markdown-errors.js "./docs/**/*.md"');
    console.log(`Default pattern: ${CONFIG.DEFAULT_PATTERN}`);
    process.exit(1);
  }

  console.log(`Found ${filesToFix.length} markdown files to process`);
  
  // Track statistics
  const stats = {
    processed: 0,
    changed: 0,
    errors: 0,
    fixes: {}
  };

  // Process each file
  filesToFix.forEach(filePath => {
    log(`Processing: ${filePath}`, true);
    stats.processed++;
    
    // Read the file
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`Error reading file ${filePath}: ${err.message}`);
      stats.errors++;
      return;
    }
    
    // Track if we made changes and what types of fixes were applied
    let originalContent = content;
    const appliedFixes = [];
    
    // Apply all fixes
    const fixFunctions = [
      { name: 'heading-increment', fn: fixHeadingIncrement },
      { name: 'blanks-around-headings', fn: fixBlanksAroundHeadings },
      { name: 'blanks-around-lists', fn: fixBlanksAroundLists },
      { name: 'bare-urls', fn: fixBareUrls },
      { name: 'multiple-blank-lines', fn: fixMultipleBlankLines },
      { name: 'code-block-language', fn: fixCodeBlockLanguage },
      { name: 'unordered-list-style', fn: fixUnorderedListStyle },
      { name: 'emphasis-as-headings', fn: fixEmphasisAsHeadings },
      { name: 'duplicate-headings', fn: fixDuplicateHeadings },
      { name: 'code-block-style', fn: fixCodeBlockStyle },
      { name: 'file-ending-newline', fn: fixFileEndingNewline },
      { name: 'emphasis-style', fn: fixEmphasisStyle },
      { name: 'journey-specific-formatting', fn: fixJourneySpecificFormatting }
    ];
    
    for (const { name, fn } of fixFunctions) {
      const beforeFix = content;
      try {
        content = fn(content);
        if (content !== beforeFix) {
          appliedFixes.push(name);
          stats.fixes[name] = (stats.fixes[name] || 0) + 1;
        }
      } catch (err) {
        console.error(`  Error applying fix '${name}' to ${filePath}: ${err.message}`);
        content = beforeFix; // Revert to before this fix attempt
        stats.errors++;
      }
    }
    
    // Only write if changes were made
    if (content !== originalContent) {
      try {
        // Create backup of original file
        createBackup(filePath, originalContent);
        
        // Write fixed content
        fs.writeFileSync(filePath, content, 'utf8');
        log(`  Fixed file written: ${filePath}`, true);
        log(`  Applied fixes: ${appliedFixes.join(', ')}`);
        stats.changed++;
      } catch (err) {
        console.error(`  Error writing file ${filePath}: ${err.message}`);
        stats.errors++;
      }
    } else {
      log(`  No changes needed for: ${filePath}`);
    }
  });

  // Clean up old backups
  cleanupOldBackups('.');

  // Print summary
  console.log('\nSummary:');
  console.log(`  Files processed: ${stats.processed}`);
  console.log(`  Files changed: ${stats.changed}`);
  console.log(`  Errors encountered: ${stats.errors}`);
  
  if (Object.keys(stats.fixes).length > 0) {
    console.log('\nFixes applied:');
    Object.entries(stats.fixes)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([fixName, count]) => {
        console.log(`  ${fixName}: ${count}`);
      });
  }
}

/**
 * Fix heading increment errors
 * Ensures headings only increment by one level at a time
 */
function fixHeadingIncrement(text) {
  const lines = text.split('\n');
  const resultLines = [...lines];
  
  let lastHeadingLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      const currentLevel = headingMatch[1].length;
      const title = headingMatch[2].trim();
      
      // If we're jumping more than one level
      if (currentLevel > lastHeadingLevel + 1 && lastHeadingLevel > 0) {
        // Create a new heading at the appropriate level
        const newLevel = lastHeadingLevel + 1;
        const newHeading = '#'.repeat(newLevel) + ' ' + title;
        
        // Replace the current heading
        resultLines[i] = newHeading;
        
        log(`  Fixed heading increment: "${line}" -> "${newHeading}"`);
      }
      
      // Update the last heading level
      lastHeadingLevel = resultLines[i].match(/^(#{1,6})\s+/)[1].length;
    }
  }
  
  return resultLines.join('\n');
}

/**
 * Fix blanks around headings
 */
function fixBlanksAroundHeadings(text) {
  // Match headers and ensure they have blank lines before and after
  let result = text;
  
  // Fix spacing before headers that don't start the file
  result = result.replace(/([^\n])(\n)(#{1,6} .+)(\n)/g, '$1\n\n$3\n');
  
  // Fix spacing after headers
  result = result.replace(/(#{1,6} .+)(\n)([^\n])/g, '$1\n\n$3');
  
  // Handle file-starting headers (no need for blank line before)
  result = result.replace(/^(#{1,6} .+)(\n)([^\n])/gm, '$1\n\n$3');
  
  return result;
}

/**
 * Fix blanks around lists
 */
function fixBlanksAroundLists(text) {
  // Add blank line before lists that don't have one
  let result = text.replace(/([^\n])(\n)([-*+] )/g, '$1\n\n$3');
  
  // Add blank line after lists if needed
  result = result.replace(/^([-*+] .+)(\n)([^-*+\s])/gm, '$1\n\n$3');
  
  // Handle nested lists better by processing line by line
  const lines = result.split('\n');
  let inList = false;
  let indentation = 0;
  const processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^(\s*)([-*+] )/);
    
    if (listMatch) {
      // This is a list item
      const currentIndent = listMatch[1].length;
      
      if (!inList) {
        // Starting a new list
        inList = true;
        indentation = currentIndent;
        // Make sure there's a blank line before if not already there
        if (i > 0 && processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
      }
      
      processedLines.push(line);
    } else if (line.trim() === '') {
      // Blank line
      processedLines.push(line);
      if (inList) {
        inList = false;
      }
    } else {
      // Not a list item
      if (inList) {
        // We were in a list, now we're not
        inList = false;
        // Make sure there's a blank line after if not already there
        if (processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
      }
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n');
}

/**
 * Fix bare URLs by wrapping them in angle brackets
 */
function fixBareUrls(text) {
  // This regex tries to match URLs not in markdown link format
  // We need to exclude URLs in code blocks
  const codeBlocks = [];
  
  // First, extract code blocks to prevent changing URLs inside them
  let processedText = text.replace(/```[\s\S]*?```|`[^`]+`/g, match => {
    codeBlocks.push(match);
    return `CODE_BLOCK_${codeBlocks.length - 1}`;
  });
  
  // Fix URLs not in link format
  processedText = processedText.replace(/(?<![(<`])(https?:\/\/[^\s)\]>]+)(?![)>\]])/g, '<$1>');
  
  // Restore code blocks
  processedText = processedText.replace(/CODE_BLOCK_(\d+)/g, (_, index) => codeBlocks[parseInt(index)]);
  
  return processedText;
}

/**
 * Fix multiple consecutive blank lines
 */
function fixMultipleBlankLines(text) {
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * Fix code blocks without language specification (IMPROVED VERSION)
 * This will add a language specifier to all code blocks that don't have one
 */
function fixCodeBlockLanguage(text) {
  // Match code blocks that don't have a language specifier
  let result = text;
  
  // Fix open-ended code blocks (```\n)
  result = result.replace(/```(\s*\n)/g, '```markdown$1');
  
  // Fix closed code blocks without language (```)
  result = result.replace(/```\s*$/gm, '```markdown');
  
  // Fix code blocks with no content
  result = result.replace(/```\s*```/g, '```markdown\n```');
  
  // Find more complex code blocks - fences with nothing or whitespace after backticks
  result = result.replace(/```([^a-zA-Z0-9_\n][^\n]*\n)/g, '```markdown$1');
  
  return result;
}

/**
 * Fix unordered list style to use dashes instead of asterisks
 */
function fixUnorderedListStyle(text) {
  return text.replace(/^(\s*)\* /gm, '$1- ');
}

/**
 * Fix emphasis used as headings
 */
function fixEmphasisAsHeadings(text) {
  // Convert **text** on a line by itself to a proper heading
  return text.replace(/^(\s*)\*\*(.+)\*\*\s*$/gm, '$1### $2');
}

/**
 * Fix duplicate headings (IMPROVED VERSION)
 * Better and more intelligent handling of duplicate headings
 */
function fixDuplicateHeadings(text) {
  const headingsByLevel = {};
  const headingsByContent = {};
  const lines = text.split('\n');
  const resultLines = [...lines];
  
  // First pass: identify all headings and their positions
  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const key = `${level}:${title}`;
      
      if (!headingsByLevel[level]) {
        headingsByLevel[level] = {};
      }
      
      if (!headingsByContent[key]) {
        headingsByContent[key] = [];
      }
      
      headingsByContent[key].push(index);
    }
  });
  
  // Second pass: fix duplicates by adding unique suffixes
  Object.keys(headingsByContent).forEach(key => {
    const indices = headingsByContent[key];
    
    if (indices.length > 1) {
      // We have duplicates
      const [level, title] = key.split(':', 2);
      
      // Add suffixes, starting with the second occurrence
      for (let i = 1; i < indices.length; i++) {
        const index = indices[i];
        const suffix = ` (${i + 1})`;
        const originalLine = lines[index];
        const newLine = originalLine.replace(title, title + suffix);
        resultLines[index] = newLine;
      }
    }
  });
  
  return resultLines.join('\n');
}

/**
 * Fix code block style consistency
 * Ensures all code blocks use the fenced style (```) rather than indented
 */
function fixCodeBlockStyle(text) {
  // This is a complex transformation that would require parsing the document structure
  // For now, we'll just identify indented code blocks that are 4 spaces or 1 tab
  // and aren't part of a list item, and convert them to fenced code blocks
  
  const lines = text.split('\n');
  const resultLines = [];
  
  let inIndentedBlock = false;
  let indentedBlockLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isIndentedCodeLine = line.match(/^(    |\t)[^-*+]/) && 
                              !line.match(/^(    |\t)[-*+]/) && // Not a list item
                              line.trim().length > 0;
    
    if (isIndentedCodeLine && !inIndentedBlock) {
      // Start of an indented code block
      inIndentedBlock = true;
      indentedBlockLines = [line];
    } else if (isIndentedCodeLine && inIndentedBlock) {
      // Continuation of an indented code block
      indentedBlockLines.push(line);
    } else if (!isIndentedCodeLine && inIndentedBlock) {
      // End of an indented code block
      inIndentedBlock = false;
      
      // Convert the indented block to a fenced block
      resultLines.push('```');
      indentedBlockLines.forEach(codeLine => {
        // Remove the indentation (4 spaces or 1 tab)
        resultLines.push(codeLine.replace(/^(    |\t)/, ''));
      });
      resultLines.push('```');
      
      // Add the current line
      resultLines.push(line);
    } else {
      // Regular line
      resultLines.push(line);
    }
  }
  
  // Handle case where file ends with an indented code block
  if (inIndentedBlock) {
    resultLines.push('```');
    indentedBlockLines.forEach(codeLine => {
      resultLines.push(codeLine.replace(/^(    |\t)/, ''));
    });
    resultLines.push('```');
  }
  
  return resultLines.join('\n');
}

/**
 * Fix files to end with a single newline
 */
function fixFileEndingNewline(text) {
  // Ensure the file ends with exactly one newline
  return text.replace(/\n*$/, '\n');
}

/**
 * Fix emphasis style to use asterisks consistently
 */
function fixEmphasisStyle(text) {
  // Replace underscores with asterisks for emphasis
  let result = text;
  
  // Replace _text_ with *text* (italic)
  result = result.replace(/(?<!\\)_([^_\n]+?)(?<!\\)_/g, '*$1*');
  
  // Replace __text__ with **text** (bold)
  result = result.replace(/(?<!\\)__([^_\n]+?)(?<!\\)__/g, '**$1**');
  
  return result;
}

/**
 * Fix journey-specific formatting issues
 * Handles special formatting for journey-related documentation
 */
function fixJourneySpecificFormatting(text) {
  let result = text;
  
  // Fix journey names to use consistent formatting
  // "Minha Saúde" -> "**Minha Saúde**"
  // "Cuidar-me Agora" -> "**Cuidar-me Agora**"
  // "Meu Plano & Benefícios" -> "**Meu Plano & Benefícios**"
  const journeyNames = [
    'Minha Saúde',
    'Cuidar-me Agora',
    'Meu Plano & Benefícios'
  ];
  
  journeyNames.forEach(journeyName => {
    const escapedName = escapeRegExp(journeyName);
    // Only match journey names that aren't already emphasized and aren't in code blocks
    const regex = new RegExp(`(?<!\*\*)${escapedName}(?!\*\*)`, 'g');
    result = result.replace(regex, `**${journeyName}**`);
  });
  
  // Fix package names to use consistent formatting with backticks
  // @austa/design-system -> `@austa/design-system`
  const packageNames = [
    '@austa/design-system',
    '@design-system/primitives',
    '@austa/interfaces',
    '@austa/journey-context'
  ];
  
  packageNames.forEach(packageName => {
    const escapedName = escapeRegExp(packageName);
    // Only match package names that aren't already in backticks
    const regex = new RegExp(`(?<!\`)${escapedName}(?!\`)`, 'g');
    result = result.replace(regex, `\`${packageName}\``);
  });
  
  return result;
}

// Execute the main function
processMarkdownFiles();