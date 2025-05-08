/**
 * @file journey-specific-handler.example.ts
 * @description Example of how to use the GamificationJourney decorator in a real service
 * This is not part of the actual codebase, just an example for documentation purposes
 */

import { Injectable } from '@nestjs/common';
import { EventsService } from '../../../events/events.service';
import { AchievementsService } from '../../../achievements/achievements.service';
import { ProfilesService } from '../../../profiles/profiles.service';
import { GamificationJourney, HealthJourney, CareJourney, PlanJourney } from '../gamification-journey.decorator';
import { IHealthEvent, ICareEvent, IPlanEvent, GamificationEvent } from '../../../events/interfaces/event.interface';

/**
 * Example service that handles events from different journeys
 */
@Injectable()
export class JourneyEventHandlerService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly achievementsService: AchievementsService,
    private readonly profilesService: ProfilesService
  ) {}

  /**
   * Process any event regardless of journey
   * This method will be called for all events
   */
  async processEvent(event: GamificationEvent): Promise<void> {
    // Log the event
    console.log(`Processing event: ${event.type} for user ${event.userId}`);
    
    // Update user's last activity timestamp
    await this.profilesService.updateLastActivity(event.userId);
  }

  /**
   * Handle health metrics events
   * This method will only be called for events from the Health journey
   */
  @HealthJourney()
  async handleHealthMetricEvent(event: IHealthEvent): Promise<void> {
    if (!event.payload.data.metric) {
      return;
    }

    const { metric } = event.payload.data;
    
    // Process health metric
    console.log(`Processing health metric: ${metric.type} with value ${metric.value}${metric.unit}`);
    
    // Check for achievements
    await this.achievementsService.checkHealthMetricAchievements(event.userId, metric);
  }

  /**
   * Handle appointment events
   * This method will only be called for events from the Care journey
   */
  @CareJourney()
  async handleAppointmentEvent(event: ICareEvent): Promise<void> {
    if (!event.payload.data.appointment) {
      return;
    }

    const { appointment } = event.payload.data;
    
    // Process appointment
    console.log(`Processing appointment: ${appointment.id} with status ${appointment.status}`);
    
    // Check for achievements
    if (appointment.status === 'completed') {
      await this.achievementsService.checkAppointmentCompletedAchievements(event.userId, appointment);
    }
  }

  /**
   * Handle claim events
   * This method will only be called for events from the Plan journey
   */
  @PlanJourney()
  async handleClaimEvent(event: IPlanEvent): Promise<void> {
    if (!event.payload.data.claim) {
      return;
    }

    const { claim } = event.payload.data;
    
    // Process claim
    console.log(`Processing claim: ${claim.id} with status ${claim.status}`);
    
    // Check for achievements
    if (claim.status === 'approved') {
      await this.achievementsService.checkClaimApprovedAchievements(event.userId, claim);
    }
  }

  /**
   * Handle high-priority events from any journey
   * This method will be called for events from any journey, but with high priority
   */
  @GamificationJourney({ allJourneys: true, priority: 10 })
  async handleHighPriorityEvent(event: GamificationEvent): Promise<void> {
    // Check if this is a high-priority event
    const highPriorityEventTypes = [
      'FIRST_LOGIN',
      'ACCOUNT_CREATED',
      'EMERGENCY_ALERT',
      'CRITICAL_HEALTH_READING'
    ];

    if (highPriorityEventTypes.includes(event.type)) {
      console.log(`Processing high-priority event: ${event.type}`);
      
      // Special handling for high-priority events
      await this.eventsService.markAsHighPriority(event.id);
    }
  }

  /**
   * Handle events from both Health and Care journeys
   * This method will be called for events from either the Health or Care journey
   */
  @GamificationJourney({ journeys: ['health', 'care'] })
  async handleHealthAndCareEvent(event: IHealthEvent | ICareEvent): Promise<void> {
    // Process events that are relevant to both health and care journeys
    console.log(`Processing health/care event: ${event.type}`);
    
    // Check for cross-journey achievements
    await this.achievementsService.checkCrossJourneyAchievements(event.userId, event);
  }
}