/**
 * API Module Index
 * 
 * This file serves as a central module for exporting all API functions used in the web application.
 * It aggregates the API functions from different modules (auth, care, health, plan, gamification,
 * and notifications) into a single location, making it easier to import and use them throughout
 * the application.
 *
 * All exported functions conform to the interface types defined in @austa/interfaces.
 */

// Import API interface types for proper typing
import { Auth } from '@austa/interfaces/api/auth.api';
import { Care } from '@austa/interfaces/api/care.api';
import { Health } from '@austa/interfaces/api/health.api';
import { Plan } from '@austa/interfaces/api/plan.api';
import { Gamification } from '@austa/interfaces/api/gamification.api';
import { Notification } from '@austa/interfaces/api/notification.api';

// Authentication API functions
export const auth = {
  /** Authenticates a user with email and password */
  login: (email: string, password: string): Promise<Auth.LoginResponse> => (
    import('./auth').then(m => m.login(email, password))
  ),
  
  /** Logs out the current user */
  logout: (): Promise<void> => (
    import('./auth').then(m => m.logout())
  ),
  
  /** Retrieves the profile of the currently authenticated user */
  getProfile: (): Promise<Auth.UserProfile> => (
    import('./auth').then(m => m.getProfile())
  )
};

// Care Journey API functions
export const care = {
  /** Fetches a list of appointments for a given user ID */
  getAppointments: (userId: string): Promise<Care.Appointment[]> => (
    import('./care').then(m => m.getAppointments(userId))
  ),
  
  /** Fetches a single appointment by its ID */
  getAppointment: (id: string): Promise<Care.Appointment> => (
    import('./care').then(m => m.getAppointment(id))
  ),
  
  /** Fetches a list of providers based on specialty and location */
  getProviders: (specialty: string, location: string): Promise<Care.Provider[]> => (
    import('./care').then(m => m.getProviders(specialty, location))
  ),
  
  /** Books a new appointment with the given provider, date, type and reason */
  bookAppointment: (
    providerId: string, 
    dateTime: string, 
    type: string, 
    reason: string
  ): Promise<Care.Appointment> => (
    import('./care').then(m => m.bookAppointment(providerId, dateTime, type, reason))
  ),
  
  /** Cancels an existing appointment with the given ID */
  cancelAppointment: (id: string): Promise<Care.Appointment> => (
    import('./care').then(m => m.cancelAppointment(id))
  )
};

// Health Journey API functions
export const health = {
  /** Fetches health metrics for a specific user, date range, and metric types */
  getHealthMetrics: (
    userId: string, 
    types: string[], 
    startDate: string, 
    endDate: string
  ): Promise<Health.HealthMetric[]> => (
    import('./health').then(m => m.getHealthMetrics(userId, types, startDate, endDate))
  ),
  
  /** Fetches health goals for a specific user */
  getHealthGoals: (userId: string): Promise<Health.HealthGoal[]> => (
    import('./health').then(m => m.getHealthGoals(userId))
  ),
  
  /** Fetches medical history events for a specific user */
  getMedicalHistory: (userId: string): Promise<Health.MedicalEvent[]> => (
    import('./health').then(m => m.getMedicalHistory(userId))
  ),
  
  /** Fetches connected devices for a specific user */
  getConnectedDevices: (userId: string): Promise<Health.DeviceConnection[]> => (
    import('./health').then(m => m.getConnectedDevices(userId))
  ),
  
  /** Creates a new health metric for a specific user */
  createHealthMetric: (
    recordId: string, 
    createMetricDto: Health.CreateHealthMetricDto
  ): Promise<Health.HealthMetric> => (
    import('./health').then(m => m.createHealthMetric(recordId, createMetricDto))
  )
};

// Plan Journey API functions
export const plan = {
  /** Fetches a specific insurance plan by ID */
  getPlan: (planId: string): Promise<Plan.Plan> => (
    import('./plan').then(m => m.getPlan(planId))
  ),
  
  /** Fetches claims for a specific plan, optionally filtered by status */
  getClaims: (planId: string, status?: Plan.ClaimStatus): Promise<Plan.Claim[]> => (
    import('./plan').then(m => m.getClaims(planId, status))
  ),
  
  /** Fetches coverage information for a specific plan */
  getCoverage: (planId: string): Promise<Plan.Coverage> => (
    import('./plan').then(m => m.getCoverage(planId))
  ),
  
  /** Fetches benefits for a specific plan */
  getBenefits: (planId: string): Promise<Plan.Benefit[]> => (
    import('./plan').then(m => m.getBenefits(planId))
  ),
  
  /** Submits a new insurance claim for a specific plan */
  submitClaim: (
    planId: string,
    type: string,
    procedureCode: string,
    providerName: string,
    serviceDate: string,
    amount: number,
    documents?: string[]
  ): Promise<Plan.Claim> => (
    import('./plan').then(m => m.submitClaim(
      planId, type, procedureCode, providerName, serviceDate, amount, documents
    ))
  ),
  
  /** Updates an existing claim with additional information */
  updateClaim: (
    id: string,
    additionalInfo: Record<string, any>
  ): Promise<Plan.Claim> => (
    import('./plan').then(m => m.updateClaim(id, additionalInfo))
  ),
  
  /** Cancels an existing claim */
  cancelClaim: (id: string): Promise<Plan.Claim> => (
    import('./plan').then(m => m.cancelClaim(id))
  ),
  
  /** Uploads a document to an existing claim */
  uploadClaimDocument: (
    claimId: string,
    file: File
  ): Promise<Plan.ClaimDocument> => (
    import('./plan').then(m => m.uploadClaimDocument(claimId, file))
  ),
  
  /** Simulates the cost of a procedure with a specific plan */
  simulateCost: (
    planId: string,
    procedureCode: string,
    providerName?: string
  ): Promise<Plan.CostSimulation> => (
    import('./plan').then(m => m.simulateCost(planId, procedureCode, providerName))
  ),
  
  /** Retrieves the digital insurance card for a specific plan */
  getDigitalCard: (planId: string): Promise<Plan.DigitalCard> => (
    import('./plan').then(m => m.getDigitalCard(planId))
  )
};

// Gamification API functions
export const gamification = {
  /** Retrieves the user's game profile from the gamification engine */
  getGameProfile: (userId: string): Promise<Gamification.GameProfile> => (
    import('./gamification').then(m => m.getGameProfile(userId))
  ),
  
  /** Retrieves all achievements for a user */
  getUserAchievements: (userId: string): Promise<Gamification.Achievement[]> => (
    import('./gamification').then(m => m.getUserAchievements(userId))
  ),
  
  /** Retrieves all active and completed quests for a user */
  getUserQuests: (userId: string): Promise<Gamification.Quest[]> => (
    import('./gamification').then(m => m.getUserQuests(userId))
  ),
  
  /** Retrieves all rewards earned by a user */
  getUserRewards: (userId: string): Promise<Gamification.Reward[]> => (
    import('./gamification').then(m => m.getUserRewards(userId))
  ),
  
  /** Retrieves journey-specific achievements for a user */
  getJourneyAchievements: (userId: string, journey: string): Promise<Gamification.Achievement[]> => (
    import('./gamification').then(m => m.getJourneyAchievements(userId, journey))
  ),
  
  /** Acknowledges an achievement notification as seen by the user */
  acknowledgeAchievement: (userId: string, achievementId: string): Promise<void> => (
    import('./gamification').then(m => m.acknowledgeAchievement(userId, achievementId))
  ),
  
  /** Triggers a gamification event based on user action */
  triggerGamificationEvent: (
    userId: string, 
    eventType: string, 
    eventData: any
  ): Promise<{achievements?: Gamification.Achievement[], rewards?: Gamification.Reward[]}> => (
    import('./gamification').then(m => m.triggerGamificationEvent(userId, eventType, eventData))
  )
};

// Notification API functions
export const notifications = {
  /** Fetches notifications for a user */
  getNotifications: (userId: string): Promise<Notification.UserNotification[]> => (
    import('./notifications').then(m => m.getNotifications(userId))
  ),
  
  /** Marks a notification as read */
  markNotificationAsRead: (notificationId: string): Promise<Notification.UserNotification> => (
    import('./notifications').then(m => m.markNotificationAsRead(notificationId))
  )
};

// For backward compatibility, also export individual functions
// Authentication API functions
export { login, logout, getProfile } from './auth';

// Care Journey API functions
export {
  getAppointments,
  getAppointment,
  getProviders,
  bookAppointment,
  cancelAppointment
} from './care';

// Health Journey API functions
export {
  getHealthMetrics,
  getHealthGoals,
  getMedicalHistory,
  getConnectedDevices,
  createHealthMetric
} from './health';

// Plan Journey API functions
export {
  getPlan,
  getClaims,
  getCoverage,
  getBenefits,
  submitClaim,
  updateClaim,
  cancelClaim,
  uploadClaimDocument,
  simulateCost,
  getDigitalCard
} from './plan';

// Gamification API functions
export {
  getGameProfile,
  getUserAchievements,
  getUserQuests,
  getUserRewards,
  getJourneyAchievements,
  acknowledgeAchievement,
  triggerGamificationEvent
} from './gamification';

// Notification API functions
export { 
  getNotifications, 
  markNotificationAsRead 
} from './notifications';