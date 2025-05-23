/**
 * @file Journey-specific Date Utilities
 * @description Provides date formatting utilities tailored to the specific needs of each journey
 * (Health, Care, Plan) in the AUSTA SuperApp. These utilities ensure consistent date representation
 * across all journey contexts.
 */

import { formatDate, formatDateTime } from './format';
import { isValidDate } from './validation';
import { DEFAULT_LOCALE, JOURNEY_DATE_FORMATS } from './constants';

/**
 * Enum representing the three main journeys in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Error thrown when an invalid journey identifier is provided
 */
export class InvalidJourneyError extends Error {
  constructor(journeyId: string) {
    super(`Invalid journey identifier: ${journeyId}. Expected one of: ${Object.values(JourneyType).join(', ')}`);
    this.name = 'InvalidJourneyError';
  }
}

/**
 * Formats a date according to journey-specific requirements
 * 
 * @param date - The date to format (can be Date object, string, or number)
 * @param journeyType - The journey type (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date string
 * @throws {InvalidJourneyError} If an invalid journey identifier is provided
 * 
 * @example
 * // Health journey - formats with time (for metrics tracking)
 * formatJourneyDate(new Date(), JourneyType.HEALTH); // '15/05/2023 14:30'
 * 
 * @example
 * // Care journey - formats with day name (for appointments)
 * formatJourneyDate(new Date(), JourneyType.CARE); // 'Seg, 15 Mai 2023'
 * 
 * @example
 * // Plan journey - formats with standard date (for claims and documents)
 * formatJourneyDate(new Date(), JourneyType.PLAN); // '15/05/2023'
 */
export const formatJourneyDate = (
  date: Date | string | number,
  journeyType: JourneyType | string,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Normalize journey type to string for comparison
  const journeyId = typeof journeyType === 'string' ? journeyType.toLowerCase() : journeyType;
  
  // Journey-specific formats
  switch (journeyId) {
    case JourneyType.HEALTH:
      // Health journey uses detailed format with time for metrics
      return formatDateTime(dateObj, JOURNEY_DATE_FORMATS.health, locale);
      
    case JourneyType.CARE:
      // Care journey uses appointment-friendly format
      return formatDate(dateObj, JOURNEY_DATE_FORMATS.care, locale);
      
    case JourneyType.PLAN:
      // Plan journey uses formal date format for claims and documents
      return formatDate(dateObj, JOURNEY_DATE_FORMATS.plan, locale);
      
    default:
      throw new InvalidJourneyError(String(journeyId));
  }
};

/**
 * Formats a date range according to journey-specific requirements
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param journeyType - The journey type (health, care, plan)
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date range string
 * @throws {InvalidJourneyError} If an invalid journey identifier is provided
 * 
 * @example
 * // Health journey date range
 * formatJourneyDateRange(new Date('2023-05-01'), new Date('2023-05-15'), JourneyType.HEALTH);
 * // '01/05/2023 00:00 - 15/05/2023 00:00'
 * 
 * @example
 * // Care journey date range
 * formatJourneyDateRange(new Date('2023-05-01'), new Date('2023-05-15'), JourneyType.CARE);
 * // 'Seg, 01 Mai 2023 - Seg, 15 Mai 2023'
 */
export const formatJourneyDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number,
  journeyType: JourneyType | string,
  locale: string = DEFAULT_LOCALE
): string => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return '';
  }
  
  const formattedStartDate = formatJourneyDate(startDate, journeyType, locale);
  const formattedEndDate = formatJourneyDate(endDate, journeyType, locale);
  
  return `${formattedStartDate} - ${formattedEndDate}`;
};

/**
 * Gets the appropriate date format string for a specific journey
 * 
 * @param journeyType - The journey type (health, care, plan)
 * @returns The date format string for the specified journey
 * @throws {InvalidJourneyError} If an invalid journey identifier is provided
 */
export const getJourneyDateFormat = (journeyType: JourneyType | string): string => {
  // Normalize journey type to string for comparison
  const journeyId = typeof journeyType === 'string' ? journeyType.toLowerCase() : journeyType;
  
  switch (journeyId) {
    case JourneyType.HEALTH:
      return JOURNEY_DATE_FORMATS.health;
      
    case JourneyType.CARE:
      return JOURNEY_DATE_FORMATS.care;
      
    case JourneyType.PLAN:
      return JOURNEY_DATE_FORMATS.plan;
      
    default:
      throw new InvalidJourneyError(String(journeyId));
  }
};