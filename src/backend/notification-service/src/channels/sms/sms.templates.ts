/**
 * SMS Templates for the Notification Service
 * 
 * This file provides journey-specific SMS templates with type-safe interfaces for each supported template.
 * It contains parameterized message templates for health journey (appointment reminders, medication alerts),
 * care journey (provider communications, telemedicine session links), and plan journey (claim status updates,
 * benefit notifications).
 */

import { JourneyType } from '@austa/interfaces';

/**
 * Base interface for all SMS template parameters
 */
export interface ISmsTemplateParams {
  userName: string;
  journeyType: JourneyType;
}

/**
 * Health Journey SMS Template Parameters
 */
export interface IHealthSmsTemplateParams extends ISmsTemplateParams {
  journeyType: JourneyType.HEALTH;
}

/**
 * Health Goal SMS Template Parameters
 */
export interface IHealthGoalSmsTemplateParams extends IHealthSmsTemplateParams {
  goalName: string;
  goalProgress: string;
  goalTarget: string;
}

/**
 * Health Metric SMS Template Parameters
 */
export interface IHealthMetricSmsTemplateParams extends IHealthSmsTemplateParams {
  metricName: string;
  metricValue: string;
  metricUnit: string;
  metricStatus?: 'normal' | 'warning' | 'critical';
}

/**
 * Health Device SMS Template Parameters
 */
export interface IHealthDeviceSmsTemplateParams extends IHealthSmsTemplateParams {
  deviceName: string;
  deviceStatus: string;
  lastSyncTime: string;
}

/**
 * Care Journey SMS Template Parameters
 */
export interface ICareSmsTemplateParams extends ISmsTemplateParams {
  journeyType: JourneyType.CARE;
}

/**
 * Care Appointment SMS Template Parameters
 */
export interface ICareAppointmentSmsTemplateParams extends ICareSmsTemplateParams {
  providerName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentLocation?: string;
  appointmentType: string;
}

/**
 * Care Medication SMS Template Parameters
 */
export interface ICareMedicationSmsTemplateParams extends ICareSmsTemplateParams {
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
}

/**
 * Care Telemedicine SMS Template Parameters
 */
export interface ICareTelemedicineSmsTemplateParams extends ICareSmsTemplateParams {
  providerName: string;
  sessionDate: string;
  sessionTime: string;
  sessionLink: string;
  sessionCode?: string;
}

/**
 * Plan Journey SMS Template Parameters
 */
export interface IPlanSmsTemplateParams extends ISmsTemplateParams {
  journeyType: JourneyType.PLAN;
}

/**
 * Plan Claim SMS Template Parameters
 */
export interface IPlanClaimSmsTemplateParams extends IPlanSmsTemplateParams {
  claimId: string;
  claimStatus: string;
  claimAmount?: string;
  claimDate: string;
  serviceType: string;
}

/**
 * Plan Benefit SMS Template Parameters
 */
export interface IPlanBenefitSmsTemplateParams extends IPlanSmsTemplateParams {
  benefitName: string;
  benefitStatus: string;
  benefitDetails?: string;
  expirationDate?: string;
}

/**
 * Plan Coverage SMS Template Parameters
 */
export interface IPlanCoverageSmsTemplateParams extends IPlanSmsTemplateParams {
  coverageType: string;
  coverageStatus: string;
  coverageDetails: string;
  renewalDate?: string;
}

/**
 * Gamification SMS Template Parameters
 */
export interface IGamificationSmsTemplateParams extends ISmsTemplateParams {
  journeyType: JourneyType.GAMIFICATION;
  achievementName: string;
  achievementDescription?: string;
  pointsEarned?: string;
  currentLevel?: string;
}

/**
 * Type representing all possible SMS template parameter types
 */
export type SmsTemplateParams =
  | IHealthGoalSmsTemplateParams
  | IHealthMetricSmsTemplateParams
  | IHealthDeviceSmsTemplateParams
  | ICareAppointmentSmsTemplateParams
  | ICareMedicationSmsTemplateParams
  | ICareTelemedicineSmsTemplateParams
  | IPlanClaimSmsTemplateParams
  | IPlanBenefitSmsTemplateParams
  | IPlanCoverageSmsTemplateParams
  | IGamificationSmsTemplateParams;

/**
 * Template key type for type-safe template access
 */
export type SmsTemplateKey =
  // Health Journey Templates
  | 'health.goal.achieved'
  | 'health.goal.progress'
  | 'health.metric.alert'
  | 'health.device.sync'
  | 'health.device.disconnected'
  // Care Journey Templates
  | 'care.appointment.reminder'
  | 'care.appointment.confirmation'
  | 'care.appointment.reschedule'
  | 'care.medication.reminder'
  | 'care.telemedicine.link'
  // Plan Journey Templates
  | 'plan.claim.status'
  | 'plan.claim.approved'
  | 'plan.claim.rejected'
  | 'plan.benefit.expiring'
  | 'plan.coverage.renewal'
  // Gamification Templates
  | 'gamification.achievement.unlocked'
  | 'gamification.level.up';

/**
 * Interface for SMS template definition
 */
export interface ISmsTemplate<T extends SmsTemplateParams> {
  key: SmsTemplateKey;
  template: string;
  requiredParams: (keyof T)[];
  validateParams: (params: T) => boolean;
}

/**
 * Validates that all required parameters are present in the params object
 * @param params The parameters to validate
 * @param requiredParams Array of required parameter keys
 * @returns True if all required parameters are present, false otherwise
 */
const validateRequiredParams = <T extends SmsTemplateParams>(
  params: T,
  requiredParams: (keyof T)[],
): boolean => {
  return requiredParams.every(param => {
    const value = params[param];
    return value !== undefined && value !== null && value !== '';
  });
};

/**
 * Health Journey SMS Templates
 */
export const healthSmsTemplates: {
  [key: string]: ISmsTemplate<IHealthGoalSmsTemplateParams | IHealthMetricSmsTemplateParams | IHealthDeviceSmsTemplateParams>;
} = {
  'health.goal.achieved': {
    key: 'health.goal.achieved',
    template: 'Parabéns, {{userName}}! Você atingiu seu objetivo de {{goalName}}: {{goalTarget}}. Continue com o bom trabalho!',
    requiredParams: ['userName', 'goalName', 'goalTarget'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'goalName', 'goalTarget']),
  },
  'health.goal.progress': {
    key: 'health.goal.progress',
    template: '{{userName}}, você está progredindo bem em seu objetivo de {{goalName}}. Progresso atual: {{goalProgress}} de {{goalTarget}}.',
    requiredParams: ['userName', 'goalName', 'goalProgress', 'goalTarget'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'goalName', 'goalProgress', 'goalTarget']),
  },
  'health.metric.alert': {
    key: 'health.metric.alert',
    template: 'Alerta de saúde: {{userName}}, seu {{metricName}} está {{metricValue}} {{metricUnit}}. {{#if metricStatus}}Status: {{metricStatus}}.{{/if}} Por favor, verifique o aplicativo para mais detalhes.',
    requiredParams: ['userName', 'metricName', 'metricValue', 'metricUnit'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'metricName', 'metricValue', 'metricUnit']),
  },
  'health.device.sync': {
    key: 'health.device.sync',
    template: '{{userName}}, seu dispositivo {{deviceName}} foi sincronizado com sucesso. Último sincronismo: {{lastSyncTime}}.',
    requiredParams: ['userName', 'deviceName', 'lastSyncTime'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'deviceName', 'lastSyncTime']),
  },
  'health.device.disconnected': {
    key: 'health.device.disconnected',
    template: '{{userName}}, seu dispositivo {{deviceName}} está desconectado desde {{lastSyncTime}}. Por favor, reconecte para continuar monitorando sua saúde.',
    requiredParams: ['userName', 'deviceName', 'lastSyncTime'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'deviceName', 'lastSyncTime']),
  },
};

/**
 * Care Journey SMS Templates
 */
export const careSmsTemplates: {
  [key: string]: ISmsTemplate<ICareAppointmentSmsTemplateParams | ICareMedicationSmsTemplateParams | ICareTelemedicineSmsTemplateParams>;
} = {
  'care.appointment.reminder': {
    key: 'care.appointment.reminder',
    template: 'Lembrete: {{userName}}, você tem uma consulta {{appointmentType}} com {{providerName}} em {{appointmentDate}} às {{appointmentTime}}{{#if appointmentLocation}} em {{appointmentLocation}}{{/if}}.',
    requiredParams: ['userName', 'appointmentType', 'providerName', 'appointmentDate', 'appointmentTime'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'appointmentType', 'providerName', 'appointmentDate', 'appointmentTime']),
  },
  'care.appointment.confirmation': {
    key: 'care.appointment.confirmation',
    template: 'Confirmado: {{userName}}, sua consulta {{appointmentType}} com {{providerName}} está agendada para {{appointmentDate}} às {{appointmentTime}}{{#if appointmentLocation}} em {{appointmentLocation}}{{/if}}.',
    requiredParams: ['userName', 'appointmentType', 'providerName', 'appointmentDate', 'appointmentTime'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'appointmentType', 'providerName', 'appointmentDate', 'appointmentTime']),
  },
  'care.appointment.reschedule': {
    key: 'care.appointment.reschedule',
    template: 'Atualização: {{userName}}, sua consulta {{appointmentType}} com {{providerName}} foi remarcada para {{appointmentDate}} às {{appointmentTime}}{{#if appointmentLocation}} em {{appointmentLocation}}{{/if}}.',
    requiredParams: ['userName', 'appointmentType', 'providerName', 'appointmentDate', 'appointmentTime'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'appointmentType', 'providerName', 'appointmentDate', 'appointmentTime']),
  },
  'care.medication.reminder': {
    key: 'care.medication.reminder',
    template: '{{userName}}, lembrete para tomar {{medicationName}} ({{dosage}}) {{frequency}}{{#if instructions}}. {{instructions}}{{/if}}',
    requiredParams: ['userName', 'medicationName', 'dosage', 'frequency'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'medicationName', 'dosage', 'frequency']),
  },
  'care.telemedicine.link': {
    key: 'care.telemedicine.link',
    template: '{{userName}}, sua teleconsulta com {{providerName}} está agendada para {{sessionDate}} às {{sessionTime}}. Acesse: {{sessionLink}}{{#if sessionCode}} Código: {{sessionCode}}{{/if}}',
    requiredParams: ['userName', 'providerName', 'sessionDate', 'sessionTime', 'sessionLink'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'providerName', 'sessionDate', 'sessionTime', 'sessionLink']),
  },
};

/**
 * Plan Journey SMS Templates
 */
export const planSmsTemplates: {
  [key: string]: ISmsTemplate<IPlanClaimSmsTemplateParams | IPlanBenefitSmsTemplateParams | IPlanCoverageSmsTemplateParams>;
} = {
  'plan.claim.status': {
    key: 'plan.claim.status',
    template: '{{userName}}, o status da sua solicitação #{{claimId}} para {{serviceType}} de {{claimDate}} foi atualizado para: {{claimStatus}}.',
    requiredParams: ['userName', 'claimId', 'serviceType', 'claimDate', 'claimStatus'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'claimId', 'serviceType', 'claimDate', 'claimStatus']),
  },
  'plan.claim.approved': {
    key: 'plan.claim.approved',
    template: '{{userName}}, sua solicitação #{{claimId}} para {{serviceType}} foi APROVADA{{#if claimAmount}} no valor de {{claimAmount}}{{/if}}. Data do serviço: {{claimDate}}.',
    requiredParams: ['userName', 'claimId', 'serviceType', 'claimDate'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'claimId', 'serviceType', 'claimDate']),
  },
  'plan.claim.rejected': {
    key: 'plan.claim.rejected',
    template: '{{userName}}, sua solicitação #{{claimId}} para {{serviceType}} de {{claimDate}} foi NEGADA. Por favor, acesse o aplicativo para mais detalhes.',
    requiredParams: ['userName', 'claimId', 'serviceType', 'claimDate'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'claimId', 'serviceType', 'claimDate']),
  },
  'plan.benefit.expiring': {
    key: 'plan.benefit.expiring',
    template: '{{userName}}, seu benefício {{benefitName}} irá expirar em {{expirationDate}}. Status atual: {{benefitStatus}}{{#if benefitDetails}}. {{benefitDetails}}{{/if}}',
    requiredParams: ['userName', 'benefitName', 'benefitStatus', 'expirationDate'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'benefitName', 'benefitStatus', 'expirationDate']),
  },
  'plan.coverage.renewal': {
    key: 'plan.coverage.renewal',
    template: '{{userName}}, sua cobertura {{coverageType}} está com renovação prevista para {{renewalDate}}. Status atual: {{coverageStatus}}. {{coverageDetails}}',
    requiredParams: ['userName', 'coverageType', 'coverageStatus', 'coverageDetails', 'renewalDate'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'coverageType', 'coverageStatus', 'coverageDetails', 'renewalDate']),
  },
};

/**
 * Gamification SMS Templates
 */
export const gamificationSmsTemplates: {
  [key: string]: ISmsTemplate<IGamificationSmsTemplateParams>;
} = {
  'gamification.achievement.unlocked': {
    key: 'gamification.achievement.unlocked',
    template: 'Parabéns, {{userName}}! Você desbloqueou a conquista "{{achievementName}}"{{#if achievementDescription}}: {{achievementDescription}}{{/if}}{{#if pointsEarned}} e ganhou {{pointsEarned}} pontos!{{/if}}',
    requiredParams: ['userName', 'achievementName'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'achievementName']),
  },
  'gamification.level.up': {
    key: 'gamification.level.up',
    template: 'Parabéns, {{userName}}! Você avançou para o nível {{currentLevel}}! Continue participando para desbloquear mais conquistas e recompensas.',
    requiredParams: ['userName', 'currentLevel'],
    validateParams: (params) => validateRequiredParams(params, ['userName', 'currentLevel']),
  },
};

/**
 * All SMS templates combined
 */
export const smsTemplates: { [key: string]: ISmsTemplate<SmsTemplateParams> } = {
  ...healthSmsTemplates,
  ...careSmsTemplates,
  ...planSmsTemplates,
  ...gamificationSmsTemplates,
};

/**
 * Gets an SMS template by key
 * @param key The template key
 * @returns The SMS template or undefined if not found
 */
export const getSmsTemplate = (key: SmsTemplateKey): ISmsTemplate<SmsTemplateParams> | undefined => {
  return smsTemplates[key];
};

/**
 * Formats an SMS template with the provided parameters
 * @param templateKey The template key
 * @param params The parameters to format the template with
 * @returns The formatted SMS message or null if validation fails
 */
export const formatSmsTemplate = <T extends SmsTemplateParams>(
  templateKey: SmsTemplateKey,
  params: T,
): string | null => {
  const template = getSmsTemplate(templateKey);
  
  if (!template) {
    return null;
  }
  
  // Validate parameters
  if (!template.validateParams(params as any)) {
    return null;
  }
  
  // Format template with parameters
  let formattedMessage = template.template;
  
  // Replace simple placeholders
  Object.entries(params).forEach(([key, value]) => {
    formattedMessage = formattedMessage.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  
  // Handle conditional blocks (simple implementation)
  formattedMessage = formattedMessage.replace(/{{#if ([^}]+)}}([^{]+){{\/if}}/g, (match, condition, content) => {
    const conditionKey = condition.trim();
    const conditionValue = params[conditionKey as keyof T];
    return conditionValue ? content : '';
  });
  
  return formattedMessage;
};