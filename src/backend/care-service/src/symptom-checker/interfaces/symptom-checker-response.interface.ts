/**
 * @file symptom-checker-response.interface.ts
 * @description Interface definition for the symptom checker service response
 */

import {
  SymptomSeverity,
  CareOptions,
  PossibleCondition,
  SymptomCheckerResponse
} from '@austa/interfaces/journey/care';

/**
 * Re-export the SymptomCheckerResponse interface from @austa/interfaces
 * This ensures backward compatibility and provides a clear import path
 * for service consumers
 */
export type ISymptomCheckerResponse = SymptomCheckerResponse;

/**
 * Re-export related interfaces and enums for convenience
 */
export {
  SymptomSeverity,
  CareOptions,
  PossibleCondition
};