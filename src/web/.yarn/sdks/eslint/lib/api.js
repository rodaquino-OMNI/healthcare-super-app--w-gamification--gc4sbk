/**
 * ESLint API wrapper for Yarn Plug'n'Play environments
 *
 * This module wraps the ESLint API to ensure it works correctly in a Yarn PnP environment.
 * It injects the PnP loader before loading ESLint, ensuring all dependencies can be resolved.
 */

'use strict';

// Set up the PnP environment
const pnpApi = require('pnpapi');

// Find the actual ESLint package
const eslintPath = pnpApi.resolveRequest('eslint', `${__dirname}/..`);

// Load the actual ESLint module
const eslint = require(eslintPath);

// Re-export all ESLint exports
module.exports = eslint;

// Add our custom resolver
module.exports.ESLintResolver = require('./resolver');