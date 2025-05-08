import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@backend/packages/errors';

/**
 * Base exception class for all quest-related errors in the gamification engine.
 * Provides standardized error handling with quest-specific error codes and metadata.
 * 
 * All quest-related exceptions should extend this class to ensure consistent
 * error reporting, logging, and client responses across the quest module.
 */
export abstract class BaseQuestException extends AppException {
  /**
   * Creates a new quest-related exception.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code (will be prefixed with 'GAME_' if not already)
   * @param questMetadata - Quest-specific metadata for debugging and logging
   * @param cause - Original error that caused this exception, if any
   * @param httpStatus - HTTP status code to return in API responses
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    questMetadata: QuestErrorMetadata,
    cause?: Error | null,
    httpStatus?: HttpStatus
  ) {
    // Ensure error code has the GAME_ prefix
    const errorCode = code.startsWith('GAME_') ? code : `GAME_${code}`;
    
    // Add timestamp to metadata for tracking when the error occurred
    const enhancedMetadata = {
      ...questMetadata,
      timestamp: new Date().toISOString(),
    };
    
    super(message, type, errorCode, enhancedMetadata, cause, httpStatus);
    
    // Set the name to the actual class name for better error identification
    this.name = this.constructor.name;
  }
}

/**
 * Interface defining the structure of quest-specific error metadata.
 * This metadata helps with debugging, logging, and error analysis.
 */
export interface QuestErrorMetadata {
  /**
   * ID of the quest related to this error, if applicable
   */
  questId?: string;
  
  /**
   * ID of the user related to this error, if applicable
   */
  userId?: string;
  
  /**
   * Current state or progress of the quest when the error occurred, if applicable
   */
  questState?: string;
  
  /**
   * Operation being performed when the error occurred (e.g., 'start', 'complete', 'update')
   */
  operation?: string;
  
  /**
   * Any additional context-specific information relevant to debugging this error
   */
  [key: string]: any;
}