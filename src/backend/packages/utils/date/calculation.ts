/**
 * Date calculation utilities
 * 
 * This module provides a convenient entry point for date calculation utilities,
 * re-exporting functions like calculateAge and getTimeAgo from the implementation folder.
 * These functions are essential for determining age based on birthdate and generating
 * human-readable relative time descriptions in both Portuguese and English.
 */

// Re-export date calculation utilities from the implementation folder
export {
  calculateAge,
  getTimeAgo
} from '../src/date/calculation';