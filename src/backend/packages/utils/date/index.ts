/**
 * Date Utilities Package
 * 
 * This package provides a comprehensive set of date manipulation, formatting,
 * parsing, and validation utilities for use across all journey services in the
 * AUSTA SuperApp. It supports localization for Portuguese and English and
 * includes journey-specific date formatting rules.
 * 
 * @packageDocumentation
 */

// Re-export all date utility modules
export * from './calculation';
export * from './comparison';
export * from './constants';
export * from './format';
export * from './journey';
export * from './parse';
export * from './range';
export * from './timezone';
export * from './validation';

// For backward compatibility with existing import patterns
// This ensures that code using the old import path still works
import * as DateUtils from '../src/date';
export default DateUtils;