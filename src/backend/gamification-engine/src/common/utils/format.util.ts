/**
 * Utility functions for formatting and transforming data in the gamification engine.
 * Provides standardized formatting for events, achievements, rewards, and user-facing notifications.
 */

import { JourneyType } from '../interfaces/journey.interface';
import { IEventMetadata } from '../interfaces/event-metadata.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IErrorResponse } from '../interfaces/error.interface';
import { ILeaderboardEntry } from '../interfaces/leaderboard-data.interface';
import { IUserProfile } from '../interfaces/user-profile.interface';
import { IVersioned } from '../interfaces/versioning.interface';

/**
 * Formats an achievement notification for display to the user.
 * @param achievementTitle The title of the achievement
 * @param xpGained The amount of XP gained from the achievement
 * @param journeyType The journey type the achievement belongs to
 * @returns A formatted achievement notification string
 */
export function formatAchievementNotification(
  achievementTitle: string,
  xpGained: number,
  journeyType: JourneyType,
): string {
  const journeyName = getJourneyDisplayName(journeyType);
  return `Parabéns! Você desbloqueou a conquista "${achievementTitle}" na jornada ${journeyName} e ganhou ${xpGained} pontos de experiência!`;
}

/**
 * Formats a reward notification for display to the user.
 * @param rewardTitle The title of the reward
 * @param journeyType The journey type the reward belongs to
 * @param expirationDate Optional expiration date for the reward
 * @returns A formatted reward notification string
 */
export function formatRewardNotification(
  rewardTitle: string,
  journeyType: JourneyType,
  expirationDate?: Date,
): string {
  const journeyName = getJourneyDisplayName(journeyType);
  let notification = `Você desbloqueou a recompensa "${rewardTitle}" na jornada ${journeyName}!`;
  
  if (expirationDate) {
    const formattedDate = formatDate(expirationDate);
    notification += ` Disponível até ${formattedDate}.`;
  }
  
  return notification;
}

/**
 * Formats a date in the Brazilian Portuguese format (DD/MM/YYYY).
 * @param date The date to format
 * @returns A formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Gets the display name for a journey type.
 * @param journeyType The journey type
 * @returns The display name for the journey
 */
export function getJourneyDisplayName(journeyType: JourneyType): string {
  switch (journeyType) {
    case JourneyType.HEALTH:
      return 'Minha Saúde';
    case JourneyType.CARE:
      return 'Cuidar-me Agora';
    case JourneyType.PLAN:
      return 'Meu Plano & Benefícios';
    default:
      return 'Desconhecida';
  }
}

/**
 * Formats a progress percentage for display.
 * @param current The current progress value
 * @param total The total progress value
 * @returns A formatted progress string with percentage
 */
export function formatProgress(current: number, total: number): string {
  if (total <= 0) {
    return '0%';
  }
  
  const percentage = Math.min(Math.round((current / total) * 100), 100);
  return `${percentage}%`;
}

/**
 * Normalizes event data from different journeys to ensure consistent structure.
 * @param eventData The raw event data
 * @param journeyType The journey type
 * @returns Normalized event data with consistent structure
 */
export function normalizeEventData<T extends Record<string, any>>(
  eventData: T,
  journeyType: JourneyType,
): Record<string, any> {
  // Create a base normalized structure
  const normalized: Record<string, any> = {
    journeyType,
    timestamp: new Date().toISOString(),
    ...eventData,
  };

  // Ensure consistent property naming across journeys
  switch (journeyType) {
    case JourneyType.HEALTH:
      // Normalize health-specific fields
      if ('healthMetric' in eventData) {
        normalized.metricType = eventData.healthMetric.type;
        normalized.metricValue = eventData.healthMetric.value;
        normalized.metricUnit = eventData.healthMetric.unit;
      }
      break;
      
    case JourneyType.CARE:
      // Normalize care-specific fields
      if ('appointmentId' in eventData) {
        normalized.referenceId = eventData.appointmentId;
      } else if ('medicationId' in eventData) {
        normalized.referenceId = eventData.medicationId;
      }
      break;
      
    case JourneyType.PLAN:
      // Normalize plan-specific fields
      if ('claimId' in eventData) {
        normalized.referenceId = eventData.claimId;
      } else if ('benefitId' in eventData) {
        normalized.referenceId = eventData.benefitId;
      }
      break;
  }

  return normalized;
}

/**
 * Adds metadata to an event object.
 * @param event The base event object
 * @param metadata The metadata to add
 * @returns The event with added metadata
 */
export function addEventMetadata<T extends IBaseEvent>(
  event: T,
  metadata: Partial<IEventMetadata>,
): T & { metadata: IEventMetadata } {
  const fullMetadata: IEventMetadata = {
    source: metadata.source || 'gamification-engine',
    version: metadata.version || '1.0.0',
    correlationId: metadata.correlationId || generateCorrelationId(),
    timestamp: metadata.timestamp || new Date().toISOString(),
  };

  return {
    ...event,
    metadata: fullMetadata,
  };
}

/**
 * Generates a correlation ID for event tracking.
 * @returns A unique correlation ID
 */
function generateCorrelationId(): string {
  return `gam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a user-friendly achievement description based on achievement criteria.
 * @param achievementType The type of achievement
 * @param criteria The achievement criteria
 * @param journeyType The journey type
 * @returns A user-friendly description of the achievement
 */
export function formatAchievementDescription(
  achievementType: string,
  criteria: Record<string, any>,
  journeyType: JourneyType,
): string {
  const journeyName = getJourneyDisplayName(journeyType);
  
  switch (achievementType) {
    case 'STREAK':
      return `Mantenha uma sequência de ${criteria.days} dias de atividade na jornada ${journeyName}.`;
      
    case 'MILESTONE':
      return `Alcance ${criteria.count} ${criteria.action} na jornada ${journeyName}.`;
      
    case 'COMPLETION':
      return `Complete ${criteria.task} na jornada ${journeyName}.`;
      
    case 'COLLECTION':
      return `Colete ${criteria.count} ${criteria.items} diferentes na jornada ${journeyName}.`;
      
    default:
      return `Conquista especial na jornada ${journeyName}.`;
  }
}

/**
 * Formats leaderboard data for display.
 * @param entries The leaderboard entries
 * @param currentUserId The current user's ID to highlight their position
 * @returns Formatted leaderboard data with user highlighting
 */
export function formatLeaderboardData(
  entries: ILeaderboardEntry[],
  currentUserId: string,
): {
  entries: ILeaderboardEntry[];
  userRank: number | null;
  totalParticipants: number;
} {
  const totalParticipants = entries.length;
  let userRank: number | null = null;
  
  // Find the current user's rank
  const userEntry = entries.find(entry => entry.userId === currentUserId);
  if (userEntry) {
    userRank = userEntry.rank;
  }
  
  return {
    entries,
    userRank,
    totalParticipants,
  };
}

/**
 * Formats a user-friendly error message.
 * @param error The error response object
 * @returns A user-friendly error message
 */
export function formatErrorMessage(error: IErrorResponse): string {
  // Default generic error message
  let message = 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.';
  
  if (error.message) {
    // Use the error message if available
    message = error.message;
  } else if (error.code) {
    // Map error codes to user-friendly messages
    switch (error.code) {
      case 'ACHIEVEMENT_NOT_FOUND':
        message = 'A conquista solicitada não foi encontrada.';
        break;
      case 'REWARD_NOT_FOUND':
        message = 'A recompensa solicitada não foi encontrada.';
        break;
      case 'INVALID_EVENT_FORMAT':
        message = 'O formato do evento é inválido.';
        break;
      case 'USER_NOT_FOUND':
        message = 'Usuário não encontrado.';
        break;
      case 'INSUFFICIENT_POINTS':
        message = 'Pontos insuficientes para esta operação.';
        break;
      case 'ACHIEVEMENT_ALREADY_UNLOCKED':
        message = 'Esta conquista já foi desbloqueada.';
        break;
      case 'REWARD_ALREADY_CLAIMED':
        message = 'Esta recompensa já foi resgatada.';
        break;
      case 'REWARD_EXPIRED':
        message = 'Esta recompensa expirou.';
        break;
    }
  }
  
  return message;
}

/**
 * Serializes an object to JSON with proper handling of dates and circular references.
 * @param data The data to serialize
 * @returns A JSON string representation of the data
 */
export function serializeToJson<T>(data: T): string {
  return JSON.stringify(data, (key, value) => {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  });
  
  // Set to track objects already seen (for circular reference detection)
  const seen = new Set();
}

/**
 * Deserializes a JSON string to an object with proper handling of dates.
 * @param json The JSON string to deserialize
 * @returns The deserialized object
 */
export function deserializeFromJson<T>(json: string): T {
  return JSON.parse(json, (key, value) => {
    // Convert ISO date strings back to Date objects
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
      return new Date(value);
    }
    return value;
  });
}

/**
 * Formats a versioned object by adding or updating version information.
 * @param obj The object to version
 * @param version The version string
 * @returns The object with version information
 */
export function formatVersionedObject<T extends Record<string, any>>(
  obj: T,
  version: string = '1.0.0',
): T & IVersioned {
  return {
    ...obj,
    _version: version,
    _updatedAt: new Date().toISOString(),
  };
}

/**
 * Formats user profile data for display.
 * @param profile The user profile
 * @param includePrivateData Whether to include private data
 * @returns Formatted user profile data
 */
export function formatUserProfile(
  profile: IUserProfile,
  includePrivateData: boolean = false,
): Partial<IUserProfile> {
  // Basic public profile data
  const formattedProfile: Partial<IUserProfile> = {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    level: profile.level,
    xp: profile.xp,
    avatarUrl: profile.avatarUrl,
    achievements: profile.achievements?.length || 0,
    joinedAt: profile.joinedAt,
  };
  
  // Include private data if requested
  if (includePrivateData) {
    formattedProfile.email = profile.email;
    formattedProfile.journeyData = profile.journeyData;
    formattedProfile.preferences = profile.preferences;
    formattedProfile.achievementList = profile.achievementList;
    formattedProfile.rewardList = profile.rewardList;
  }
  
  return formattedProfile;
}