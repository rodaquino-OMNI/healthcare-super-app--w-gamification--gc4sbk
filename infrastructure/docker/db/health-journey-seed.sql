-- =========================================================================
-- AUSTA SuperApp - Health Journey Database Seed Script
-- =========================================================================
-- This script populates the health_journey database with initial seed data
-- for development and testing purposes. It includes health metrics types,
-- device connection information, health goals, and sample medical events.
-- =========================================================================

-- Ensure we're using the correct database
\connect health_journey;

-- =========================================================================
-- HEALTH METRICS TYPES AND CATEGORIES
-- =========================================================================

-- Create a table for health metric types if it doesn't exist
CREATE TABLE IF NOT EXISTS health_metric_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    min_value FLOAT,
    max_value FLOAT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data to avoid duplicates during development
TRUNCATE TABLE health_metric_types RESTART IDENTITY CASCADE;

-- Insert health metric types
INSERT INTO health_metric_types (code, name, description, unit, min_value, max_value, category) VALUES
-- Cardiovascular metrics
('HEART_RATE', 'Heart Rate', 'Number of heartbeats per minute', 'bpm', 40, 200, 'cardiovascular'),
('BLOOD_PRESSURE_SYSTOLIC', 'Blood Pressure (Systolic)', 'Upper value of blood pressure measurement', 'mmHg', 70, 190, 'cardiovascular'),
('BLOOD_PRESSURE_DIASTOLIC', 'Blood Pressure (Diastolic)', 'Lower value of blood pressure measurement', 'mmHg', 40, 130, 'cardiovascular'),

-- Blood metrics
('BLOOD_GLUCOSE', 'Blood Glucose', 'Blood sugar level', 'mg/dL', 70, 200, 'blood'),
('CHOLESTEROL_TOTAL', 'Total Cholesterol', 'Total cholesterol level in blood', 'mg/dL', 100, 300, 'blood'),
('CHOLESTEROL_HDL', 'HDL Cholesterol', 'High-density lipoprotein cholesterol level', 'mg/dL', 20, 100, 'blood'),
('CHOLESTEROL_LDL', 'LDL Cholesterol', 'Low-density lipoprotein cholesterol level', 'mg/dL', 50, 200, 'blood'),

-- Activity metrics
('STEPS', 'Steps', 'Number of steps taken', 'steps', 0, 100000, 'activity'),
('ACTIVE_MINUTES', 'Active Minutes', 'Minutes of moderate to intense physical activity', 'minutes', 0, 1440, 'activity'),
('DISTANCE', 'Distance', 'Distance traveled', 'km', 0, 1000, 'activity'),
('CALORIES_BURNED', 'Calories Burned', 'Estimated calories burned from activity', 'kcal', 0, 10000, 'activity'),

-- Sleep metrics
('SLEEP_DURATION', 'Sleep Duration', 'Total time spent sleeping', 'hours', 0, 24, 'sleep'),
('DEEP_SLEEP', 'Deep Sleep', 'Time spent in deep sleep stage', 'hours', 0, 10, 'sleep'),
('REM_SLEEP', 'REM Sleep', 'Time spent in REM sleep stage', 'hours', 0, 8, 'sleep'),
('SLEEP_SCORE', 'Sleep Score', 'Overall sleep quality score', 'score', 0, 100, 'sleep'),

-- Body metrics
('WEIGHT', 'Weight', 'Body weight measurement', 'kg', 0, 500, 'body'),
('BMI', 'Body Mass Index', 'Body mass index calculation', 'kg/m²', 10, 50, 'body'),
('BODY_FAT', 'Body Fat Percentage', 'Percentage of body mass that is fat', '%', 0, 70, 'body'),
('WAIST_CIRCUMFERENCE', 'Waist Circumference', 'Measurement of waist circumference', 'cm', 40, 200, 'body'),

-- Respiratory metrics
('OXYGEN_SATURATION', 'Oxygen Saturation', 'Percentage of oxygen-saturated hemoglobin', '%', 80, 100, 'respiratory'),
('RESPIRATORY_RATE', 'Respiratory Rate', 'Number of breaths per minute', 'breaths/min', 8, 40, 'respiratory');

-- =========================================================================
-- DEVICE CONNECTIONS
-- =========================================================================

-- Create a table for device types if it doesn't exist
CREATE TABLE IF NOT EXISTS device_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data to avoid duplicates during development
TRUNCATE TABLE device_types RESTART IDENTITY CASCADE;

-- Insert device types
INSERT INTO device_types (code, name, description) VALUES
('SMARTWATCH', 'Smartwatch', 'Wrist-worn smart device with health tracking capabilities'),
('FITNESS_TRACKER', 'Fitness Tracker', 'Wearable device focused on activity tracking'),
('SMART_SCALE', 'Smart Scale', 'Connected scale that measures weight and other body metrics'),
('BLOOD_PRESSURE_MONITOR', 'Blood Pressure Monitor', 'Device for measuring blood pressure'),
('GLUCOSE_MONITOR', 'Glucose Monitor', 'Device for measuring blood glucose levels'),
('SLEEP_TRACKER', 'Sleep Tracker', 'Device specifically designed to monitor sleep patterns'),
('OTHER', 'Other Device', 'Other health monitoring device');

-- Create a table for device manufacturers if it doesn't exist
CREATE TABLE IF NOT EXISTS device_manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    api_integration BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data to avoid duplicates during development
TRUNCATE TABLE device_manufacturers RESTART IDENTITY CASCADE;

-- Insert device manufacturers
INSERT INTO device_manufacturers (name, website, api_integration) VALUES
('Fitbit', 'https://www.fitbit.com', TRUE),
('Apple', 'https://www.apple.com', TRUE),
('Samsung', 'https://www.samsung.com', TRUE),
('Garmin', 'https://www.garmin.com', TRUE),
('Withings', 'https://www.withings.com', TRUE),
('Omron', 'https://www.omron.com', TRUE),
('Dexcom', 'https://www.dexcom.com', TRUE),
('Oura', 'https://www.ouraring.com', TRUE),
('Xiaomi', 'https://www.mi.com', TRUE),
('Polar', 'https://www.polar.com', TRUE);

-- Create a table for device models if it doesn't exist
CREATE TABLE IF NOT EXISTS device_models (
    id SERIAL PRIMARY KEY,
    manufacturer_id INTEGER REFERENCES device_manufacturers(id),
    device_type_id INTEGER REFERENCES device_types(id),
    model_name VARCHAR(100) NOT NULL,
    release_year INTEGER,
    supported_metrics TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data to avoid duplicates during development
TRUNCATE TABLE device_models RESTART IDENTITY CASCADE;

-- Insert device models
INSERT INTO device_models (manufacturer_id, device_type_id, model_name, release_year, supported_metrics) VALUES
-- Fitbit devices
(1, 1, 'Sense 2', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'OXYGEN_SATURATION']),
(1, 2, 'Charge 5', 2021, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED']),

-- Apple devices
(2, 1, 'Apple Watch Series 8', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'OXYGEN_SATURATION']),
(2, 1, 'Apple Watch Ultra', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'OXYGEN_SATURATION']),

-- Samsung devices
(3, 1, 'Galaxy Watch 5', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'BODY_FAT']),
(3, 1, 'Galaxy Watch 5 Pro', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'BODY_FAT']),

-- Garmin devices
(4, 1, 'Forerunner 955', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'OXYGEN_SATURATION']),
(4, 1, 'Fenix 7', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'OXYGEN_SATURATION']),

-- Withings devices
(5, 3, 'Body Scan', 2022, ARRAY['WEIGHT', 'BMI', 'BODY_FAT']),
(5, 4, 'BPM Connect', 2021, ARRAY['BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC']),

-- Omron devices
(6, 4, 'Evolv', 2020, ARRAY['BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC', 'HEART_RATE']),

-- Dexcom devices
(7, 5, 'G6', 2018, ARRAY['BLOOD_GLUCOSE']),

-- Oura devices
(8, 6, 'Oura Ring Gen 3', 2021, ARRAY['HEART_RATE', 'SLEEP_DURATION', 'DEEP_SLEEP', 'REM_SLEEP', 'SLEEP_SCORE', 'RESPIRATORY_RATE']),

-- Xiaomi devices
(9, 2, 'Mi Band 7', 2022, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED']),

-- Polar devices
(10, 1, 'Vantage V2', 2020, ARRAY['HEART_RATE', 'STEPS', 'SLEEP_DURATION', 'ACTIVE_MINUTES', 'CALORIES_BURNED', 'RESPIRATORY_RATE']);

-- =========================================================================
-- HEALTH GOALS
-- =========================================================================

-- Create a table for goal types if it doesn't exist
CREATE TABLE IF NOT EXISTS goal_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_unit VARCHAR(20) NOT NULL,
    related_metric VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data to avoid duplicates during development
TRUNCATE TABLE goal_types RESTART IDENTITY CASCADE;

-- Insert goal types
INSERT INTO goal_types (code, name, description, default_unit, related_metric) VALUES
('STEPS', 'Daily Steps', 'Goal for number of steps taken per day', 'steps', 'STEPS'),
('SLEEP', 'Sleep Duration', 'Goal for hours of sleep per night', 'hours', 'SLEEP_DURATION'),
('WATER', 'Water Intake', 'Goal for daily water consumption', 'ml', NULL),
('WEIGHT', 'Weight Management', 'Goal for target weight or weight loss', 'kg', 'WEIGHT'),
('EXERCISE', 'Exercise Duration', 'Goal for minutes of exercise per day or week', 'minutes', 'ACTIVE_MINUTES'),
('HEART_RATE', 'Heart Rate Zone', 'Goal for maintaining heart rate in target zone', 'bpm', 'HEART_RATE'),
('BLOOD_PRESSURE', 'Blood Pressure Management', 'Goal for maintaining healthy blood pressure', 'mmHg', 'BLOOD_PRESSURE_SYSTOLIC'),
('BLOOD_GLUCOSE', 'Blood Glucose Management', 'Goal for maintaining blood glucose in target range', 'mg/dL', 'BLOOD_GLUCOSE'),
('CUSTOM', 'Custom Goal', 'User-defined custom health goal', 'units', NULL);

-- Create a table for achievement levels if it doesn't exist
CREATE TABLE IF NOT EXISTS achievement_levels (
    id SERIAL PRIMARY KEY,
    goal_type_id INTEGER REFERENCES goal_types(id),
    level VARCHAR(20) NOT NULL,
    min_value FLOAT NOT NULL,
    max_value FLOAT,
    description TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data to avoid duplicates during development
TRUNCATE TABLE achievement_levels RESTART IDENTITY CASCADE;

-- Insert achievement levels for each goal type
INSERT INTO achievement_levels (goal_type_id, level, min_value, max_value, description, xp_reward) VALUES
-- Steps achievement levels
(1, 'BEGINNER', 5000, 7499, 'Starting your journey with regular walking', 10),
(1, 'INTERMEDIATE', 7500, 9999, 'Building a consistent walking habit', 20),
(1, 'ADVANCED', 10000, 14999, 'Achieving the recommended daily step count', 30),
(1, 'EXPERT', 15000, NULL, 'Exceeding daily step recommendations', 50),

-- Sleep achievement levels
(2, 'BEGINNER', 6, 6.9, 'Working towards healthy sleep duration', 10),
(2, 'INTERMEDIATE', 7, 7.9, 'Achieving recommended sleep duration', 20),
(2, 'ADVANCED', 8, 8.9, 'Optimizing sleep duration for health', 30),
(2, 'EXPERT', 9, NULL, 'Maximizing sleep benefits', 40),

-- Water intake achievement levels
(3, 'BEGINNER', 1500, 1999, 'Starting to increase daily hydration', 10),
(3, 'INTERMEDIATE', 2000, 2499, 'Building consistent hydration habits', 20),
(3, 'ADVANCED', 2500, 2999, 'Achieving recommended daily water intake', 30),
(3, 'EXPERT', 3000, NULL, 'Optimizing hydration for health', 40),

-- Exercise duration achievement levels
(5, 'BEGINNER', 15, 29, 'Starting to incorporate regular exercise', 10),
(5, 'INTERMEDIATE', 30, 44, 'Meeting minimum exercise recommendations', 20),
(5, 'ADVANCED', 45, 59, 'Building strong exercise habits', 30),
(5, 'EXPERT', 60, NULL, 'Exceeding exercise recommendations', 50);

-- =========================================================================
-- MEDICAL EVENTS
-- =========================================================================

-- Create a table for medical event types if it doesn't exist
CREATE TABLE IF NOT EXISTS medical_event_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    requires_provider BOOLEAN DEFAULT FALSE,
    requires_documents BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data to avoid duplicates during development
TRUNCATE TABLE medical_event_types RESTART IDENTITY CASCADE;

-- Insert medical event types
INSERT INTO medical_event_types (code, name, description, category, requires_provider, requires_documents) VALUES
-- Visit types
('ANNUAL_CHECKUP', 'Annual Checkup', 'Routine yearly physical examination', 'visit', TRUE, FALSE),
('SPECIALIST_VISIT', 'Specialist Consultation', 'Visit to a medical specialist', 'visit', TRUE, FALSE),
('EMERGENCY_VISIT', 'Emergency Room Visit', 'Visit to emergency department for urgent care', 'visit', TRUE, TRUE),
('TELEMEDICINE', 'Telemedicine Consultation', 'Remote medical consultation via video or phone', 'visit', TRUE, FALSE),

-- Procedure types
('BLOOD_TEST', 'Blood Test', 'Laboratory analysis of blood sample', 'procedure', TRUE, TRUE),
('IMAGING', 'Imaging Procedure', 'Medical imaging such as X-ray, MRI, CT scan', 'procedure', TRUE, TRUE),
('SURGERY', 'Surgical Procedure', 'Invasive medical procedure', 'procedure', TRUE, TRUE),
('VACCINATION', 'Vaccination', 'Administration of vaccine', 'procedure', TRUE, FALSE),

-- Diagnosis types
('ACUTE_CONDITION', 'Acute Condition', 'Short-term medical condition', 'diagnosis', TRUE, FALSE),
('CHRONIC_CONDITION', 'Chronic Condition', 'Long-term or recurring medical condition', 'diagnosis', TRUE, TRUE),
('INJURY', 'Injury', 'Physical trauma or wound', 'diagnosis', TRUE, FALSE),

-- Medication types
('PRESCRIPTION', 'Prescription Medication', 'Medication prescribed by healthcare provider', 'medication', TRUE, FALSE),
('OTC_MEDICATION', 'Over-the-Counter Medication', 'Non-prescription medication', 'medication', FALSE, FALSE),
('SUPPLEMENT', 'Supplement', 'Dietary or nutritional supplement', 'medication', FALSE, FALSE),

-- Self-reported events
('SYMPTOM', 'Symptom', 'Self-reported symptom or health concern', 'self_reported', FALSE, FALSE),
('ALLERGY', 'Allergy', 'Allergic reaction or sensitivity', 'self_reported', FALSE, FALSE),
('LIFESTYLE_CHANGE', 'Lifestyle Change', 'Significant change in lifestyle habits', 'self_reported', FALSE, FALSE);

-- =========================================================================
-- SAMPLE DATA FOR TESTING
-- =========================================================================

-- Create sample users for testing if users table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Clear existing test users
        DELETE FROM users WHERE email LIKE 'test%@example.com';
        
        -- Insert test users
        INSERT INTO users (id, email, first_name, last_name, created_at, updated_at)
        VALUES 
        ('00000000-0000-4000-a000-000000000001', 'test1@example.com', 'John', 'Doe', NOW(), NOW()),
        ('00000000-0000-4000-a000-000000000002', 'test2@example.com', 'Jane', 'Smith', NOW(), NOW()),
        ('00000000-0000-4000-a000-000000000003', 'test3@example.com', 'Michael', 'Johnson', NOW(), NOW());
    END IF;
END
$$;

-- Create sample health records for testing if health_records table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'health_records') THEN
        -- Clear existing test records
        DELETE FROM health_records WHERE user_id IN ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003');
        
        -- Insert test health records
        INSERT INTO health_records (id, user_id, created_at, updated_at)
        VALUES 
        ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', NOW(), NOW()),
        ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002', NOW(), NOW()),
        ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000003', NOW(), NOW());
    END IF;
END
$$;

-- Create sample device connections for testing if device_connections table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'device_connections') THEN
        -- Clear existing test connections
        DELETE FROM device_connections WHERE record_id IN ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-b000-000000000002', '00000000-0000-4000-b000-000000000003');
        
        -- Insert test device connections
        INSERT INTO device_connections (id, record_id, device_type, device_id, last_sync, status, created_at, updated_at)
        VALUES 
        ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000001', 'smartwatch', 'APPLE-WATCH-001', NOW() - INTERVAL '2 hours', 'connected', NOW(), NOW()),
        ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-b000-000000000002', 'fitness_tracker', 'FITBIT-CHARGE5-001', NOW() - INTERVAL '1 day', 'connected', NOW(), NOW()),
        ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-b000-000000000003', 'smart_scale', 'WITHINGS-SCALE-001', NOW() - INTERVAL '3 days', 'connected', NOW(), NOW()),
        ('00000000-0000-4000-c000-000000000004', '00000000-0000-4000-b000-000000000001', 'blood_pressure_monitor', 'OMRON-BP-001', NOW() - INTERVAL '5 days', 'disconnected', NOW(), NOW());
    END IF;
END
$$;

-- Create sample health goals for testing if health_goals table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'health_goals') THEN
        -- Clear existing test goals
        DELETE FROM health_goals WHERE record_id IN ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-b000-000000000002', '00000000-0000-4000-b000-000000000003');
        
        -- Insert test health goals
        INSERT INTO health_goals (id, record_id, type, title, description, target_value, unit, current_value, status, period, start_date, end_date, created_at, updated_at)
        VALUES 
        ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-b000-000000000001', 'steps', '10,000 Steps Daily', 'Walk 10,000 steps every day', 10000, 'steps', 7500, 'active', 'daily', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', NOW(), NOW()),
        ('00000000-0000-4000-d000-000000000002', '00000000-0000-4000-b000-000000000001', 'weight', 'Weight Loss Goal', 'Lose 5kg over 3 months', 75, 'kg', 80, 'active', 'custom', NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days', NOW(), NOW()),
        ('00000000-0000-4000-d000-000000000003', '00000000-0000-4000-b000-000000000002', 'sleep', 'Better Sleep', 'Get 8 hours of sleep each night', 8, 'hours', 6.5, 'active', 'daily', NOW() - INTERVAL '10 days', NOW() + INTERVAL '80 days', NOW(), NOW()),
        ('00000000-0000-4000-d000-000000000004', '00000000-0000-4000-b000-000000000002', 'exercise', 'Regular Exercise', '30 minutes of exercise 5 days a week', 150, 'minutes', 90, 'active', 'weekly', NOW() - INTERVAL '20 days', NOW() + INTERVAL '70 days', NOW(), NOW()),
        ('00000000-0000-4000-d000-000000000005', '00000000-0000-4000-b000-000000000003', 'blood_pressure', 'Lower Blood Pressure', 'Maintain blood pressure below 130/85', 130, 'mmHg', 142, 'active', 'daily', NOW() - INTERVAL '45 days', NOW() + INTERVAL '45 days', NOW(), NOW()),
        ('00000000-0000-4000-d000-000000000006', '00000000-0000-4000-b000-000000000003', 'water', 'Stay Hydrated', 'Drink 2.5 liters of water daily', 2500, 'ml', 1800, 'active', 'daily', NOW() - INTERVAL '5 days', NOW() + INTERVAL '85 days', NOW(), NOW());
    END IF;
END
$$;

-- Create sample medical events for testing if medical_events table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medical_events') THEN
        -- Clear existing test events
        DELETE FROM medical_events WHERE record_id IN ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-b000-000000000002', '00000000-0000-4000-b000-000000000003');
        
        -- Insert test medical events
        INSERT INTO medical_events (id, record_id, type, description, date, provider, documents, created_at, updated_at)
        VALUES 
        ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-b000-000000000001', 'ANNUAL_CHECKUP', 'Annual physical examination', NOW() - INTERVAL '60 days', 'Dr. Sarah Johnson', '{}', NOW(), NOW()),
        ('00000000-0000-4000-e000-000000000002', '00000000-0000-4000-b000-000000000001', 'BLOOD_TEST', 'Routine blood panel', NOW() - INTERVAL '60 days', 'LabCorp', '{"blood_test_results.pdf"}', NOW(), NOW()),
        ('00000000-0000-4000-e000-000000000003', '00000000-0000-4000-b000-000000000001', 'VACCINATION', 'Flu vaccine', NOW() - INTERVAL '45 days', 'Dr. Sarah Johnson', '{}', NOW(), NOW()),
        
        ('00000000-0000-4000-e000-000000000004', '00000000-0000-4000-b000-000000000002', 'SPECIALIST_VISIT', 'Cardiology consultation', NOW() - INTERVAL '30 days', 'Dr. Michael Chen', '{}', NOW(), NOW()),
        ('00000000-0000-4000-e000-000000000005', '00000000-0000-4000-b000-000000000002', 'IMAGING', 'Chest X-ray', NOW() - INTERVAL '30 days', 'City Hospital Radiology', '{"xray_report.pdf"}', NOW(), NOW()),
        ('00000000-0000-4000-e000-000000000006', '00000000-0000-4000-b000-000000000002', 'PRESCRIPTION', 'Lisinopril 10mg daily', NOW() - INTERVAL '30 days', 'Dr. Michael Chen', '{}', NOW(), NOW()),
        
        ('00000000-0000-4000-e000-000000000007', '00000000-0000-4000-b000-000000000003', 'EMERGENCY_VISIT', 'Severe abdominal pain', NOW() - INTERVAL '90 days', 'Memorial Hospital ER', '{"er_discharge.pdf"}', NOW(), NOW()),
        ('00000000-0000-4000-e000-000000000008', '00000000-0000-4000-b000-000000000003', 'SURGERY', 'Appendectomy', NOW() - INTERVAL '89 days', 'Dr. Robert Williams', '{"surgical_report.pdf", "pathology_report.pdf"}', NOW(), NOW()),
        ('00000000-0000-4000-e000-000000000009', '00000000-0000-4000-b000-000000000003', 'TELEMEDICINE', 'Post-surgical follow-up', NOW() - INTERVAL '75 days', 'Dr. Robert Williams', '{}', NOW(), NOW());
    END IF;
END
$$;

-- =========================================================================
-- END OF SEED SCRIPT
-- =========================================================================