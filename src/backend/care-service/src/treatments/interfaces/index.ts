/**
 * Barrel file for treatment interfaces.
 * This file exports all interface definitions from the treatments domain,
 * enabling cleaner imports throughout the codebase.
 * 
 * @module treatments/interfaces
 */

// Export treatment plan interfaces
export { ITreatmentPlan } from './treatment-plan.interface';

// Export treatment plan DTO interfaces
export { 
  ICreateTreatmentPlanDto,
  IUpdateTreatmentPlanDto 
} from './treatment-plan-dto.interface';

// Export treatment plan response interfaces
export {
  TreatmentPlanResponse,
  TreatmentPlanSuccessResponse,
  TreatmentPlanErrorResponse,
  TreatmentPlanPaginatedResponse,
  TreatmentPlanFilteredResponse,
  SingleTreatmentPlanResponse,
  MultipleTreatmentPlansResponse,
  PaginatedTreatmentPlansResponse,
  FilteredTreatmentPlansResponse
} from './treatment-plan-response.interface';