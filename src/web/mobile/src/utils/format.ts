/**
 * Mobile-specific formatting utilities for the AUSTA SuperApp
 * 
 * This file provides utility functions for formatting data, such as numbers, currency,
 * and phone numbers, specifically tailored for the mobile application. It re-exports
 * formatting functions from the shared utilities to maintain consistency across platforms.
 *
 * @package i18next v23.8.2
 */

import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatJourneyValue,
  formatHealthMetric,
  truncateText,
  formatPhoneNumber,
  formatCPF,
  formatCompactNumber
} from '@app/shared/utils/format';

// Import journey-specific data types from @austa/interfaces for type safety
import { 
  HealthMetricType, 
  HealthMetricUnit 
} from '@austa/interfaces/health';
import { 
  JourneyId 
} from '@austa/interfaces/common';
import { 
  CareAppointmentStatus 
} from '@austa/interfaces/care';
import { 
  PlanClaimStatus, 
  PlanCurrency 
} from '@austa/interfaces/plan';

/**
 * Formats a health metric value with proper error handling and type safety.
 * 
 * @param value - The metric value to format
 * @param metricType - The type of health metric from HealthMetricType
 * @param unit - The unit of measurement from HealthMetricUnit
 * @param locale - The locale to use for formatting
 * @returns The formatted health metric string or empty string on error
 */
export function formatHealthMetricSafe(
  value: number | string,
  metricType: HealthMetricType,
  unit: HealthMetricUnit,
  locale?: string
): string {
  try {
    return formatHealthMetric(value, metricType, unit, locale);
  } catch (error) {
    console.error('Error formatting health metric:', error);
    return typeof value === 'string' ? `${value} ${unit}` : `${value?.toString() || ''} ${unit}`;
  }
}

/**
 * Formats a journey value with proper error handling and type safety.
 * 
 * @param value - The value to format
 * @param journeyId - The journey identifier from JourneyId
 * @param format - The format type (number, currency, percent)
 * @param options - Additional formatting options
 * @returns The journey-formatted value string or empty string on error
 */
export function formatJourneyValueSafe(
  value: number,
  journeyId: JourneyId,
  format: 'number' | 'currency' | 'percent' = 'number',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return formatJourneyValue(value, journeyId, format, options);
  } catch (error) {
    console.error('Error formatting journey value:', error);
    return value?.toString() || '';
  }
}

/**
 * Formats a care appointment status with proper localization.
 * 
 * @param status - The appointment status from CareAppointmentStatus
 * @returns The formatted status string
 */
export function formatAppointmentStatus(status: CareAppointmentStatus): string {
  try {
    // This would typically use i18n.t() for localization
    switch (status) {
      case CareAppointmentStatus.SCHEDULED:
        return 'Agendado';
      case CareAppointmentStatus.CONFIRMED:
        return 'Confirmado';
      case CareAppointmentStatus.COMPLETED:
        return 'Concluído';
      case CareAppointmentStatus.CANCELLED:
        return 'Cancelado';
      case CareAppointmentStatus.MISSED:
        return 'Não compareceu';
      default:
        return status;
    }
  } catch (error) {
    console.error('Error formatting appointment status:', error);
    return status?.toString() || '';
  }
}

/**
 * Formats a plan claim status with proper localization.
 * 
 * @param status - The claim status from PlanClaimStatus
 * @returns The formatted status string
 */
export function formatClaimStatus(status: PlanClaimStatus): string {
  try {
    // This would typically use i18n.t() for localization
    switch (status) {
      case PlanClaimStatus.SUBMITTED:
        return 'Enviado';
      case PlanClaimStatus.IN_REVIEW:
        return 'Em análise';
      case PlanClaimStatus.APPROVED:
        return 'Aprovado';
      case PlanClaimStatus.REJECTED:
        return 'Rejeitado';
      case PlanClaimStatus.PENDING_INFORMATION:
        return 'Pendente de informações';
      default:
        return status;
    }
  } catch (error) {
    console.error('Error formatting claim status:', error);
    return status?.toString() || '';
  }
}

/**
 * Re-export formatting functions from shared utilities.
 * This promotes code reuse and ensures consistent formatting across
 * all platforms while making the functions directly accessible
 * within the mobile application's codebase.
 */
export {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatJourneyValue,
  formatHealthMetric,
  truncateText,
  formatPhoneNumber,
  formatCPF,
  formatCompactNumber
};