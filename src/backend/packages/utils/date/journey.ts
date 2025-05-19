/**
 * Journey-specific date utilities
 * 
 * This module provides date formatting utilities tailored to the specific needs
 * of each journey (Health, Care, Plan) in the AUSTA SuperApp.
 * 
 * @module utils/date/journey
 */

import { formatJourneyDate as formatJourneyDateImpl } from '../src/date/journey';

/**
 * Journey type identifiers
 */
export type JourneyType = 'health' | 'care' | 'plan';

/**
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format
 * @param journeyId - The journey identifier (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date
 * 
 * @example
 * // Health journey - returns date with time (dd/MM/yyyy HH:mm)
 * formatJourneyDate(new Date(), 'health');
 * 
 * @example
 * // Care journey - returns appointment-friendly format (EEE, dd MMM yyyy)
 * formatJourneyDate(new Date(), 'care');
 * 
 * @example
 * // Plan journey - returns formal date format (dd/MM/yyyy)
 * formatJourneyDate(new Date(), 'plan');
 */
export const formatJourneyDate = (
  date: Date | string | number,
  journeyId: string | JourneyType,
  locale: string = 'pt-BR'
): string => formatJourneyDateImpl(date, journeyId, locale);