/**
 * Kafka topic names used across the AUSTA SuperApp.
 * 
 * This provides a centralized definition of all topic names to ensure
 * consistency between producers and consumers.
 */
export const TOPICS = {
  /**
   * Health journey events.
   */
  HEALTH: {
    /**
     * All health journey events.
     */
    EVENTS: 'health.events',
    
    /**
     * Health metrics recorded by users or devices.
     */
    METRICS: 'health.metrics',
    
    /**
     * Health goals created, updated, or achieved.
     */
    GOALS: 'health.goals',
    
    /**
     * Health device connections and synchronizations.
     */
    DEVICES: 'health.devices',
  },
  
  /**
   * Care journey events.
   */
  CARE: {
    /**
     * All care journey events.
     */
    EVENTS: 'care.events',
    
    /**
     * Appointment booking, rescheduling, and cancellation events.
     */
    APPOINTMENTS: 'care.appointments',
    
    /**
     * Medication adherence and reminder events.
     */
    MEDICATIONS: 'care.medications',
    
    /**
     * Telemedicine session events.
     */
    TELEMEDICINE: 'care.telemedicine',
  },
  
  /**
   * Plan journey events.
   */
  PLAN: {
    /**
     * All plan journey events.
     */
    EVENTS: 'plan.events',
    
    /**
     * Claim submission, processing, and status update events.
     */
    CLAIMS: 'plan.claims',
    
    /**
     * Benefit utilization and eligibility events.
     */
    BENEFITS: 'plan.benefits',
    
    /**
     * Plan selection and comparison events.
     */
    SELECTION: 'plan.selection',
  },
  
  /**
   * User-related events.
   */
  USER: {
    /**
     * All user-related events.
     */
    EVENTS: 'user.events',
    
    /**
     * User registration, login, and profile update events.
     */
    PROFILE: 'user.profile',
    
    /**
     * User preference and settings events.
     */
    PREFERENCES: 'user.preferences',
  },
  
  /**
   * Gamification events.
   */
  GAMIFICATION: {
    /**
     * All gamification events.
     */
    EVENTS: 'game.events',
    
    /**
     * Achievement unlocked events.
     */
    ACHIEVEMENTS: 'game.achievements',
    
    /**
     * Reward earned and redeemed events.
     */
    REWARDS: 'game.rewards',
    
    /**
     * Leaderboard update events.
     */
    LEADERBOARD: 'game.leaderboard',
  },
  
  /**
   * Notification events.
   */
  NOTIFICATIONS: {
    /**
     * All notification events.
     */
    EVENTS: 'notification.events',
    
    /**
     * Push notification events.
     */
    PUSH: 'notification.push',
    
    /**
     * Email notification events.
     */
    EMAIL: 'notification.email',
    
    /**
     * SMS notification events.
     */
    SMS: 'notification.sms',
  },
  
  /**
   * Dead-letter queue for failed messages.
   */
  DEAD_LETTER: 'dead-letter',
};