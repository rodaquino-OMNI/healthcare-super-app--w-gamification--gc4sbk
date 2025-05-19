/**
 * Journey-specific date formatting utilities
 * 
 * This module provides date formatting functions tailored to the specific needs of each
 * journey (Health, Care, Plan) in the AUSTA SuperApp. Each journey has unique date
 * formatting requirements based on its domain and user experience needs.
 * 
 * @packageDocumentation
 */

import { format, isValid } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

/**
 * Enum representing the three main journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  /** Health journey ("Minha Saúde") - Focused on health metrics and monitoring */
  HEALTH = 'health',
  
  /** Care journey ("Cuidar-me Agora") - Focused on appointments and medical care */
  CARE = 'care',
  
  /** Plan journey ("Meu Plano & Benefícios") - Focused on insurance plans and benefits */
  PLAN = 'plan'
}

/**
 * Map of locale identifiers to date-fns locale objects
 */
const LOCALE_MAP = {
  'pt-BR': ptBR,
  'en-US': enUS
};

/**
 * Default locale to use when none is specified
 */
const DEFAULT_LOCALE = 'pt-BR';

/**
 * Error message for invalid journey type
 */
const INVALID_JOURNEY_ERROR = 'Invalid journey type provided. Must be one of: health, care, plan';

/**
 * Journey-specific date format mapping
 */
const JOURNEY_DATE_FORMATS: Record<JourneyType, string> = {
  [JourneyType.HEALTH]: 'dd/MM/yyyy HH:mm', // Health journey uses detailed format with time for metrics
  [JourneyType.CARE]: 'EEE, dd MMM yyyy',    // Care journey uses appointment-friendly format
  [JourneyType.PLAN]: 'dd/MM/yyyy'           // Plan journey uses formal date format for claims and documents
};

/**
 * Validates if a date is valid
 * 
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 */
const isValidDate = (date: any): boolean => {
  if (date === null || date === undefined) {
    return false;
  }
  
  if (date instanceof Date) {
    return isValid(date);
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const dateObj = new Date(date);
    return isValid(dateObj);
  }
  
  return false;
};

/**
 * Validates and normalizes a journey type string to a valid JourneyType enum value
 * 
 * @param journeyId - The journey identifier to validate
 * @returns The normalized JourneyType enum value
 * @throws Error if the journey type is invalid
 */
const validateJourneyType = (journeyId: string): JourneyType => {
  const normalizedJourneyId = journeyId.toLowerCase();
  
  // Check if the normalized journey ID is a valid JourneyType
  if (Object.values(JourneyType).includes(normalizedJourneyId as JourneyType)) {
    return normalizedJourneyId as JourneyType;
  }
  
  throw new Error(INVALID_JOURNEY_ERROR);
};

/**
 * Formats a date according to journey-specific requirements
 * 
 * Each journey in the AUSTA SuperApp has specific date formatting needs:
 * - Health journey ("Minha Saúde"): Detailed format with time for precise health metrics
 * - Care journey ("Cuidar-me Agora"): Appointment-friendly format with day of week
 * - Plan journey ("Meu Plano & Benefícios"): Formal date format for claims and documents
 * 
 * @example
 * // Health journey date formatting (with time)
 * formatJourneyDate(new Date(), JourneyType.HEALTH); // "25/05/2023 14:30"
 * 
 * @example
 * // Care journey date formatting (with day of week)
 * formatJourneyDate(new Date(), JourneyType.CARE); // "Qui, 25 Mai 2023"
 * 
 * @example
 * // Plan journey date formatting (formal)
 * formatJourneyDate(new Date(), JourneyType.PLAN); // "25/05/2023"
 * 
 * @param date - The date to format
 * @param journeyType - The journey type or identifier string
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Journey-specific formatted date string
 * @throws Error if the journey type is invalid
 */
export const formatJourneyDate = (
  date: Date | string | number,
  journeyType: JourneyType | string,
  locale: string = DEFAULT_LOCALE
): string => {
  // Validate date
  if (!isValidDate(date)) {
    return '';
  }
  
  // Convert date to Date object if it's a string or number
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Get locale object
  const localeObj = LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE];
  
  try {
    // Validate and normalize journey type
    const normalizedJourneyType = typeof journeyType === 'string' 
      ? validateJourneyType(journeyType)
      : journeyType;
    
    // Get format string for the journey type
    const formatStr = JOURNEY_DATE_FORMATS[normalizedJourneyType];
    
    // Format the date
    return format(dateObj, formatStr, { locale: localeObj });
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_JOURNEY_ERROR) {
      throw error;
    }
    
    // For other errors, return empty string
    return '';
  }
};

/**
 * Formats a date for the Health journey ("Minha Saúde")
 * 
 * @example
 * // Format a date for the Health journey
 * formatHealthDate(new Date()); // "25/05/2023 14:30"
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Health journey formatted date string
 */
export const formatHealthDate = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  return formatJourneyDate(date, JourneyType.HEALTH, locale);
};

/**
 * Formats a date for the Care journey ("Cuidar-me Agora")
 * 
 * @example
 * // Format a date for the Care journey
 * formatCareDate(new Date()); // "Qui, 25 Mai 2023"
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Care journey formatted date string
 */
export const formatCareDate = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  return formatJourneyDate(date, JourneyType.CARE, locale);
};

/**
 * Formats a date for the Plan journey ("Meu Plano & Benefícios")
 * 
 * @example
 * // Format a date for the Plan journey
 * formatPlanDate(new Date()); // "25/05/2023"
 * 
 * @param date - The date to format
 * @param locale - The locale to use for formatting (defaults to pt-BR)
 * @returns Plan journey formatted date string
 */
export const formatPlanDate = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  return formatJourneyDate(date, JourneyType.PLAN, locale);
};