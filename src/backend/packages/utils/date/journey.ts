/**
 * Journey-specific date utilities
 * 
 * This module provides date formatting utilities specific to each journey context
 * (Health, Care, Plan) in the AUSTA SuperApp. It ensures consistent date representation
 * across all journey-specific components and services.
 */

import { formatJourneyDate as formatJourneyDateImpl } from '../../src/date';

/**
 * Journey type representing the three main journeys in the AUSTA SuperApp
 */
export type JourneyType = 'health' | 'care' | 'plan';

/**
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format
 * @param journeyId - The journey identifier (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date string
 * 
 * @example
 * // Health journey - returns "15/03/2023 14:30"
 * formatJourneyDate(new Date(2023, 2, 15, 14, 30), 'health');
 * 
 * @example
 * // Care journey - returns "qua, 15 mar 2023"
 * formatJourneyDate(new Date(2023, 2, 15), 'care');
 * 
 * @example
 * // Plan journey - returns "15/03/2023"
 * formatJourneyDate(new Date(2023, 2, 15), 'plan');
 */
export const formatJourneyDate = (
  date: Date | string | number,
  journeyId: JourneyType | string,
  locale: string = 'pt-BR'
): string => {
  return formatJourneyDateImpl(date, journeyId, locale);
};

/**
 * Re-export additional journey-specific date utilities here as needed
 */