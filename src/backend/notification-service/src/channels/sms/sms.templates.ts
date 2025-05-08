/**
 * SMS Templates for the Notification Service
 * 
 * This file provides journey-specific SMS templates with type-safe interfaces for each supported template.
 * It contains parameterized message templates for health journey (appointment reminders, medication alerts),
 * care journey (provider communications, telemedicine session links), and plan journey (claim status updates,
 * benefit notifications).
 */

import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

/**
 * Base interface for all SMS template parameters
 */
export interface SmsTemplateParams {
  recipientName: string;
  [key: string]: string | number | Date;
}

/**
 * Template validation error
 */
export class TemplateValidationError extends Error {
  constructor(templateId: string, missingParams: string[]) {
    super(`Template validation failed for ${templateId}. Missing parameters: ${missingParams.join(', ')}`);
    this.name = 'TemplateValidationError';
  }
}

/**
 * Health Journey SMS Template Parameter Interfaces
 */
export interface AppointmentReminderParams extends SmsTemplateParams {
  appointmentDate: Date;
  appointmentTime: string;
  providerName: string;
  facilityName: string;
  facilityAddress?: string;
}

export interface MedicationReminderParams extends SmsTemplateParams {
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
}

export interface HealthGoalAchievedParams extends SmsTemplateParams {
  goalName: string;
  achievementDate: Date;
  progressValue?: number;
  nextGoal?: string;
}

export interface DeviceConnectionParams extends SmsTemplateParams {
  deviceName: string;
  connectionStatus: 'connected' | 'disconnected' | 'synced';
  lastSyncDate?: Date;
}

/**
 * Care Journey SMS Template Parameter Interfaces
 */
export interface TelemedicineSessionParams extends SmsTemplateParams {
  sessionDate: Date;
  sessionTime: string;
  providerName: string;
  sessionLink: string;
  preparationInstructions?: string;
}

export interface ProviderMessageParams extends SmsTemplateParams {
  providerName: string;
  messagePreview: string;
  messageDate: Date;
  portalLink: string;
}

export interface SymptomCheckerResultParams extends SmsTemplateParams {
  assessmentDate: Date;
  recommendationType: 'urgent' | 'non-urgent' | 'self-care';
  recommendationSummary: string;
  followUpInstructions?: string;
}

/**
 * Plan Journey SMS Template Parameter Interfaces
 */
export interface ClaimStatusUpdateParams extends SmsTemplateParams {
  claimId: string;
  claimDate: Date;
  newStatus: 'submitted' | 'in_review' | 'approved' | 'denied' | 'payment_pending' | 'completed';
  amountApproved?: number;
  denialReason?: string;
  nextSteps?: string;
}

export interface BenefitReminderParams extends SmsTemplateParams {
  benefitName: string;
  expirationDate: Date;
  benefitValue?: string;
  utilizationPercentage?: number;
}

export interface DocumentRequestParams extends SmsTemplateParams {
  documentType: string;
  requestDate: Date;
  deadlineDate: Date;
  submissionLink: string;
}

/**
 * Gamification SMS Template Parameter Interfaces
 */
export interface AchievementUnlockedParams extends SmsTemplateParams {
  achievementName: string;
  achievementDate: Date;
  pointsEarned: number;
  currentLevel?: number;
  achievementDescription?: string;
}

export interface QuestCompletedParams extends SmsTemplateParams {
  questName: string;
  completionDate: Date;
  rewardName: string;
  rewardValue?: number;
  nextQuestName?: string;
}

/**
 * SMS Templates Service
 * Provides journey-specific SMS templates with type-safe interfaces
 */
@Injectable()
export class SmsTemplatesService {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Validates that all required parameters are present in the provided params object
   * @param templateId The template identifier
   * @param params The parameters provided
   * @param requiredParams Array of required parameter keys
   * @throws TemplateValidationError if any required parameters are missing
   */
  private validateTemplateParams(
    templateId: string,
    params: SmsTemplateParams,
    requiredParams: string[],
  ): void {
    const missingParams = requiredParams.filter(param => {
      return params[param] === undefined || params[param] === null || params[param] === '';
    });

    if (missingParams.length > 0) {
      throw new TemplateValidationError(templateId, missingParams);
    }
  }

  /**
   * Formats a date for display in SMS messages
   * @param date The date to format
   * @param locale The locale to use for formatting
   * @returns Formatted date string
   */
  private formatDate(date: Date, locale = 'en'): string {
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Gets a localized template string
   * @param key The template key
   * @param lang The language code
   * @returns The localized template string
   */
  private getLocalizedTemplate(key: string, lang = 'en'): string {
    try {
      return this.i18nService.translate(`notifications.sms.${key}`, { lang });
    } catch (error) {
      // Fallback templates if translation is not available
      const fallbackTemplates: Record<string, string> = {
        // Health Journey Templates
        'health.appointment_reminder': 'Hi ${recipientName}, reminder: your appointment with ${providerName} is on ${appointmentDate} at ${appointmentTime} at ${facilityName}. Reply CONFIRM to confirm or CANCEL to cancel.',
        'health.medication_reminder': 'Hi ${recipientName}, time to take your ${medicationName} (${dosage}). ${instructions}',
        'health.goal_achieved': 'Congratulations ${recipientName}! You've achieved your health goal: ${goalName} on ${achievementDate}. Keep up the great work!',
        'health.device_connection': 'Hi ${recipientName}, your ${deviceName} has been ${connectionStatus} on ${lastSyncDate}.',
        
        // Care Journey Templates
        'care.telemedicine_session': 'Hi ${recipientName}, your telemedicine session with ${providerName} is scheduled for ${sessionDate} at ${sessionTime}. Join here: ${sessionLink}',
        'care.provider_message': 'Hi ${recipientName}, you have a new message from ${providerName} on ${messageDate}: "${messagePreview}". View in portal: ${portalLink}',
        'care.symptom_checker_result': 'Hi ${recipientName}, based on your symptom assessment (${assessmentDate}): ${recommendationType} care is recommended. ${recommendationSummary}',
        
        // Plan Journey Templates
        'plan.claim_status_update': 'Hi ${recipientName}, your claim #${claimId} from ${claimDate} is now ${newStatus}. ${nextSteps}',
        'plan.benefit_reminder': 'Hi ${recipientName}, your ${benefitName} benefit will expire on ${expirationDate}. Current utilization: ${utilizationPercentage}%.',
        'plan.document_request': 'Hi ${recipientName}, please submit your ${documentType} by ${deadlineDate}. Upload here: ${submissionLink}',
        
        // Gamification Templates
        'gamification.achievement_unlocked': 'Congratulations ${recipientName}! You've unlocked the "${achievementName}" achievement and earned ${pointsEarned} points!',
        'gamification.quest_completed': 'Well done ${recipientName}! You've completed the "${questName}" quest and earned ${rewardName}!',
      };
      
      return fallbackTemplates[key] || `Template for ${key} not found`;
    }
  }

  /**
   * Compiles a template with the provided parameters
   * @param template The template string with placeholders
   * @param params The parameters to inject into the template
   * @returns The compiled template string
   */
  private compileTemplate(template: string, params: SmsTemplateParams): string {
    return template.replace(/\${(\w+)}/g, (match, key) => {
      const value = params[key];
      if (value instanceof Date) {
        return this.formatDate(value);
      }
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * HEALTH JOURNEY TEMPLATES
   */

  /**
   * Generates an appointment reminder SMS message
   * @param params The appointment reminder parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getAppointmentReminderTemplate(params: AppointmentReminderParams, lang = 'en'): string {
    this.validateTemplateParams('health.appointment_reminder', params, [
      'recipientName',
      'appointmentDate',
      'appointmentTime',
      'providerName',
      'facilityName',
    ]);

    const template = this.getLocalizedTemplate('health.appointment_reminder', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a medication reminder SMS message
   * @param params The medication reminder parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getMedicationReminderTemplate(params: MedicationReminderParams, lang = 'en'): string {
    this.validateTemplateParams('health.medication_reminder', params, [
      'recipientName',
      'medicationName',
      'dosage',
      'frequency',
    ]);

    const template = this.getLocalizedTemplate('health.medication_reminder', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a health goal achievement SMS message
   * @param params The health goal achievement parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getHealthGoalAchievedTemplate(params: HealthGoalAchievedParams, lang = 'en'): string {
    this.validateTemplateParams('health.goal_achieved', params, [
      'recipientName',
      'goalName',
      'achievementDate',
    ]);

    const template = this.getLocalizedTemplate('health.goal_achieved', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a device connection status SMS message
   * @param params The device connection parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getDeviceConnectionTemplate(params: DeviceConnectionParams, lang = 'en'): string {
    this.validateTemplateParams('health.device_connection', params, [
      'recipientName',
      'deviceName',
      'connectionStatus',
    ]);

    const template = this.getLocalizedTemplate('health.device_connection', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * CARE JOURNEY TEMPLATES
   */

  /**
   * Generates a telemedicine session SMS message
   * @param params The telemedicine session parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getTelemedicineSessionTemplate(params: TelemedicineSessionParams, lang = 'en'): string {
    this.validateTemplateParams('care.telemedicine_session', params, [
      'recipientName',
      'sessionDate',
      'sessionTime',
      'providerName',
      'sessionLink',
    ]);

    const template = this.getLocalizedTemplate('care.telemedicine_session', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a provider message notification SMS
   * @param params The provider message parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getProviderMessageTemplate(params: ProviderMessageParams, lang = 'en'): string {
    this.validateTemplateParams('care.provider_message', params, [
      'recipientName',
      'providerName',
      'messagePreview',
      'messageDate',
      'portalLink',
    ]);

    const template = this.getLocalizedTemplate('care.provider_message', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a symptom checker result SMS message
   * @param params The symptom checker result parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getSymptomCheckerResultTemplate(params: SymptomCheckerResultParams, lang = 'en'): string {
    this.validateTemplateParams('care.symptom_checker_result', params, [
      'recipientName',
      'assessmentDate',
      'recommendationType',
      'recommendationSummary',
    ]);

    const template = this.getLocalizedTemplate('care.symptom_checker_result', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * PLAN JOURNEY TEMPLATES
   */

  /**
   * Generates a claim status update SMS message
   * @param params The claim status update parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getClaimStatusUpdateTemplate(params: ClaimStatusUpdateParams, lang = 'en'): string {
    this.validateTemplateParams('plan.claim_status_update', params, [
      'recipientName',
      'claimId',
      'claimDate',
      'newStatus',
    ]);

    const template = this.getLocalizedTemplate('plan.claim_status_update', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a benefit reminder SMS message
   * @param params The benefit reminder parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getBenefitReminderTemplate(params: BenefitReminderParams, lang = 'en'): string {
    this.validateTemplateParams('plan.benefit_reminder', params, [
      'recipientName',
      'benefitName',
      'expirationDate',
    ]);

    const template = this.getLocalizedTemplate('plan.benefit_reminder', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a document request SMS message
   * @param params The document request parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getDocumentRequestTemplate(params: DocumentRequestParams, lang = 'en'): string {
    this.validateTemplateParams('plan.document_request', params, [
      'recipientName',
      'documentType',
      'requestDate',
      'deadlineDate',
      'submissionLink',
    ]);

    const template = this.getLocalizedTemplate('plan.document_request', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * GAMIFICATION TEMPLATES
   */

  /**
   * Generates an achievement unlocked SMS message
   * @param params The achievement unlocked parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getAchievementUnlockedTemplate(params: AchievementUnlockedParams, lang = 'en'): string {
    this.validateTemplateParams('gamification.achievement_unlocked', params, [
      'recipientName',
      'achievementName',
      'achievementDate',
      'pointsEarned',
    ]);

    const template = this.getLocalizedTemplate('gamification.achievement_unlocked', lang);
    return this.compileTemplate(template, params);
  }

  /**
   * Generates a quest completed SMS message
   * @param params The quest completed parameters
   * @param lang The language code for localization
   * @returns The formatted SMS message
   */
  getQuestCompletedTemplate(params: QuestCompletedParams, lang = 'en'): string {
    this.validateTemplateParams('gamification.quest_completed', params, [
      'recipientName',
      'questName',
      'completionDate',
      'rewardName',
    ]);

    const template = this.getLocalizedTemplate('gamification.quest_completed', lang);
    return this.compileTemplate(template, params);
  }
}