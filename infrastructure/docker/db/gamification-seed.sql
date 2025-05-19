-- =========================================================================
-- AUSTA SuperApp - Gamification Database Seed Script
-- =========================================================================
-- This script populates the gamification database with initial seed data
-- for development and testing purposes. It includes sample data for:
-- - Game profiles
-- - Achievements across all journeys (health, care, plan)
-- - Quests with completion criteria
-- - Rewards and point structures
-- - User progress data
-- =========================================================================

-- Ensure we're using the correct database
\c gamification;

-- =========================================================================
-- GAME PROFILES
-- =========================================================================
-- Create sample user profiles with different levels and XP

INSERT INTO game_profiles (id, user_id, level, xp, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'user1', 5, 2500, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'user2', 3, 1200, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'user3', 7, 4800, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'user4', 1, 50, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'user5', 10, 12000, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET level = EXCLUDED.level,
      xp = EXCLUDED.xp,
      updated_at = NOW();

-- =========================================================================
-- ACHIEVEMENTS
-- =========================================================================
-- Health Journey Achievements

INSERT INTO achievements (id, title, description, journey, icon, xp_reward, created_at, updated_at)
VALUES
  -- Health Journey Achievements
  ('a1111111-1111-1111-1111-111111111111', 'First Steps', 'Record your first health metric', 'health', 'health_first_steps', 100, NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111112', 'Health Enthusiast', 'Record health metrics for 7 consecutive days', 'health', 'health_enthusiast', 250, NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111113', 'Fitness Fanatic', 'Complete 10 workouts in a month', 'health', 'fitness_fanatic', 500, NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111114', 'Sleep Master', 'Achieve optimal sleep for 5 consecutive nights', 'health', 'sleep_master', 300, NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111115', 'Nutrition Guru', 'Log your meals for 14 consecutive days', 'health', 'nutrition_guru', 400, NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111116', 'Goal Setter', 'Create your first health goal', 'health', 'goal_setter', 150, NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111117', 'Goal Crusher', 'Complete 5 health goals', 'health', 'goal_crusher', 600, NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111118', 'Device Connector', 'Connect your first wearable device', 'health', 'device_connector', 200, NOW(), NOW()),
  
  -- Care Journey Achievements
  ('a2222222-2222-2222-2222-222222222221', 'First Appointment', 'Book your first medical appointment', 'care', 'first_appointment', 100, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', 'Medication Manager', 'Track medications for 7 consecutive days', 'care', 'medication_manager', 250, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222223', 'Telemedicine Pioneer', 'Complete your first telemedicine session', 'care', 'telemedicine_pioneer', 300, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222224', 'Care Planner', 'Create a comprehensive care plan', 'care', 'care_planner', 400, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222225', 'Symptom Tracker', 'Use the symptom checker 5 times', 'care', 'symptom_tracker', 200, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222226', 'Provider Researcher', 'Research and save 3 healthcare providers', 'care', 'provider_researcher', 150, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222227', 'Treatment Completer', 'Complete a full treatment course', 'care', 'treatment_completer', 500, NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222228', 'Appointment Keeper', 'Attend 5 scheduled appointments', 'care', 'appointment_keeper', 350, NOW(), NOW()),
  
  -- Plan Journey Achievements
  ('a3333333-3333-3333-3333-333333333331', 'Plan Explorer', 'Compare 3 different insurance plans', 'plan', 'plan_explorer', 150, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333332', 'First Claim', 'Submit your first insurance claim', 'plan', 'first_claim', 100, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333333', 'Benefit Maximizer', 'Use 3 different benefits in your plan', 'plan', 'benefit_maximizer', 300, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333334', 'Document Organizer', 'Upload all required insurance documents', 'plan', 'document_organizer', 200, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333335', 'Coverage Expert', 'Review all coverage details of your plan', 'plan', 'coverage_expert', 250, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333336', 'Claim Master', 'Successfully process 5 insurance claims', 'plan', 'claim_master', 500, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333337', 'Plan Optimizer', 'Optimize your plan based on usage patterns', 'plan', 'plan_optimizer', 400, NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333338', 'Benefit Educator', 'Read all benefit descriptions in your plan', 'plan', 'benefit_educator', 150, NOW(), NOW()),
  
  -- Cross-Journey Achievements
  ('a9999999-9999-9999-9999-999999999991', 'SuperApp Starter', 'Use all three journeys in the SuperApp', 'global', 'superapp_starter', 300, NOW(), NOW()),
  ('a9999999-9999-9999-9999-999999999992', 'Data Integrator', 'Connect health data with care and plan journeys', 'global', 'data_integrator', 400, NOW(), NOW()),
  ('a9999999-9999-9999-9999-999999999993', 'Holistic Health Manager', 'Actively use all journeys for 30 days', 'global', 'holistic_manager', 800, NOW(), NOW()),
  ('a9999999-9999-9999-9999-999999999994', 'SuperApp Expert', 'Reach level 5 in all journey categories', 'global', 'superapp_expert', 1000, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      journey = EXCLUDED.journey,
      icon = EXCLUDED.icon,
      xp_reward = EXCLUDED.xp_reward,
      updated_at = NOW();

-- =========================================================================
-- QUESTS
-- =========================================================================
-- Sample quests with completion criteria

INSERT INTO quests (id, title, description, journey, icon, xp_reward, created_at, updated_at)
VALUES
  -- Health Journey Quests
  ('q1111111-1111-1111-1111-111111111111', 'Weekly Fitness Challenge', 'Complete 3 workouts this week', 'health', 'weekly_fitness', 200, NOW(), NOW()),
  ('q1111111-1111-1111-1111-111111111112', 'Hydration Hero', 'Track water intake for 5 consecutive days', 'health', 'hydration_hero', 150, NOW(), NOW()),
  ('q1111111-1111-1111-1111-111111111113', 'Sleep Improvement', 'Improve your sleep score by 20% this week', 'health', 'sleep_improvement', 250, NOW(), NOW()),
  ('q1111111-1111-1111-1111-111111111114', 'Step Challenge', 'Reach 50,000 steps in one week', 'health', 'step_challenge', 300, NOW(), NOW()),
  
  -- Care Journey Quests
  ('q2222222-2222-2222-2222-222222222221', 'Medication Adherence', 'Take all medications on schedule for 7 days', 'care', 'medication_adherence', 200, NOW(), NOW()),
  ('q2222222-2222-2222-2222-222222222222', 'Preventive Care', 'Schedule your annual check-up', 'care', 'preventive_care', 150, NOW(), NOW()),
  ('q2222222-2222-2222-2222-222222222223', 'Specialist Consultation', 'Complete a consultation with a specialist', 'care', 'specialist_consult', 250, NOW(), NOW()),
  ('q2222222-2222-2222-2222-222222222224', 'Health Education', 'Read 3 articles about your health condition', 'care', 'health_education', 100, NOW(), NOW()),
  
  -- Plan Journey Quests
  ('q3333333-3333-3333-3333-333333333331', 'Claim Submission Sprint', 'Submit 3 claims within 30 days', 'plan', 'claim_sprint', 200, NOW(), NOW()),
  ('q3333333-3333-3333-3333-333333333332', 'Benefit Discovery', 'Discover and use a new benefit in your plan', 'plan', 'benefit_discovery', 150, NOW(), NOW()),
  ('q3333333-3333-3333-3333-333333333333', 'Document Organization', 'Organize and digitize all your insurance documents', 'plan', 'document_organization', 250, NOW(), NOW()),
  ('q3333333-3333-3333-3333-333333333334', 'Coverage Review', 'Review and understand your coverage limits', 'plan', 'coverage_review', 100, NOW(), NOW()),
  
  -- Cross-Journey Quests
  ('q9999999-9999-9999-9999-999999999991', 'Wellness Integration', 'Connect your health metrics to your care plan', 'global', 'wellness_integration', 300, NOW(), NOW()),
  ('q9999999-9999-9999-9999-999999999992', 'Complete Health Profile', 'Complete profiles in all three journeys', 'global', 'complete_profile', 250, NOW(), NOW()),
  ('q9999999-9999-9999-9999-999999999993', 'SuperApp Challenge', 'Use all three journeys for 7 consecutive days', 'global', 'superapp_challenge', 400, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      journey = EXCLUDED.journey,
      icon = EXCLUDED.icon,
      xp_reward = EXCLUDED.xp_reward,
      updated_at = NOW();

-- =========================================================================
-- REWARDS
-- =========================================================================
-- Sample rewards for achievements and quests

INSERT INTO rewards (id, title, description, journey, icon, xp_reward, created_at, updated_at)
VALUES
  -- Health Journey Rewards
  ('r1111111-1111-1111-1111-111111111111', 'Fitness Badge', 'Badge for fitness achievements', 'health', 'fitness_badge', 0, NOW(), NOW()),
  ('r1111111-1111-1111-1111-111111111112', 'Nutrition Guide', 'Exclusive nutrition guide', 'health', 'nutrition_guide', 0, NOW(), NOW()),
  ('r1111111-1111-1111-1111-111111111113', 'Wellness Discount', '10% discount on wellness products', 'health', 'wellness_discount', 0, NOW(), NOW()),
  
  -- Care Journey Rewards
  ('r2222222-2222-2222-2222-222222222221', 'Care Badge', 'Badge for care achievements', 'care', 'care_badge', 0, NOW(), NOW()),
  ('r2222222-2222-2222-2222-222222222222', 'Priority Booking', 'Priority appointment booking', 'care', 'priority_booking', 0, NOW(), NOW()),
  ('r2222222-2222-2222-2222-222222222223', 'Specialist Discount', '15% discount on specialist consultations', 'care', 'specialist_discount', 0, NOW(), NOW()),
  
  -- Plan Journey Rewards
  ('r3333333-3333-3333-3333-333333333331', 'Plan Badge', 'Badge for plan achievements', 'plan', 'plan_badge', 0, NOW(), NOW()),
  ('r3333333-3333-3333-3333-333333333332', 'Premium Support', 'Access to premium customer support', 'plan', 'premium_support', 0, NOW(), NOW()),
  ('r3333333-3333-3333-3333-333333333333', 'Claim Fast-Track', 'Fast-track processing for claims', 'plan', 'claim_fast_track', 0, NOW(), NOW()),
  
  -- Cross-Journey Rewards
  ('r9999999-9999-9999-9999-999999999991', 'SuperApp Badge', 'Badge for cross-journey achievements', 'global', 'superapp_badge', 0, NOW(), NOW()),
  ('r9999999-9999-9999-9999-999999999992', 'Premium Membership', 'One month of premium membership', 'global', 'premium_membership', 0, NOW(), NOW()),
  ('r9999999-9999-9999-9999-999999999993', 'Health Credit', '$50 credit for health services', 'global', 'health_credit', 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      journey = EXCLUDED.journey,
      icon = EXCLUDED.icon,
      xp_reward = EXCLUDED.xp_reward,
      updated_at = NOW();

-- =========================================================================
-- USER ACHIEVEMENTS
-- =========================================================================
-- Sample user achievement progress and unlocks

INSERT INTO user_achievements (profile_id, achievement_id, progress, unlocked, unlocked_at, created_at, updated_at)
VALUES
  -- User 1 Achievements (Level 5)
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 100, TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111112', 100, TRUE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 days', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111116', 100, TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 days', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222221', 100, TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '30 days', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333331', 100, TRUE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 days', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'a9999999-9999-9999-9999-999999999991', 100, TRUE, NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 days', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111113', 50, FALSE, NULL, NOW() - INTERVAL '30 days', NOW()),
  ('11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222223', 75, FALSE, NULL, NOW() - INTERVAL '30 days', NOW()),
  
  -- User 2 Achievements (Level 3)
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 100, TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 days', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222221', 100, TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '30 days', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333332', 100, TRUE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 days', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111112', 50, FALSE, NULL, NOW() - INTERVAL '30 days', NOW()),
  
  -- User 3 Achievements (Level 7)
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 100, TRUE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111112', 100, TRUE, NOW() - INTERVAL '55 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111113', 100, TRUE, NOW() - INTERVAL '50 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111116', 100, TRUE, NOW() - INTERVAL '45 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111117', 100, TRUE, NOW() - INTERVAL '40 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222221', 100, TRUE, NOW() - INTERVAL '35 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 100, TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222223', 100, TRUE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333331', 100, TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333332', 100, TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a9999999-9999-9999-9999-999999999991', 100, TRUE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a9999999-9999-9999-9999-999999999992', 100, TRUE, NOW() - INTERVAL '5 days', NOW() - INTERVAL '60 days', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'a9999999-9999-9999-9999-999999999993', 50, FALSE, NULL, NOW() - INTERVAL '60 days', NOW()),
  
  -- User 4 Achievements (Level 1 - Just starting)
  ('44444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 50, FALSE, NULL, NOW() - INTERVAL '5 days', NOW()),
  
  -- User 5 Achievements (Level 10 - Power user)
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 100, TRUE, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111112', 100, TRUE, NOW() - INTERVAL '85 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111113', 100, TRUE, NOW() - INTERVAL '80 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111114', 100, TRUE, NOW() - INTERVAL '75 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111115', 100, TRUE, NOW() - INTERVAL '70 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111116', 100, TRUE, NOW() - INTERVAL '65 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111117', 100, TRUE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111118', 100, TRUE, NOW() - INTERVAL '55 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222221', 100, TRUE, NOW() - INTERVAL '50 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', 100, TRUE, NOW() - INTERVAL '45 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222223', 100, TRUE, NOW() - INTERVAL '40 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222224', 100, TRUE, NOW() - INTERVAL '35 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333331', 100, TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333332', 100, TRUE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', 100, TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333334', 100, TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a9999999-9999-9999-9999-999999999991', 100, TRUE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a9999999-9999-9999-9999-999999999992', 100, TRUE, NOW() - INTERVAL '5 days', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a9999999-9999-9999-9999-999999999993', 100, TRUE, NOW() - INTERVAL '1 day', NOW() - INTERVAL '90 days', NOW()),
  ('55555555-5555-5555-5555-555555555555', 'a9999999-9999-9999-9999-999999999994', 90, FALSE, NULL, NOW() - INTERVAL '90 days', NOW())
ON CONFLICT (profile_id, achievement_id) DO UPDATE
  SET progress = EXCLUDED.progress,
      unlocked = EXCLUDED.unlocked,
      unlocked_at = EXCLUDED.unlocked_at,
      updated_at = NOW();

-- =========================================================================
-- USER QUESTS
-- =========================================================================
-- Sample user quest progress and completions

INSERT INTO user_quests (id, profile_id, quest_id, progress, completed, created_at, updated_at)
VALUES
  -- User 1 Quests
  ('uq111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 66, FALSE, NOW() - INTERVAL '10 days', NOW()),
  ('uq111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'q2222222-2222-2222-2222-222222222221', 100, TRUE, NOW() - INTERVAL '5 days', NOW()),
  ('uq111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'q9999999-9999-9999-9999-999999999991', 50, FALSE, NOW() - INTERVAL '3 days', NOW()),
  
  -- User 2 Quests
  ('uq222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'q1111111-1111-1111-1111-111111111112', 80, FALSE, NOW() - INTERVAL '7 days', NOW()),
  ('uq222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'q3333333-3333-3333-3333-333333333331', 33, FALSE, NOW() - INTERVAL '5 days', NOW()),
  
  -- User 3 Quests
  ('uq333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'q1111111-1111-1111-1111-111111111111', 100, TRUE, NOW() - INTERVAL '20 days', NOW()),
  ('uq333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'q1111111-1111-1111-1111-111111111112', 100, TRUE, NOW() - INTERVAL '15 days', NOW()),
  ('uq333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'q2222222-2222-2222-2222-222222222221', 100, TRUE, NOW() - INTERVAL '10 days', NOW()),
  ('uq333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333333', 'q3333333-3333-3333-3333-333333333331', 100, TRUE, NOW() - INTERVAL '5 days', NOW()),
  ('uq333333-3333-3333-3333-333333333335', '33333333-3333-3333-3333-333333333333', 'q9999999-9999-9999-9999-999999999991', 75, FALSE, NOW() - INTERVAL '2 days', NOW()),
  
  -- User 4 Quests (Just starting)
  ('uq444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'q1111111-1111-1111-1111-111111111111', 33, FALSE, NOW() - INTERVAL '2 days', NOW()),
  
  -- User 5 Quests (Power user)
  ('uq555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', 'q1111111-1111-1111-1111-111111111111', 100, TRUE, NOW() - INTERVAL '30 days', NOW()),
  ('uq555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', 'q1111111-1111-1111-1111-111111111112', 100, TRUE, NOW() - INTERVAL '25 days', NOW()),
  ('uq555555-5555-5555-5555-555555555553', '55555555-5555-5555-5555-555555555555', 'q1111111-1111-1111-1111-111111111113', 100, TRUE, NOW() - INTERVAL '20 days', NOW()),
  ('uq555555-5555-5555-5555-555555555554', '55555555-5555-5555-5555-555555555555', 'q2222222-2222-2222-2222-222222222221', 100, TRUE, NOW() - INTERVAL '15 days', NOW()),
  ('uq555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'q2222222-2222-2222-2222-222222222222', 100, TRUE, NOW() - INTERVAL '10 days', NOW()),
  ('uq555555-5555-5555-5555-555555555556', '55555555-5555-5555-5555-555555555555', 'q3333333-3333-3333-3333-333333333331', 100, TRUE, NOW() - INTERVAL '5 days', NOW()),
  ('uq555555-5555-5555-5555-555555555557', '55555555-5555-5555-5555-555555555555', 'q9999999-9999-9999-9999-999999999991', 100, TRUE, NOW() - INTERVAL '3 days', NOW()),
  ('uq555555-5555-5555-5555-555555555558', '55555555-5555-5555-5555-555555555555', 'q9999999-9999-9999-9999-999999999992', 100, TRUE, NOW() - INTERVAL '1 day', NOW()),
  ('uq555555-5555-5555-5555-555555555559', '55555555-5555-5555-5555-555555555555', 'q9999999-9999-9999-9999-999999999993', 85, FALSE, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO UPDATE
  SET progress = EXCLUDED.progress,
      completed = EXCLUDED.completed,
      updated_at = NOW();

-- =========================================================================
-- USER REWARDS
-- =========================================================================
-- Sample user rewards earned

INSERT INTO user_rewards (id, profile_id, reward_id, earned_at, created_at, updated_at)
VALUES
  -- User 1 Rewards
  ('ur111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW()),
  ('ur111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'r2222222-2222-2222-2222-222222222221', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW()),
  
  -- User 2 Rewards
  ('ur222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'r1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW()),
  
  -- User 3 Rewards
  ('ur333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'r1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NOW()),
  ('ur333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'r1111111-1111-1111-1111-111111111112', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
  ('ur333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'r2222222-2222-2222-2222-222222222221', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW()),
  ('ur333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333331', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW()),
  ('ur333333-3333-3333-3333-333333333335', '33333333-3333-3333-3333-333333333333', 'r9999999-9999-9999-9999-999999999991', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW()),
  
  -- User 4 Rewards (None yet - just starting)
  
  -- User 5 Rewards (Power user)
  ('ur555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', 'r1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW()),
  ('ur555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', 'r1111111-1111-1111-1111-111111111112', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days', NOW()),
  ('ur555555-5555-5555-5555-555555555553', '55555555-5555-5555-5555-555555555555', 'r1111111-1111-1111-1111-111111111113', NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days', NOW()),
  ('ur555555-5555-5555-5555-555555555554', '55555555-5555-5555-5555-555555555555', 'r2222222-2222-2222-2222-222222222221', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW()),
  ('ur555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'r2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', NOW()),
  ('ur555555-5555-5555-5555-555555555556', '55555555-5555-5555-5555-555555555555', 'r2222222-2222-2222-2222-222222222223', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NOW()),
  ('ur555555-5555-5555-5555-555555555557', '55555555-5555-5555-5555-555555555555', 'r3333333-3333-3333-3333-333333333331', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
  ('ur555555-5555-5555-5555-555555555558', '55555555-5555-5555-5555-555555555555', 'r3333333-3333-3333-3333-333333333332', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW()),
  ('ur555555-5555-5555-5555-555555555559', '55555555-5555-5555-5555-555555555555', 'r3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW()),
  ('ur555555-5555-5555-5555-55555555555a', '55555555-5555-5555-5555-555555555555', 'r9999999-9999-9999-9999-999999999991', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW()),
  ('ur555555-5555-5555-5555-55555555555b', '55555555-5555-5555-5555-555555555555', 'r9999999-9999-9999-9999-999999999992', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW()),
  ('ur555555-5555-5555-5555-55555555555c', '55555555-5555-5555-5555-555555555555', 'r9999999-9999-9999-9999-999999999993', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO UPDATE
  SET earned_at = EXCLUDED.earned_at,
      updated_at = NOW();

-- =========================================================================
-- RULES
-- =========================================================================
-- Sample rules for event processing

INSERT INTO rules (id, name, description, event_type, conditions, actions, journey, created_at, updated_at)
VALUES
  -- Health Journey Rules
  ('ru111111-1111-1111-1111-111111111111', 'First Health Metric', 'Award achievement for first health metric', 'HEALTH_METRIC_RECORDED', 
   '{"operator": "AND", "conditions": [{"field": "count", "operator": "=", "value": 1}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a1111111-1111-1111-1111-111111111111"}', 
   'health', NOW(), NOW()),
   
  ('ru111111-1111-1111-1111-111111111112', 'Consecutive Health Metrics', 'Award achievement for 7 consecutive days of health metrics', 'HEALTH_METRIC_RECORDED', 
   '{"operator": "AND", "conditions": [{"field": "streak", "operator": ">=", "value": 7}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a1111111-1111-1111-1111-111111111112"}', 
   'health', NOW(), NOW()),
   
  ('ru111111-1111-1111-1111-111111111113', 'Workout Completion', 'Award XP for completing workouts', 'WORKOUT_COMPLETED', 
   '{"operator": "AND", "conditions": [{"field": "duration", "operator": ">=", "value": 20}]}', 
   '{"type": "AWARD_XP", "amount": 50}', 
   'health', NOW(), NOW()),
   
  ('ru111111-1111-1111-1111-111111111114', 'Multiple Workouts', 'Award achievement for 10 workouts in a month', 'WORKOUT_COMPLETED', 
   '{"operator": "AND", "conditions": [{"field": "count_monthly", "operator": ">=", "value": 10}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a1111111-1111-1111-1111-111111111113"}', 
   'health', NOW(), NOW()),
   
  -- Care Journey Rules
  ('ru222222-2222-2222-2222-222222222221', 'First Appointment', 'Award achievement for booking first appointment', 'APPOINTMENT_BOOKED', 
   '{"operator": "AND", "conditions": [{"field": "count", "operator": "=", "value": 1}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a2222222-2222-2222-2222-222222222221"}', 
   'care', NOW(), NOW()),
   
  ('ru222222-2222-2222-2222-222222222222', 'Medication Tracking', 'Award achievement for tracking medications for 7 days', 'MEDICATION_TAKEN', 
   '{"operator": "AND", "conditions": [{"field": "streak", "operator": ">=", "value": 7}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a2222222-2222-2222-2222-222222222222"}', 
   'care', NOW(), NOW()),
   
  ('ru222222-2222-2222-2222-222222222223', 'First Telemedicine', 'Award achievement for first telemedicine session', 'TELEMEDICINE_COMPLETED', 
   '{"operator": "AND", "conditions": [{"field": "count", "operator": "=", "value": 1}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a2222222-2222-2222-2222-222222222223"}', 
   'care', NOW(), NOW()),
   
  -- Plan Journey Rules
  ('ru333333-3333-3333-3333-333333333331', 'Plan Comparison', 'Award achievement for comparing plans', 'PLAN_COMPARED', 
   '{"operator": "AND", "conditions": [{"field": "count", "operator": ">=", "value": 3}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a3333333-3333-3333-3333-333333333331"}', 
   'plan', NOW(), NOW()),
   
  ('ru333333-3333-3333-3333-333333333332', 'First Claim', 'Award achievement for submitting first claim', 'CLAIM_SUBMITTED', 
   '{"operator": "AND", "conditions": [{"field": "count", "operator": "=", "value": 1}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a3333333-3333-3333-3333-333333333332"}', 
   'plan', NOW(), NOW()),
   
  ('ru333333-3333-3333-3333-333333333333', 'Benefit Usage', 'Award achievement for using multiple benefits', 'BENEFIT_USED', 
   '{"operator": "AND", "conditions": [{"field": "unique_count", "operator": ">=", "value": 3}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a3333333-3333-3333-3333-333333333333"}', 
   'plan', NOW(), NOW()),
   
  -- Cross-Journey Rules
  ('ru999999-9999-9999-9999-999999999991', 'SuperApp Starter', 'Award achievement for using all three journeys', 'JOURNEY_ACCESSED', 
   '{"operator": "AND", "conditions": [{"field": "unique_journeys", "operator": ">=", "value": 3}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a9999999-9999-9999-9999-999999999991"}', 
   'global', NOW(), NOW()),
   
  ('ru999999-9999-9999-9999-999999999992', 'Data Integration', 'Award achievement for connecting health data with care and plan', 'DATA_CONNECTED', 
   '{"operator": "AND", "conditions": [{"field": "connected_journeys", "operator": ">=", "value": 3}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a9999999-9999-9999-9999-999999999992"}', 
   'global', NOW(), NOW()),
   
  ('ru999999-9999-9999-9999-999999999993', 'Holistic Health Manager', 'Award achievement for using all journeys for 30 days', 'DAILY_LOGIN', 
   '{"operator": "AND", "conditions": [{"field": "active_days", "operator": ">=", "value": 30}, {"field": "active_journeys", "operator": ">=", "value": 3}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a9999999-9999-9999-9999-999999999993"}', 
   'global', NOW(), NOW()),
   
  ('ru999999-9999-9999-9999-999999999994', 'SuperApp Expert', 'Award achievement for reaching level 5 in all journeys', 'LEVEL_REACHED', 
   '{"operator": "AND", "conditions": [{"field": "min_journey_level", "operator": ">=", "value": 5}]}', 
   '{"type": "UNLOCK_ACHIEVEMENT", "achievementId": "a9999999-9999-9999-9999-999999999994"}', 
   'global', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      event_type = EXCLUDED.event_type,
      conditions = EXCLUDED.conditions,
      actions = EXCLUDED.actions,
      journey = EXCLUDED.journey,
      updated_at = NOW();

-- =========================================================================
-- EVENTS
-- =========================================================================
-- Sample events for testing

INSERT INTO events (id, type, user_id, data, journey, processed, created_at, updated_at)
VALUES
  -- Health Journey Events
  ('ev111111-1111-1111-1111-111111111111', 'HEALTH_METRIC_RECORDED', 'user1', '{"metricType": "steps", "value": 10000, "date": "2023-05-01"}', 'health', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ev111111-1111-1111-1111-111111111112', 'WORKOUT_COMPLETED', 'user1', '{"type": "running", "duration": 30, "calories": 300, "date": "2023-05-02"}', 'health', TRUE, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
  ('ev111111-1111-1111-1111-111111111113', 'HEALTH_GOAL_CREATED', 'user1', '{"goalType": "steps", "target": 10000, "period": "daily"}', 'health', TRUE, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ('ev111111-1111-1111-1111-111111111114', 'HEALTH_METRIC_RECORDED', 'user2', '{"metricType": "weight", "value": 70, "date": "2023-05-01"}', 'health', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ev111111-1111-1111-1111-111111111115', 'DEVICE_CONNECTED', 'user3', '{"deviceType": "fitbit", "deviceId": "fitbit123"}', 'health', TRUE, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
  
  -- Care Journey Events
  ('ev222222-2222-2222-2222-222222222221', 'APPOINTMENT_BOOKED', 'user1', '{"providerId": "provider123", "date": "2023-05-15", "type": "checkup"}', 'care', TRUE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('ev222222-2222-2222-2222-222222222222', 'MEDICATION_TAKEN', 'user1', '{"medicationId": "med123", "time": "2023-05-03T08:00:00Z"}', 'care', TRUE, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
  ('ev222222-2222-2222-2222-222222222223', 'TELEMEDICINE_COMPLETED', 'user1', '{"providerId": "provider456", "duration": 15, "date": "2023-05-10"}', 'care', TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('ev222222-2222-2222-2222-222222222224', 'APPOINTMENT_BOOKED', 'user2', '{"providerId": "provider789", "date": "2023-05-20", "type": "specialist"}', 'care', TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('ev222222-2222-2222-2222-222222222225', 'SYMPTOM_CHECKED', 'user3', '{"symptoms": ["headache", "fever"], "date": "2023-05-05"}', 'care', TRUE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  
  -- Plan Journey Events
  ('ev333333-3333-3333-3333-333333333331', 'PLAN_COMPARED', 'user1', '{"planIds": ["plan123", "plan456", "plan789"], "date": "2023-05-01"}', 'plan', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ev333333-3333-3333-3333-333333333332', 'CLAIM_SUBMITTED', 'user1', '{"claimId": "claim123", "amount": 100, "date": "2023-05-05"}', 'plan', TRUE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('ev333333-3333-3333-3333-333333333333', 'BENEFIT_USED', 'user1', '{"benefitId": "benefit123", "date": "2023-05-10"}', 'plan', TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('ev333333-3333-3333-3333-333333333334', 'DOCUMENT_UPLOADED', 'user2', '{"documentType": "insurance_card", "date": "2023-05-02"}', 'plan', TRUE, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
  ('ev333333-3333-3333-3333-333333333335', 'COVERAGE_REVIEWED', 'user3', '{"coverageId": "coverage123", "date": "2023-05-15"}', 'plan', TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  
  -- Cross-Journey Events
  ('ev999999-9999-9999-9999-999999999991', 'JOURNEY_ACCESSED', 'user1', '{"journey": "health", "date": "2023-05-01"}', 'global', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ev999999-9999-9999-9999-999999999992', 'JOURNEY_ACCESSED', 'user1', '{"journey": "care", "date": "2023-05-01"}', 'global', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ev999999-9999-9999-9999-999999999993', 'JOURNEY_ACCESSED', 'user1', '{"journey": "plan", "date": "2023-05-01"}', 'global', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ev999999-9999-9999-9999-999999999994', 'DATA_CONNECTED', 'user3', '{"sourceJourney": "health", "targetJourney": "care", "date": "2023-05-10"}', 'global', TRUE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('ev999999-9999-9999-9999-999999999995', 'DAILY_LOGIN', 'user5', '{"date": "2023-05-01", "journeys": ["health", "care", "plan"]}', 'global', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('ev999999-9999-9999-9999-999999999996', 'LEVEL_REACHED', 'user5', '{"journey": "health", "level": 5, "date": "2023-05-15"}', 'global', TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO UPDATE
  SET type = EXCLUDED.type,
      user_id = EXCLUDED.user_id,
      data = EXCLUDED.data,
      journey = EXCLUDED.journey,
      processed = EXCLUDED.processed,
      updated_at = NOW();

-- =========================================================================
-- LEADERBOARD ENTRIES
-- =========================================================================
-- Sample leaderboard entries

INSERT INTO leaderboards (id, name, journey, created_at, updated_at)
VALUES
  ('lb111111-1111-1111-1111-111111111111', 'Health Journey Leaderboard', 'health', NOW(), NOW()),
  ('lb222222-2222-2222-2222-222222222222', 'Care Journey Leaderboard', 'care', NOW(), NOW()),
  ('lb333333-3333-3333-3333-333333333333', 'Plan Journey Leaderboard', 'plan', NOW(), NOW()),
  ('lb999999-9999-9999-9999-999999999999', 'Global Leaderboard', 'global', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      journey = EXCLUDED.journey,
      updated_at = NOW();

INSERT INTO leaderboard_entries (id, leaderboard_id, profile_id, score, rank, created_at, updated_at)
VALUES
  -- Health Journey Leaderboard
  ('le111111-1111-1111-1111-111111111111', 'lb111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 5000, 1, NOW(), NOW()),
  ('le111111-1111-1111-1111-111111111112', 'lb111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 3500, 2, NOW(), NOW()),
  ('le111111-1111-1111-1111-111111111113', 'lb111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1500, 3, NOW(), NOW()),
  ('le111111-1111-1111-1111-111111111114', 'lb111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 800, 4, NOW(), NOW()),
  ('le111111-1111-1111-1111-111111111115', 'lb111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 50, 5, NOW(), NOW()),
  
  -- Care Journey Leaderboard
  ('le222222-2222-2222-2222-222222222221', 'lb222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 4000, 1, NOW(), NOW()),
  ('le222222-2222-2222-2222-222222222222', 'lb222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 2500, 2, NOW(), NOW()),
  ('le222222-2222-2222-2222-222222222223', 'lb222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 1000, 3, NOW(), NOW()),
  ('le222222-2222-2222-2222-222222222224', 'lb222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 500, 4, NOW(), NOW()),
  ('le222222-2222-2222-2222-222222222225', 'lb222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 0, 5, NOW(), NOW()),
  
  -- Plan Journey Leaderboard
  ('le333333-3333-3333-3333-333333333331', 'lb333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 3000, 1, NOW(), NOW()),
  ('le333333-3333-3333-3333-333333333332', 'lb333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1500, 2, NOW(), NOW()),
  ('le333333-3333-3333-3333-333333333333', 'lb333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 800, 3, NOW(), NOW()),
  ('le333333-3333-3333-3333-333333333334', 'lb333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 400, 4, NOW(), NOW()),
  ('le333333-3333-3333-3333-333333333335', 'lb333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 0, 5, NOW(), NOW()),
  
  -- Global Leaderboard
  ('le999999-9999-9999-9999-999999999991', 'lb999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', 12000, 1, NOW(), NOW()),
  ('le999999-9999-9999-9999-999999999992', 'lb999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 4800, 2, NOW(), NOW()),
  ('le999999-9999-9999-9999-999999999993', 'lb999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 2500, 3, NOW(), NOW()),
  ('le999999-9999-9999-9999-999999999994', 'lb999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 1200, 4, NOW(), NOW()),
  ('le999999-9999-9999-9999-999999999995', 'lb999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 50, 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET score = EXCLUDED.score,
      rank = EXCLUDED.rank,
      updated_at = NOW();

-- =========================================================================
-- End of seed script
-- =========================================================================