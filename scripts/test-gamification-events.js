#!/usr/bin/env node

// Make this script executable with: chmod +x scripts/test-gamification-events.js

/**
 * Gamification Events Integration Test
 * 
 * This script tests the gamification event architecture by simulating events
 * from all three journeys (Health, Care, Plan) and verifying that XP and
 * achievements are correctly updated. It also tests cross-journey achievements
 * and the event retry and error handling mechanisms.
 * 
 * Usage:
 *   node scripts/test-gamification-events.js
 * 
 * Environment variables:
 *   GAMIFICATION_API - Base URL for the gamification API (default: http://localhost:3005)
 *   TEST_USER_ID - UUID of the test user (default: 123e4567-e89b-12d3-a456-426614174000)
 *   VERBOSE - Set to 'true' for detailed logging (default: false)
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.GAMIFICATION_API || 'http://localhost:3005';
const TEST_USER_ID = process.env.TEST_USER_ID || '123e4567-e89b-12d3-a456-426614174000';
const VERBOSE = process.env.VERBOSE === 'true';
const RETRY_DELAY = 500; // ms
const MAX_RETRIES = 3;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Logs a message with optional color
 * @param {string} message - The message to log
 * @param {string} color - Optional color code
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Logs a verbose message if VERBOSE is true
 * @param {string} message - The message to log
 */
function logVerbose(message) {
  if (VERBOSE) {
    log(message, colors.dim);
  }
}

/**
 * Fetches the user profile from the gamification API
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object>} The user profile
 */
async function fetchUserProfile(userId) {
  try {
    const response = await axios.get(`${API_URL}/api/profiles/${userId}`);
    return response.data;
  } catch (error) {
    log(`Error fetching user profile: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Sends an event to the gamification API with enhanced retry logic
 * @param {Object} event - The event to send
 * @param {number} retryCount - Current retry attempt (default: 0)
 * @param {boolean} testDeadLetter - Whether to test dead letter queue functionality
 * @returns {Promise<Object>} The API response
 */
async function sendEvent(event, retryCount = 0, testDeadLetter = false) {
  try {
    // Add correlation ID for tracing requests through the system
    const correlationId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const headers = {
      'X-Correlation-ID': correlationId,
      'Content-Type': 'application/json'
    };
    
    // If testing dead letter queue, add special header to simulate persistent failure
    if (testDeadLetter) {
      headers['X-Test-DLQ'] = 'true';
    }
    
    logVerbose(`Sending event with correlation ID: ${correlationId}`);
    
    const response = await axios.post(`${API_URL}/api/events`, event, { headers });
    return response.data;
  } catch (error) {
    // Handle different error scenarios with appropriate retry strategies
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const errorData = error.response.data || {};
      
      // Rate limiting (429) - implement exponential backoff
      if (status === 429 && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        log(`Rate limited. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`, colors.yellow);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendEvent(event, retryCount + 1, testDeadLetter);
      }
      
      // Server errors (5xx) - retry with linear backoff
      else if (status >= 500 && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * (retryCount + 1);
        log(`Server error (${status}). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`, colors.yellow);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendEvent(event, retryCount + 1, testDeadLetter);
      }
      
      // Validation errors (400) - no retry, these won't succeed on retry
      else if (status === 400) {
        log(`Validation error: ${errorData.message || 'Invalid request'}`, colors.red);
        logVerbose(`Validation details: ${JSON.stringify(errorData)}`);
        throw new Error(`Validation error: ${errorData.message || 'Invalid request'}`);
      }
      
      // Authentication errors (401, 403) - no retry, credentials won't change
      else if (status === 401 || status === 403) {
        log(`Authentication error (${status}): ${errorData.message || 'Unauthorized'}`, colors.red);
        throw new Error(`Authentication error: ${errorData.message || 'Unauthorized'}`);
      }
      
      // Other client errors or max retries reached
      else {
        log(`Error sending event (${status}): ${errorData.message || error.message}`, colors.red);
        if (errorData) {
          logVerbose(`Response data: ${JSON.stringify(errorData)}`);
        }
        throw error;
      }
    } 
    // Network errors - retry with exponential backoff
    else if (error.request && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      log(`Network error. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`, colors.yellow);
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendEvent(event, retryCount + 1, testDeadLetter);
    } 
    // Other errors
    else {
      log(`Unexpected error: ${error.message}`, colors.red);
      throw error;
    }
  }
}

/**
 * Waits for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a standardized event object
 * @param {string} type - Event type
 * @param {string} journey - Journey name (health, care, plan)
 * @param {Object} data - Event data
 * @returns {Object} The event object
 */
function createEvent(type, journey, data) {
  return {
    type,
    userId: TEST_USER_ID,
    journey,
    data
  };
}

/**
 * Main test function
 */
async function runTest() {
  log('\n🎮 GAMIFICATION EVENTS INTEGRATION TEST', colors.bright + colors.cyan);
  log(`API URL: ${API_URL}`);
  log(`Test User ID: ${TEST_USER_ID}\n`);

  try {
    // Fetch initial profile
    log('Fetching initial user profile...', colors.cyan);
    const initialProfile = await fetchUserProfile(TEST_USER_ID);
    log(`Initial XP: ${initialProfile.xp}`, colors.green);
    log(`Initial Level: ${initialProfile.level}`, colors.green);
    log(`Initial Achievements: ${initialProfile.achievements?.length || 0}`, colors.green);
    
    if (VERBOSE && initialProfile.achievements?.length > 0) {
      log('Initial Achievements:', colors.dim);
      initialProfile.achievements.forEach(achievement => {
        log(`  - ${achievement.name} (${achievement.journey})`, colors.dim);
      });
    }
    
    log('\n📊 SENDING JOURNEY EVENTS', colors.bright + colors.magenta);
    
    // Define test events for each journey
    const events = [
      // Health Journey Events
      {
        type: 'HEALTH_METRIC_RECORDED',
        journey: 'health',
        data: {
          metricType: 'STEPS',
          value: 10000,
          unit: 'count',
          date: new Date().toISOString(),
          source: 'MANUAL_ENTRY'
        },
        expectedXp: 10,
        description: 'Record steps (Health journey)'
      },
      {
        type: 'HEALTH_GOAL_ACHIEVED',
        journey: 'health',
        data: {
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 10500,
          completionDate: new Date().toISOString(),
          streakCount: 1
        },
        expectedXp: 50,
        description: 'Achieve steps goal (Health journey)'
      },
      {
        type: 'DEVICE_CONNECTED',
        journey: 'health',
        data: {
          deviceType: 'SMARTWATCH',
          deviceName: 'Fitbit Versa 3',
          connectionDate: new Date().toISOString(),
          deviceId: 'dev-' + Math.random().toString(36).substring(2, 10)
        },
        expectedXp: 25,
        description: 'Connect wearable device (Health journey)'
      },
      
      // Care Journey Events
      {
        type: 'APPOINTMENT_BOOKED',
        journey: 'care',
        data: {
          providerId: '789-456-123',
          specialtyType: 'CARDIOLOGY',
          appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          isFirstAppointment: true,
          appointmentType: 'IN_PERSON',
          locationId: 'loc-' + Math.random().toString(36).substring(2, 10)
        },
        expectedXp: 15,
        description: 'Book medical appointment (Care journey)'
      },
      {
        type: 'MEDICATION_ADHERENCE_RECORDED',
        journey: 'care',
        data: {
          medicationId: 'med-123',
          medicationName: 'Lisinopril',
          dosage: '10mg',
          adherenceDate: new Date().toISOString(),
          adherenceStreak: 7, // One week streak
          medicationType: 'PRESCRIPTION',
          scheduledTime: new Date().toISOString().split('T')[0] + 'T08:00:00Z'
        },
        expectedXp: 5,
        description: 'Record medication adherence (Care journey)'
      },
      {
        type: 'TELEMEDICINE_SESSION_COMPLETED',
        journey: 'care',
        data: {
          sessionId: 'tele-456',
          providerId: '789-456-123',
          durationMinutes: 15,
          completionDate: new Date().toISOString(),
          rating: 5,
          followUpRequired: false
        },
        expectedXp: 30,
        description: 'Complete telemedicine session (Care journey)'
      },
      
      // Plan Journey Events
      {
        type: 'CLAIM_SUBMITTED',
        journey: 'plan',
        data: {
          claimId: 'claim-789',
          claimType: 'MEDICAL',
          claimAmount: 150.75,
          submissionDate: new Date().toISOString(),
          providerName: 'City Medical Center',
          receiptUploaded: true,
          coverageId: 'cov-' + Math.random().toString(36).substring(2, 10)
        },
        expectedXp: 20,
        description: 'Submit insurance claim (Plan journey)'
      },
      {
        type: 'BENEFIT_UTILIZED',
        journey: 'plan',
        data: {
          benefitId: 'benefit-101',
          benefitType: 'WELLNESS',
          benefitName: 'Gym Membership Discount',
          utilizationDate: new Date().toISOString(),
          savingsAmount: 25.00,
          locationName: 'City Fitness Center'
        },
        expectedXp: 15,
        description: 'Utilize wellness benefit (Plan journey)'
      },
      {
        type: 'PLAN_REVIEW_COMPLETED',
        journey: 'plan',
        data: {
          planId: 'plan-202',
          reviewType: 'ANNUAL',
          completionDate: new Date().toISOString(),
          changesRecommended: true,
          reviewDurationMinutes: 10
        },
        expectedXp: 25,
        description: 'Complete plan review (Plan journey)'
      },
      
      // Cross-Journey Event (triggers achievements across multiple journeys)
      {
        type: 'WELLNESS_PROGRAM_MILESTONE',
        journey: 'health', // Primary journey is health
        data: {
          programId: 'wellness-123',
          milestoneName: 'Complete Health Assessment',
          milestoneDate: new Date().toISOString(),
          journeysImpacted: ['health', 'care', 'plan'], // Affects all journeys
          rewardPoints: 100
        },
        expectedXp: 100,
        description: 'Complete wellness program milestone (Cross-journey)'
      },
      
      // Test event versioning with an older schema version
      {
        type: 'HEALTH_METRIC_RECORDED',
        journey: 'health',
        data: {
          // Old schema format (v1) - missing 'source' field that's required in v2
          metricType: 'WEIGHT',
          value: 70.5,
          unit: 'kg',
          date: new Date().toISOString(),
          __schemaVersion: '1.0' // Explicitly mark as old version
        },
        expectedXp: 10,
        description: 'Record weight with old schema version (Testing backward compatibility)'
      },
      
      // Test dead letter queue functionality
      {
        type: 'HEALTH_METRIC_RECORDED',
        journey: 'health',
        data: {
          metricType: 'BLOOD_PRESSURE',
          value: '120/80',
          unit: 'mmHg',
          date: new Date().toISOString(),
          source: 'MANUAL_ENTRY',
          __testDLQ: true // Special flag to test DLQ
        },
        expectedXp: 0, // Should go to DLQ, not award points
        testDeadLetter: true,
        expectError: true,
        description: 'Test dead letter queue functionality (Simulated persistent failure)'
      },
      
      // Test error handling with an invalid event
      {
        type: 'INVALID_EVENT_TYPE',
        journey: 'health',
        data: {
          someField: 'someValue'
        },
        expectError: true,
        description: 'Test invalid event type handling'
      }
    ];
    
    // Send events and track results
    const results = [];
    let totalXpGained = 0;
    
    for (const [index, eventConfig] of events.entries()) {
      const { type, journey, data, expectedXp, expectError } = eventConfig;
      const event = createEvent(type, journey, data);
      
      log(`\nEvent ${index + 1}/${events.length}: ${type} (${journey})`, colors.yellow);
      logVerbose(`Event data: ${JSON.stringify(data)}`);
      
      log(`Description: ${eventConfig.description || 'No description'}`, colors.cyan);
      
      try {
        const result = await sendEvent(event, 0, eventConfig.testDeadLetter);
        
        if (expectError) {
          log(`❌ Expected error but got success for ${type}`, colors.red);
          results.push({ type, success: false, error: 'Expected error but got success' });
        } else {
          const xpGained = result.points || 0;
          totalXpGained += xpGained;
          
          log(`✅ Event processed successfully`, colors.green);
          log(`XP gained: ${xpGained}`, colors.green);
          
          if (xpGained !== expectedXp) {
            log(`⚠️ Warning: Expected ${expectedXp} XP but got ${xpGained} XP`, colors.yellow);
          }
          
          if (result.achievements && result.achievements.length > 0) {
            log(`🏆 Achievements unlocked: ${result.achievements.length}`, colors.green);
            result.achievements.forEach(achievement => {
              log(`  - ${achievement.name} (${achievement.journey})`, colors.green);
            });
          }
          
          // Check for cross-journey impact
          if (result.journeysImpacted && result.journeysImpacted.length > 1) {
            log(`🌐 Cross-journey impact: ${result.journeysImpacted.join(', ')}`, colors.magenta);
          }
          
          // Check for event versioning handling
          if (event.data.__schemaVersion) {
            log(`📜 Schema version migration: v${event.data.__schemaVersion} → current`, colors.blue);
          }
          
          results.push({ 
            type, 
            success: true, 
            xpGained,
            expectedXp,
            achievements: result.achievements || [],
            journeysImpacted: result.journeysImpacted || [event.journey],
            schemaVersion: event.data.__schemaVersion
          });
        }
      } catch (error) {
        if (expectError) {
          if (eventConfig.testDeadLetter) {
            log(`✅ Event sent to Dead Letter Queue as expected`, colors.green);
            
            // Optionally verify DLQ status by calling a DLQ API endpoint
            try {
              const dlqStatus = await axios.get(`${API_URL}/api/events/dlq/status?eventType=${type}&userId=${TEST_USER_ID}`);
              if (dlqStatus.data && dlqStatus.data.inQueue) {
                log(`✅ Verified event in Dead Letter Queue`, colors.green);
              } else {
                log(`⚠️ Could not verify DLQ status`, colors.yellow);
              }
            } catch (dlqError) {
              log(`⚠️ Could not check DLQ status: ${dlqError.message}`, colors.yellow);
            }
          } else {
            log(`✅ Expected error received for ${type}`, colors.green);
          }
          results.push({ type, success: true, expectedError: true, testDeadLetter: eventConfig.testDeadLetter });
        } else {
          log(`❌ Failed to process event ${type}: ${error.message}`, colors.red);
          results.push({ type, success: false, error: error.message });
        }
      }
      
      // Wait a bit between events to avoid rate limiting
      if (index < events.length - 1) {
        await wait(500);
      }
    }
    
    // Wait for events to be processed
    log('\nWaiting for events to be processed...', colors.cyan);
    await wait(2000);
    
    // Fetch final profile
    log('\nFetching updated user profile...', colors.cyan);
    const finalProfile = await fetchUserProfile(TEST_USER_ID);
    
    // Calculate and display results
    const xpGained = finalProfile.xp - initialProfile.xp;
    const newAchievements = finalProfile.achievements?.length - (initialProfile.achievements?.length || 0);
    
    log('\n📈 TEST RESULTS', colors.bright + colors.blue);
    log(`Final XP: ${finalProfile.xp} (gained ${xpGained})`, colors.blue);
    log(`Final Level: ${finalProfile.level}`, colors.blue);
    log(`Final Achievements: ${finalProfile.achievements?.length || 0} (new: ${newAchievements})`, colors.blue);
    
    if (VERBOSE && finalProfile.achievements?.length > 0) {
      log('\nAll Achievements:', colors.dim);
      finalProfile.achievements.forEach(achievement => {
        const isNew = !initialProfile.achievements?.some(a => a.id === achievement.id);
        log(`  - ${achievement.name} (${achievement.journey})${isNew ? ' [NEW]' : ''}`, 
            isNew ? colors.green : colors.dim);
      });
    }
    
    // Check for cross-journey achievements
    const journeyAchievements = {};
    let hasCrossJourneyAchievements = false;
    
    if (finalProfile.achievements?.length > 0) {
      finalProfile.achievements.forEach(achievement => {
        if (!journeyAchievements[achievement.journey]) {
          journeyAchievements[achievement.journey] = 0;
        }
        journeyAchievements[achievement.journey]++;
      });
      
      // Check if there are achievements from multiple journeys
      if (Object.keys(journeyAchievements).length > 1) {
        hasCrossJourneyAchievements = true;
      }
      
      log('\nAchievements by Journey:', colors.blue);
      Object.entries(journeyAchievements).forEach(([journey, count]) => {
        log(`  - ${journey}: ${count}`, colors.blue);
      });
    }
    
    // Verify cross-journey achievements
    log('\nCross-Journey Achievement Test:', colors.magenta);
    if (hasCrossJourneyAchievements) {
      log('✅ User has achievements from multiple journeys', colors.green);
    } else {
      log('❌ No cross-journey achievements detected', colors.red);
    }
    
    // Summary
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    const versionedEvents = results.filter(r => r.schemaVersion).length;
    const dlqEvents = results.filter(r => r.testDeadLetter).length;
    const crossJourneyEvents = results.filter(r => r.journeysImpacted && r.journeysImpacted.length > 1).length;
    
    log('\n🏁 TEST SUMMARY', colors.bright + colors.cyan);
    log(`Total Events: ${results.length}`, colors.cyan);
    log(`Successful: ${successCount}`, colors.green);
    log(`Failed: ${errorCount}`, colors.red);
    log(`XP Gained: ${xpGained}`, colors.cyan);
    log(`New Achievements: ${newAchievements}`, colors.cyan);
    log(`Cross-Journey Achievements: ${hasCrossJourneyAchievements ? 'Yes' : 'No'}`, 
        hasCrossJourneyAchievements ? colors.green : colors.red);
    log(`Versioned Events Processed: ${versionedEvents}`, colors.blue);
    log(`Dead Letter Queue Tests: ${dlqEvents}`, colors.yellow);
    log(`Cross-Journey Events: ${crossJourneyEvents}`, colors.magenta);
    
    // Journey coverage
    const journeyCoverage = {};
    results.filter(r => r.success && !r.expectedError).forEach(result => {
      const journey = result.journeysImpacted?.[0] || 'unknown';
      journeyCoverage[journey] = (journeyCoverage[journey] || 0) + 1;
    });
    
    log('\nJourney Coverage:', colors.cyan);
    Object.entries(journeyCoverage).forEach(([journey, count]) => {
      log(`  - ${journey}: ${count} events`, colors.cyan);
    });
    
    // Final result
    const expectedErrorCount = results.filter(r => r.expectedError).length;
    const unexpectedErrorCount = errorCount - expectedErrorCount;
    const hasAllJourneys = Object.keys(journeyCoverage).includes('health') && 
                          Object.keys(journeyCoverage).includes('care') && 
                          Object.keys(journeyCoverage).includes('plan');
    
    log('\nTest Criteria:', colors.cyan);
    log(`  - No unexpected errors: ${unexpectedErrorCount === 0 ? '✅' : '❌'}`, 
        unexpectedErrorCount === 0 ? colors.green : colors.red);
    log(`  - All journeys covered: ${hasAllJourneys ? '✅' : '❌'}`, 
        hasAllJourneys ? colors.green : colors.red);
    log(`  - Cross-journey achievements: ${hasCrossJourneyAchievements ? '✅' : '❌'}`, 
        hasCrossJourneyAchievements ? colors.green : colors.red);
    log(`  - Schema versioning tested: ${versionedEvents > 0 ? '✅' : '❌'}`, 
        versionedEvents > 0 ? colors.green : colors.red);
    log(`  - Dead letter queue tested: ${dlqEvents > 0 ? '✅' : '❌'}`, 
        dlqEvents > 0 ? colors.green : colors.red);
    
    // Pass if all required criteria are met
    if (unexpectedErrorCount === 0 && hasAllJourneys && hasCrossJourneyAchievements && 
        versionedEvents > 0 && dlqEvents > 0) {
      log('\n✅ TEST PASSED', colors.bright + colors.green);
      process.exit(0);
    } else {
      log('\n❌ TEST FAILED', colors.bright + colors.red);
      log('One or more test criteria were not met.', colors.red);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`, colors.bright + colors.red);
    process.exit(1);
  }
}

// Run the test
runTest();