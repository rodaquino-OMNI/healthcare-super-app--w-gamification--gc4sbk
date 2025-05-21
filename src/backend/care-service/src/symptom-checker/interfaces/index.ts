/**
 * @file index.ts
 * @description Barrel export file for symptom-checker interfaces
 * Provides a clean, organized public API for all symptom-checker interfaces
 */

// Export interfaces from their dedicated files
export { ICareOptions } from './care-options.interface';
export { IPossibleCondition } from './possible-condition.interface';
export { ISymptomCheckerRequest } from './symptom-checker-request.interface';

// Export unique interfaces from symptom-checker-response.interface.ts
export { 
  SymptomSeverity,
  ICareJourneyContext,
  ISymptomCheckerResponse
} from './symptom-checker-response.interface';