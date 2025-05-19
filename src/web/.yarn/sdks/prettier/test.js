#!/usr/bin/env node

/**
 * Test file for the Prettier SDK
 * 
 * This file can be used to test that the Prettier SDK is working correctly.
 * Run it with: node .yarn/sdks/prettier/test.js
 */

const prettier = require('./index.js');

// Test formatting a simple JavaScript file
const source = `
function test(  ) {
    console.log(   'Hello, world!'   );
    return         1+2;
}
`;

try {
  const formatted = prettier.format(source, {
    parser: 'babel',
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
  });

  console.log('Formatted source:');
  console.log(formatted);
  console.log('\nPrettier SDK is working correctly!');
} catch (error) {
  console.error('Error testing Prettier SDK:', error);
  process.exit(1);
}