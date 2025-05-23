/**
 * Journey-specific date utilities
 * 
 * This module provides date formatting functions specifically tailored for the different
 * user journeys in the AUSTA SuperApp (Health, Care, Plan).
 */

import { formatJourneyDate as formatJourneyDateImpl } from '../../../shared/src/utils/date.util';

/**
 * Journey identifiers for the AUSTA SuperApp
 */
export type JourneyId = 'health' | 'care' | 'plan' | string;

/**
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format
 * @param journeyId - The journey identifier (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date string
 * 
 * @example
 * // Health journey - returns date with time (e.g., "01/05/2023 14:30")
 * formatJourneyDate(new Date(), 'health');
 * 
 * @example
 * // Care journey - returns appointment-friendly format (e.g., "Seg, 01 Mai 2023")
 * formatJourneyDate(new Date(), 'care');
 * 
 * @example
 * // Plan journey - returns formal date format (e.g., "01/05/2023")
 * formatJourneyDate(new Date(), 'plan');
 */
export const formatJourneyDate = (
  date: Date | string | number,
  journeyId: JourneyId,
  locale: string = 'pt-BR'
): string => {
  return formatJourneyDateImpl(date, journeyId, locale);
};