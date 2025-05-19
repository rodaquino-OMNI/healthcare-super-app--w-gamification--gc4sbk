/**
 * Date utilities
 * 
 * This module serves as the main entry point for all date-related utilities,
 * re-exporting functions from specialized modules to provide a convenient
 * single import point while enabling selective imports and tree-shaking.
 * 
 * @example Import all date utilities
 * ```typescript
 * import * as DateUtils from '@austa/utils/date';
 * 
 * // Use any date utility
 * const formattedDate = DateUtils.formatDate(new Date());
 * ```
 * 
 * @example Import specific utilities
 * ```typescript
 * import { formatDate, formatTime } from '@austa/utils/date';
 * 
 * // Use specific utilities
 * const formattedDate = formatDate(new Date());
 * ```
 * 
 * @example Import from specialized modules (enables better tree-shaking)
 * ```typescript
 * import { formatDate } from '@austa/utils/date/format';
 * import { calculateAge } from '@austa/utils/date/calculation';
 * ```
 */

// Re-export all date-related constants
export * from './constants';

// Re-export all date formatting utilities
export * from './format';

// Re-export all date parsing utilities
export * from './parse';

// Re-export all date validation utilities
export * from './validation';

// Re-export all date range utilities
export * from './range';

// Re-export all date comparison utilities
export * from './comparison';

// Re-export all date calculation utilities
export * from './calculation';

// Re-export all timezone utilities
export * from './timezone';

// Re-export all journey-specific date utilities
export * from './journey';