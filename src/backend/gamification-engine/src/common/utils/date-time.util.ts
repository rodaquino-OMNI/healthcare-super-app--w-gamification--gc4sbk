/**
 * Date and time utility functions for the gamification engine.
 * 
 * These utilities handle achievement deadlines, quest durations, reward expiration,
 * and timezone conversions across all gamification components.
 */

import { 
  addDays, 
  addHours, 
  addMonths, 
  addWeeks, 
  differenceInDays, 
  differenceInHours, 
  differenceInMinutes, 
  differenceInSeconds, 
  isAfter, 
  isBefore, 
  isEqual, 
  parseISO, 
  startOfDay, 
  startOfMonth, 
  startOfWeek, 
  endOfDay, 
  endOfMonth, 
  endOfWeek,
  format
} from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

// Import shared date utilities
import { isValidDate } from '@app/utils/date/validation';
import { getLocalTimezone } from '@app/utils/date/timezone';
import { formatDate } from '@app/utils/date/format';
import { DEFAULT_LOCALE } from '@app/utils/date/constants';

/**
 * Supported journey types in the gamification engine
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global'
}

/**
 * Time period types for achievement progress tracking
 */
export enum ProgressPeriodType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom'
}

/**
 * Interface for achievement progress period configuration
 */
export interface ProgressPeriod {
  type: ProgressPeriodType;
  startDate?: Date;
  endDate?: Date;
  durationDays?: number;
}

/**
 * Interface for quest deadline configuration
 */
export interface QuestDeadline {
  startDate: Date;
  endDate: Date;
  gracePeriodHours?: number;
}

/**
 * Interface for reward availability window
 */
export interface RewardAvailability {
  startDate: Date;
  endDate?: Date;
  isExpired: boolean;
}

/**
 * Calculates the start and end dates for an achievement progress period
 * 
 * @param periodType - Type of progress period (day, week, month, custom)
 * @param referenceDate - Reference date for the calculation (defaults to now)
 * @param customDays - Number of days for custom period type
 * @returns Object with start and end dates for the progress period
 */
export function calculateProgressPeriod(
  periodType: ProgressPeriodType,
  referenceDate: Date = new Date(),
  customDays?: number
): { startDate: Date; endDate: Date } {
  if (!isValidDate(referenceDate)) {
    throw new Error('Invalid reference date provided for progress period calculation');
  }

  let startDate: Date;
  let endDate: Date;

  switch (periodType) {
    case ProgressPeriodType.DAY:
      startDate = startOfDay(referenceDate);
      endDate = endOfDay(referenceDate);
      break;
    case ProgressPeriodType.WEEK:
      startDate = startOfWeek(referenceDate, { weekStartsOn: 0 }); // 0 = Sunday
      endDate = endOfWeek(referenceDate, { weekStartsOn: 0 });
      break;
    case ProgressPeriodType.MONTH:
      startDate = startOfMonth(referenceDate);
      endDate = endOfMonth(referenceDate);
      break;
    case ProgressPeriodType.CUSTOM:
      if (!customDays || customDays <= 0) {
        throw new Error('Custom period requires a positive number of days');
      }
      startDate = startOfDay(referenceDate);
      endDate = endOfDay(addDays(referenceDate, customDays - 1));
      break;
    default:
      throw new Error(`Unsupported progress period type: ${periodType}`);
  }

  return { startDate, endDate };
}

/**
 * Determines if a date is within a progress period
 * 
 * @param date - Date to check
 * @param period - Progress period configuration
 * @returns Boolean indicating if the date is within the period
 */
export function isDateInProgressPeriod(date: Date, period: ProgressPeriod): boolean {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided for progress period check');
  }

  let { startDate, endDate } = period;

  // If custom period with duration
  if (period.type === ProgressPeriodType.CUSTOM && period.durationDays && period.startDate) {
    startDate = period.startDate;
    endDate = addDays(startDate, period.durationDays);
  }
  // If standard period without explicit dates
  else if (!startDate || !endDate) {
    const calculatedPeriod = calculateProgressPeriod(period.type, new Date(), period.durationDays);
    startDate = calculatedPeriod.startDate;
    endDate = calculatedPeriod.endDate;
  }

  return (
    (isEqual(date, startDate) || isAfter(date, startDate)) &&
    (isEqual(date, endDate) || isBefore(date, endDate))
  );
}

/**
 * Creates a quest deadline configuration
 * 
 * @param durationDays - Duration of the quest in days
 * @param startDate - Start date of the quest (defaults to now)
 * @param gracePeriodHours - Optional grace period in hours
 * @returns Quest deadline configuration
 */
export function createQuestDeadline(
  durationDays: number,
  startDate: Date = new Date(),
  gracePeriodHours = 0
): QuestDeadline {
  if (!isValidDate(startDate)) {
    throw new Error('Invalid start date provided for quest deadline');
  }

  if (durationDays <= 0) {
    throw new Error('Quest duration must be a positive number of days');
  }

  const endDate = addDays(startDate, durationDays);
  
  return {
    startDate,
    endDate,
    gracePeriodHours
  };
}

/**
 * Checks if a quest is still active based on its deadline
 * 
 * @param deadline - Quest deadline configuration
 * @param currentDate - Current date to check against (defaults to now)
 * @returns Boolean indicating if the quest is still active
 */
export function isQuestActive(deadline: QuestDeadline, currentDate: Date = new Date()): boolean {
  if (!isValidDate(currentDate)) {
    throw new Error('Invalid current date provided for quest activity check');
  }

  const { startDate, endDate, gracePeriodHours = 0 } = deadline;
  const effectiveEndDate = gracePeriodHours > 0 ? addHours(endDate, gracePeriodHours) : endDate;

  return (
    (isEqual(currentDate, startDate) || isAfter(currentDate, startDate)) &&
    (isEqual(currentDate, effectiveEndDate) || isBefore(currentDate, effectiveEndDate))
  );
}

/**
 * Calculates the remaining time for a quest in the most appropriate unit
 * 
 * @param deadline - Quest deadline configuration
 * @param currentDate - Current date (defaults to now)
 * @param locale - Locale for formatting (defaults to system locale)
 * @returns Formatted string with remaining time
 */
export function getQuestRemainingTime(
  deadline: QuestDeadline,
  currentDate: Date = new Date(),
  locale: string = DEFAULT_LOCALE
): string {
  if (!isValidDate(currentDate)) {
    throw new Error('Invalid current date provided for quest remaining time');
  }

  const { endDate, gracePeriodHours = 0 } = deadline;
  const effectiveEndDate = gracePeriodHours > 0 ? addHours(endDate, gracePeriodHours) : endDate;

  if (isAfter(currentDate, effectiveEndDate)) {
    return locale === 'pt-BR' ? 'Expirado' : 'Expired';
  }

  const daysRemaining = differenceInDays(effectiveEndDate, currentDate);
  const hoursRemaining = differenceInHours(effectiveEndDate, currentDate) % 24;
  const minutesRemaining = differenceInMinutes(effectiveEndDate, currentDate) % 60;

  const localeObj = locale === 'pt-BR' ? ptBR : enUS;

  if (daysRemaining > 0) {
    return locale === 'pt-BR'
      ? `${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restante${daysRemaining === 1 ? '' : 's'}`
      : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
  } else if (hoursRemaining > 0) {
    return locale === 'pt-BR'
      ? `${hoursRemaining} ${hoursRemaining === 1 ? 'hora' : 'horas'} restante${hoursRemaining === 1 ? '' : 's'}`
      : `${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'} remaining`;
  } else {
    return locale === 'pt-BR'
      ? `${minutesRemaining} ${minutesRemaining === 1 ? 'minuto' : 'minutos'} restante${minutesRemaining === 1 ? '' : 's'}`
      : `${minutesRemaining} ${minutesRemaining === 1 ? 'minute' : 'minutes'} remaining`;
  }
}

/**
 * Creates a reward availability window
 * 
 * @param startDate - Start date when the reward becomes available
 * @param expirationDays - Number of days until the reward expires (undefined = never expires)
 * @returns Reward availability configuration
 */
export function createRewardAvailability(
  startDate: Date = new Date(),
  expirationDays?: number
): RewardAvailability {
  if (!isValidDate(startDate)) {
    throw new Error('Invalid start date provided for reward availability');
  }

  if (expirationDays !== undefined && expirationDays <= 0) {
    throw new Error('Expiration days must be a positive number');
  }

  const endDate = expirationDays ? addDays(startDate, expirationDays) : undefined;
  const isExpired = endDate ? isAfter(new Date(), endDate) : false;

  return {
    startDate,
    endDate,
    isExpired
  };
}

/**
 * Checks if a reward is currently available
 * 
 * @param availability - Reward availability configuration
 * @param currentDate - Current date to check against (defaults to now)
 * @returns Boolean indicating if the reward is available
 */
export function isRewardAvailable(availability: RewardAvailability, currentDate: Date = new Date()): boolean {
  if (!isValidDate(currentDate)) {
    throw new Error('Invalid current date provided for reward availability check');
  }

  const { startDate, endDate } = availability;

  // Check if current date is after or equal to start date
  const isAfterStart = isEqual(currentDate, startDate) || isAfter(currentDate, startDate);
  
  // If there's no end date, the reward never expires
  if (!endDate) {
    return isAfterStart;
  }
  
  // Check if current date is before or equal to end date
  const isBeforeEnd = isEqual(currentDate, endDate) || isBefore(currentDate, endDate);
  
  return isAfterStart && isBeforeEnd;
}

/**
 * Formats a date for display in the gamification UI
 * 
 * @param date - Date to format
 * @param journeyType - Journey context for formatting
 * @param locale - Locale for formatting (defaults to system locale)
 * @returns Formatted date string
 */
export function formatGameDate(
  date: Date | string,
  journeyType: JourneyType = JourneyType.GLOBAL,
  locale: string = DEFAULT_LOCALE
): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValidDate(dateObj)) {
    throw new Error('Invalid date provided for game date formatting');
  }

  const localeObj = locale === 'pt-BR' ? ptBR : enUS;
  
  // Use different formats based on journey context
  switch (journeyType) {
    case JourneyType.HEALTH:
      return format(dateObj, 'PPP', { locale: localeObj });
    case JourneyType.CARE:
      return format(dateObj, 'PPp', { locale: localeObj });
    case JourneyType.PLAN:
      return format(dateObj, 'P', { locale: localeObj });
    case JourneyType.GLOBAL:
    default:
      return formatDate(dateObj, locale);
  }
}

/**
 * Calculates the expiration date for an achievement based on journey type
 * 
 * @param achievementDate - Base date for the achievement
 * @param journeyType - Journey context for expiration calculation
 * @returns Expiration date for the achievement
 */
export function calculateAchievementExpiration(
  achievementDate: Date = new Date(),
  journeyType: JourneyType = JourneyType.GLOBAL
): Date {
  if (!isValidDate(achievementDate)) {
    throw new Error('Invalid date provided for achievement expiration calculation');
  }

  // Different expiration periods based on journey type
  switch (journeyType) {
    case JourneyType.HEALTH:
      // Health achievements expire after 3 months
      return addMonths(achievementDate, 3);
    case JourneyType.CARE:
      // Care achievements expire after 6 months
      return addMonths(achievementDate, 6);
    case JourneyType.PLAN:
      // Plan achievements expire after 12 months
      return addMonths(achievementDate, 12);
    case JourneyType.GLOBAL:
    default:
      // Global achievements never expire (set to 10 years in the future)
      return addMonths(achievementDate, 120);
  }
}

/**
 * Calculates the time elapsed since an achievement was unlocked
 * 
 * @param unlockedDate - Date when the achievement was unlocked
 * @param currentDate - Current date (defaults to now)
 * @param locale - Locale for formatting (defaults to system locale)
 * @returns Formatted string with elapsed time
 */
export function getAchievementElapsedTime(
  unlockedDate: Date,
  currentDate: Date = new Date(),
  locale: string = DEFAULT_LOCALE
): string {
  if (!isValidDate(unlockedDate) || !isValidDate(currentDate)) {
    throw new Error('Invalid date provided for achievement elapsed time calculation');
  }

  const secondsElapsed = differenceInSeconds(currentDate, unlockedDate);
  const minutesElapsed = differenceInMinutes(currentDate, unlockedDate);
  const hoursElapsed = differenceInHours(currentDate, unlockedDate);
  const daysElapsed = differenceInDays(currentDate, unlockedDate);

  if (daysElapsed > 30) {
    // For older achievements, just show the date
    return formatGameDate(unlockedDate, JourneyType.GLOBAL, locale);
  }

  if (daysElapsed > 0) {
    return locale === 'pt-BR'
      ? `${daysElapsed} ${daysElapsed === 1 ? 'dia' : 'dias'} atrás`
      : `${daysElapsed} ${daysElapsed === 1 ? 'day' : 'days'} ago`;
  }

  if (hoursElapsed > 0) {
    return locale === 'pt-BR'
      ? `${hoursElapsed} ${hoursElapsed === 1 ? 'hora' : 'horas'} atrás`
      : `${hoursElapsed} ${hoursElapsed === 1 ? 'hour' : 'hours'} ago`;
  }

  if (minutesElapsed > 0) {
    return locale === 'pt-BR'
      ? `${minutesElapsed} ${minutesElapsed === 1 ? 'minuto' : 'minutos'} atrás`
      : `${minutesElapsed} ${minutesElapsed === 1 ? 'minute' : 'minutes'} ago`;
  }

  return locale === 'pt-BR' ? 'agora mesmo' : 'just now';
}

/**
 * Converts a date to the user's local timezone
 * 
 * @param date - Date to convert
 * @returns Date object in the user's local timezone
 */
export function toLocalTimezone(date: Date): Date {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided for timezone conversion');
  }

  const localTimezone = getLocalTimezone();
  const dateStr = date.toLocaleString('en-US', { timeZone: localTimezone });
  return new Date(dateStr);
}

/**
 * Checks if a date is today in the user's local timezone
 * 
 * @param date - Date to check
 * @returns Boolean indicating if the date is today
 */
export function isToday(date: Date): boolean {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided for today check');
  }

  const localDate = toLocalTimezone(date);
  const today = new Date();
  
  return (
    localDate.getDate() === today.getDate() &&
    localDate.getMonth() === today.getMonth() &&
    localDate.getFullYear() === today.getFullYear()
  );
}