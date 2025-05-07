import { expect } from '@jest/globals';

/**
 * Verifies that a response contains journey-specific data.
 * 
 * @param response The response to verify
 * @param journey The expected journey ('health', 'care', or 'plan')
 */
export function verifyJourneyResponse(response: any, journey: 'health' | 'care' | 'plan'): void {
  expect(response.body.data).toBeDefined();
  
  // Verify journey-specific data based on the journey type
  switch (journey) {
    case 'health':
      // Health journey should have health-related data
      const hasHealthData = (
        response.body.data.healthMetrics ||
        response.body.data.healthGoals ||
        response.body.data.deviceConnections
      );
      expect(hasHealthData).toBeTruthy();
      break;
    
    case 'care':
      // Care journey should have care-related data
      const hasCareData = (
        response.body.data.appointments ||
        response.body.data.medications ||
        response.body.data.providers
      );
      expect(hasCareData).toBeTruthy();
      break;
    
    case 'plan':
      // Plan journey should have plan-related data
      const hasPlanData = (
        response.body.data.plans ||
        response.body.data.claims ||
        response.body.data.benefits
      );
      expect(hasPlanData).toBeTruthy();
      break;
    
    default:
      throw new Error(`Unknown journey: ${journey}`);
  }
}

/**
 * Verifies that a gamification event has the expected properties.
 * 
 * @param event The event to verify
 * @param expected The expected event properties
 */
export function verifyGamificationEvent(
  event: any,
  expected: {
    type: string;
    userId: string;
    journey?: string;
  }
): void {
  expect(event).toBeDefined();
  expect(event.type).toBe(expected.type);
  expect(event.userId).toBe(expected.userId);
  
  if (expected.journey) {
    expect(event.journey).toBe(expected.journey);
  }
  
  // Verify that the event has data
  expect(event.data).toBeDefined();
  expect(typeof event.data).toBe('object');
}

/**
 * Verifies that a response contains an authentication error.
 * 
 * @param response The response to verify
 */
export function verifyAuthenticationError(response: any): void {
  expect(response.body.errors).toBeDefined();
  expect(response.body.errors.length).toBeGreaterThan(0);
  
  const authError = response.body.errors.find(
    (error: any) => 
      error.message.includes('Unauthorized') ||
      error.message.includes('Authentication required') ||
      error.extensions?.code === 'UNAUTHENTICATED'
  );
  
  expect(authError).toBeDefined();
}

/**
 * Verifies that a response contains cross-journey achievement data.
 * 
 * @param response The response to verify
 */
export function verifyCrossJourneyAchievement(response: any): void {
  expect(response.body.data).toBeDefined();
  expect(response.body.data.achievements).toBeDefined();
  expect(Array.isArray(response.body.data.achievements)).toBe(true);
  
  // Find a cross-journey achievement
  const crossJourneyAchievement = response.body.data.achievements.find(
    (achievement: any) => achievement.journey === 'cross-journey'
  );
  
  expect(crossJourneyAchievement).toBeDefined();
  expect(crossJourneyAchievement.id).toBeDefined();
  expect(crossJourneyAchievement.name).toBeDefined();
  expect(crossJourneyAchievement.unlockedAt).toBeDefined();
}