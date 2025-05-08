/**
 * @file Date and Time Utilities for Gamification Engine
 * @description Provides date and time calculation utilities for the gamification engine,
 * essential for managing achievement deadlines, quest durations, and reward expiration.
 * Handles timezone conversions and date comparisons across all gamification components.
 */

// Standard library imports
import { addDays, addHours, addMonths, addWeeks, differenceInDays, differenceInHours, 
         differenceInMinutes, differenceInSeconds, format, isAfter, isBefore, 
         isEqual, isValid, parseISO, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Types
type JourneyType = 'health' | 'care' | 'plan';
type PeriodType = 'daily' | 'weekly' | 'monthly';
type DateInput = Date | string | number;

/**
 * Default timezone for the application
 * @constant
 */
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Locale mapping for date-fns
 * @constant
 */
export const LOCALE_MAPPING = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

/**
 * Default locale for the application
 * @constant
 */
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * Validates and normalizes a date input to a Date object
 * @param date - Date input (Date object, ISO string, or timestamp)
 * @returns Normalized Date object
 * @throws Error if the date is invalid
 */
export function normalizeDate(date: DateInput): Date {
  if (date instanceof Date) {
    if (!isValid(date)) {
      throw new Error('Invalid Date object provided');
    }
    return date;
  }
  
  if (typeof date === 'string') {
    try {
      const parsedDate = parseISO(date);
      if (!isValid(parsedDate)) {
        throw new Error('Invalid date string format');
      }
      return parsedDate;
    } catch (error) {
      throw new Error(`Failed to parse date string: ${error.message}`);
    }
  }
  
  if (typeof date === 'number') {
    const dateObj = new Date(date);
    if (!isValid(dateObj)) {
      throw new Error('Invalid timestamp provided');
    }
    return dateObj;
  }
  
  throw new Error('Invalid date input type');
}

/**
 * Formats a date with the specified format and locale
 * @param date - Date to format
 * @param formatStr - Format string (date-fns format)
 * @param locale - Locale for formatting (defaults to pt-BR)
 * @returns Formatted date string
 */
export function formatDate(date: DateInput, formatStr = 'dd/MM/yyyy', locale = DEFAULT_LOCALE): string {
  try {
    const normalizedDate = normalizeDate(date);
    return format(normalizedDate, formatStr, { 
      locale: LOCALE_MAPPING[locale] || LOCALE_MAPPING[DEFAULT_LOCALE]
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Calculates the start date of a period based on the reference date
 * @param referenceDate - Reference date for the period
 * @param periodType - Type of period (daily, weekly, monthly)
 * @returns Start date of the period
 */
export function getPeriodStartDate(referenceDate: DateInput, periodType: PeriodType): Date {
  const date = normalizeDate(referenceDate);
  
  switch (periodType) {
    case 'daily':
      return startOfDay(date);
    case 'weekly':
      return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
    case 'monthly':
      return startOfMonth(date);
    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

/**
 * Calculates the end date of a period based on the start date
 * @param startDate - Start date of the period
 * @param periodType - Type of period (daily, weekly, monthly)
 * @returns End date of the period
 */
export function getPeriodEndDate(startDate: DateInput, periodType: PeriodType): Date {
  const date = normalizeDate(startDate);
  
  switch (periodType) {
    case 'daily':
      return addDays(startOfDay(date), 1);
    case 'weekly':
      return addWeeks(startOfWeek(date, { weekStartsOn: 0 }), 1);
    case 'monthly':
      return addMonths(startOfMonth(date), 1);
    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

/**
 * Checks if a date is within a period
 * @param date - Date to check
 * @param periodStartDate - Start date of the period
 * @param periodType - Type of period (daily, weekly, monthly)
 * @returns True if the date is within the period
 */
export function isDateInPeriod(date: DateInput, periodStartDate: DateInput, periodType: PeriodType): boolean {
  const normalizedDate = normalizeDate(date);
  const startDate = normalizeDate(periodStartDate);
  const endDate = getPeriodEndDate(startDate, periodType);
  
  return (
    (isAfter(normalizedDate, startDate) || isEqual(normalizedDate, startDate)) &&
    isBefore(normalizedDate, endDate)
  );
}

/**
 * Calculates the achievement progress period based on the achievement type and reference date
 * @param referenceDate - Reference date for the calculation
 * @param periodType - Type of period (daily, weekly, monthly)
 * @returns Object containing start and end dates of the progress period
 */
export function calculateAchievementProgressPeriod(referenceDate: DateInput, periodType: PeriodType): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = getPeriodStartDate(referenceDate, periodType);
  const endDate = getPeriodEndDate(startDate, periodType);
  
  return { startDate, endDate };
}

/**
 * Calculates the remaining time for a quest deadline
 * @param deadline - Quest deadline date
 * @returns Object containing remaining time in different units
 */
export function calculateRemainingTime(deadline: DateInput): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
} {
  const now = new Date();
  const deadlineDate = normalizeDate(deadline);
  
  const isExpired = isBefore(deadlineDate, now);
  
  // If expired, return zeros
  if (isExpired) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
    };
  }
  
  const days = differenceInDays(deadlineDate, now);
  const hours = differenceInHours(deadlineDate, now) % 24;
  const minutes = differenceInMinutes(deadlineDate, now) % 60;
  const seconds = differenceInSeconds(deadlineDate, now) % 60;
  const totalSeconds = differenceInSeconds(deadlineDate, now);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: false,
  };
}

/**
 * Determines if a quest is active based on its start and end dates
 * @param startDate - Quest start date
 * @param endDate - Quest end date
 * @returns True if the quest is currently active
 */
export function isQuestActive(startDate: DateInput, endDate: DateInput): boolean {
  const now = new Date();
  const normalizedStartDate = normalizeDate(startDate);
  const normalizedEndDate = normalizeDate(endDate);
  
  return (
    (isAfter(now, normalizedStartDate) || isEqual(now, normalizedStartDate)) &&
    (isBefore(now, normalizedEndDate) || isEqual(now, normalizedEndDate))
  );
}

/**
 * Calculates the quest completion deadline based on the start date and duration
 * @param startDate - Quest start date
 * @param durationInDays - Duration of the quest in days
 * @returns Quest deadline date
 */
export function calculateQuestDeadline(startDate: DateInput, durationInDays: number): Date {
  if (durationInDays <= 0) {
    throw new Error('Quest duration must be greater than zero');
  }
  
  const normalizedStartDate = normalizeDate(startDate);
  return addDays(normalizedStartDate, durationInDays);
}

/**
 * Formats the remaining time for display
 * @param remainingTime - Remaining time object
 * @param locale - Locale for formatting (defaults to pt-BR)
 * @returns Formatted remaining time string
 */
export function formatRemainingTime(
  remainingTime: { days: number; hours: number; minutes: number; seconds: number; isExpired: boolean },
  locale = DEFAULT_LOCALE
): string {
  if (remainingTime.isExpired) {
    return locale === 'pt-BR' ? 'Expirado' : 'Expired';
  }
  
  if (remainingTime.days > 0) {
    return locale === 'pt-BR'
      ? `${remainingTime.days} dia${remainingTime.days !== 1 ? 's' : ''} restante${remainingTime.days !== 1 ? 's' : ''}`
      : `${remainingTime.days} day${remainingTime.days !== 1 ? 's' : ''} remaining`;
  }
  
  if (remainingTime.hours > 0) {
    return locale === 'pt-BR'
      ? `${remainingTime.hours} hora${remainingTime.hours !== 1 ? 's' : ''} restante${remainingTime.hours !== 1 ? 's' : ''}`
      : `${remainingTime.hours} hour${remainingTime.hours !== 1 ? 's' : ''} remaining`;
  }
  
  if (remainingTime.minutes > 0) {
    return locale === 'pt-BR'
      ? `${remainingTime.minutes} minuto${remainingTime.minutes !== 1 ? 's' : ''} restante${remainingTime.minutes !== 1 ? 's' : ''}`
      : `${remainingTime.minutes} minute${remainingTime.minutes !== 1 ? 's' : ''} remaining`;
  }
  
  return locale === 'pt-BR'
    ? `${remainingTime.seconds} segundo${remainingTime.seconds !== 1 ? 's' : ''} restante${remainingTime.seconds !== 1 ? 's' : ''}`
    : `${remainingTime.seconds} second${remainingTime.seconds !== 1 ? 's' : ''} remaining`;
}

/**
 * Checks if a reward is available based on its availability window
 * @param startDate - Reward availability start date
 * @param endDate - Reward availability end date (optional)
 * @returns True if the reward is currently available
 */
export function isRewardAvailable(startDate: DateInput, endDate?: DateInput): boolean {
  const now = new Date();
  const normalizedStartDate = normalizeDate(startDate);
  
  // If no end date is provided, the reward is available indefinitely after the start date
  if (!endDate) {
    return isAfter(now, normalizedStartDate) || isEqual(now, normalizedStartDate);
  }
  
  const normalizedEndDate = normalizeDate(endDate);
  
  return (
    (isAfter(now, normalizedStartDate) || isEqual(now, normalizedStartDate)) &&
    (isBefore(now, normalizedEndDate) || isEqual(now, normalizedEndDate))
  );
}

/**
 * Calculates the reward expiration date based on the issue date and validity period
 * @param issueDate - Date when the reward was issued
 * @param validityInDays - Validity period in days
 * @returns Reward expiration date
 */
export function calculateRewardExpiration(issueDate: DateInput, validityInDays: number): Date {
  if (validityInDays < 0) {
    throw new Error('Validity period cannot be negative');
  }
  
  const normalizedIssueDate = normalizeDate(issueDate);
  return addDays(normalizedIssueDate, validityInDays);
}

/**
 * Checks if a reward has expired
 * @param expirationDate - Reward expiration date
 * @returns True if the reward has expired
 */
export function hasRewardExpired(expirationDate: DateInput): boolean {
  const now = new Date();
  const normalizedExpirationDate = normalizeDate(expirationDate);
  
  return isAfter(now, normalizedExpirationDate);
}

/**
 * Formats a date according to journey-specific requirements
 * @param date - Date to format
 * @param journeyType - Type of journey (health, care, plan)
 * @param locale - Locale for formatting (defaults to pt-BR)
 * @returns Formatted date string according to journey requirements
 */
export function formatJourneyDate(date: DateInput, journeyType: JourneyType, locale = DEFAULT_LOCALE): string {
  try {
    const normalizedDate = normalizeDate(date);
    
    // Different journeys may have different date format requirements
    switch (journeyType) {
      case 'health':
        return format(normalizedDate, 'dd/MM/yyyy', { 
          locale: LOCALE_MAPPING[locale] || LOCALE_MAPPING[DEFAULT_LOCALE]
        });
      case 'care':
        return format(normalizedDate, 'dd/MM/yyyy HH:mm', { 
          locale: LOCALE_MAPPING[locale] || LOCALE_MAPPING[DEFAULT_LOCALE]
        });
      case 'plan':
        return format(normalizedDate, 'dd/MM/yyyy', { 
          locale: LOCALE_MAPPING[locale] || LOCALE_MAPPING[DEFAULT_LOCALE]
        });
      default:
        return format(normalizedDate, 'dd/MM/yyyy', { 
          locale: LOCALE_MAPPING[locale] || LOCALE_MAPPING[DEFAULT_LOCALE]
        });
    }
  } catch (error) {
    console.error('Error formatting journey date:', error);
    return 'Invalid date';
  }
}

/**
 * Calculates the achievement notification expiration time
 * @param notificationTime - Time when the notification was created
 * @param expirationInHours - Expiration period in hours (defaults to 24)
 * @returns Notification expiration date
 */
export function calculateNotificationExpiration(notificationTime: DateInput, expirationInHours = 24): Date {
  if (expirationInHours <= 0) {
    throw new Error('Notification expiration period must be greater than zero');
  }
  
  const normalizedTime = normalizeDate(notificationTime);
  return addHours(normalizedTime, expirationInHours);
}

/**
 * Checks if a notification has expired
 * @param expirationDate - Notification expiration date
 * @returns True if the notification has expired
 */
export function hasNotificationExpired(expirationDate: DateInput): boolean {
  const now = new Date();
  const normalizedExpirationDate = normalizeDate(expirationDate);
  
  return isAfter(now, normalizedExpirationDate);
}

/**
 * Calculates the achievement visualization period
 * @param achievementDate - Date when the achievement was earned
 * @param visualizationDays - Number of days to highlight the achievement (defaults to 7)
 * @returns End date of the visualization period
 */
export function calculateAchievementVisualizationPeriod(achievementDate: DateInput, visualizationDays = 7): Date {
  if (visualizationDays <= 0) {
    throw new Error('Visualization period must be greater than zero');
  }
  
  const normalizedDate = normalizeDate(achievementDate);
  return addDays(normalizedDate, visualizationDays);
}

/**
 * Checks if an achievement is still in its visualization period
 * @param achievementDate - Date when the achievement was earned
 * @param visualizationDays - Number of days to highlight the achievement (defaults to 7)
 * @returns True if the achievement is still in its visualization period
 */
export function isAchievementInVisualizationPeriod(achievementDate: DateInput, visualizationDays = 7): boolean {
  const now = new Date();
  const normalizedAchievementDate = normalizeDate(achievementDate);
  const visualizationEndDate = calculateAchievementVisualizationPeriod(normalizedAchievementDate, visualizationDays);
  
  return isBefore(now, visualizationEndDate) || isEqual(now, visualizationEndDate);
}

/**
 * Calculates the time elapsed since an achievement was earned
 * @param achievementDate - Date when the achievement was earned
 * @returns Object containing elapsed time in different units
 */
export function calculateTimeElapsedSinceAchievement(achievementDate: DateInput): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const normalizedAchievementDate = normalizeDate(achievementDate);
  
  // If achievement date is in the future, return zeros
  if (isAfter(normalizedAchievementDate, now)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }
  
  const days = differenceInDays(now, normalizedAchievementDate);
  const hours = differenceInHours(now, normalizedAchievementDate) % 24;
  const minutes = differenceInMinutes(now, normalizedAchievementDate) % 60;
  const seconds = differenceInSeconds(now, normalizedAchievementDate) % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds,
  };
}