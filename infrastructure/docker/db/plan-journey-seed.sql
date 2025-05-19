-- Plan Journey Database Seed Script
-- This script populates the plan_journey database with initial seed data
-- for development and testing purposes.

-- Disable triggers temporarily for faster loading
SET session_replication_role = 'replica';

-- Clear existing data (if any)
TRUNCATE TABLE plans CASCADE;
TRUNCATE TABLE coverage_types CASCADE;
TRUNCATE TABLE benefits CASCADE;
TRUNCATE TABLE benefit_categories CASCADE;
TRUNCATE TABLE claim_types CASCADE;
TRUNCATE TABLE claim_statuses CASCADE;
TRUNCATE TABLE claims CASCADE;
TRUNCATE TABLE documents CASCADE;

-- Plan Types
INSERT INTO plan_types (id, name, description, active) VALUES
(1, 'BASIC', 'Basic health insurance plan with essential coverage', true),
(2, 'STANDARD', 'Standard health insurance with expanded coverage', true),
(3, 'PREMIUM', 'Premium health insurance with comprehensive coverage', true),
(4, 'FAMILY', 'Family health insurance plan', true),
(5, 'SENIOR', 'Health insurance plan for seniors', true);

-- Plans
INSERT INTO plans (id, plan_type_id, name, description, monthly_premium, annual_deductible, max_annual_coverage, active, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 1, 'Basic Health Plan', 'Essential coverage for individuals', 199.99, 2000.00, 50000.00, true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 2, 'Standard Health Plan', 'Comprehensive coverage for individuals', 299.99, 1500.00, 100000.00, true, NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 3, 'Premium Health Plan', 'Premium coverage with additional benefits', 399.99, 1000.00, 250000.00, true, NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 4, 'Family Health Plan', 'Comprehensive coverage for families', 599.99, 3000.00, 500000.00, true, NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 5, 'Senior Health Plan', 'Specialized coverage for seniors', 349.99, 1200.00, 200000.00, true, NOW(), NOW());

-- Coverage Types
INSERT INTO coverage_types (id, name, description, active) VALUES
(1, 'PREVENTIVE', 'Preventive care services', true),
(2, 'EMERGENCY', 'Emergency medical services', true),
(3, 'HOSPITALIZATION', 'Hospital services and stays', true),
(4, 'OUTPATIENT', 'Outpatient medical services', true),
(5, 'PRESCRIPTION', 'Prescription medication coverage', true),
(6, 'SPECIALIST', 'Specialist medical services', true),
(7, 'MENTAL_HEALTH', 'Mental health services', true),
(8, 'MATERNITY', 'Maternity and newborn care', true),
(9, 'PEDIATRIC', 'Pediatric services', true),
(10, 'REHABILITATION', 'Rehabilitation services', true);

-- Benefit Categories
INSERT INTO benefit_categories (id, name, description, active) VALUES
(1, 'MEDICAL', 'Medical services and procedures', true),
(2, 'PHARMACY', 'Prescription medications and pharmacy services', true),
(3, 'DENTAL', 'Dental services and procedures', true),
(4, 'VISION', 'Vision services and eyewear', true),
(5, 'WELLNESS', 'Wellness programs and preventive services', true),
(6, 'TELEHEALTH', 'Remote healthcare services', true),
(7, 'ALTERNATIVE', 'Alternative medicine and therapies', true);

-- Coverage (linking plans with coverage types)
INSERT INTO coverage (id, plan_id, coverage_type_id, coverage_percentage, copay_amount, max_annual_limit, active, created_at, updated_at) VALUES
-- Basic Plan Coverage
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 1, 100, 0.00, 5000.00, true, NOW(), NOW()),      -- Preventive: 100%, no copay
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 2, 70, 150.00, 10000.00, true, NOW(), NOW()),    -- Emergency: 70%, $150 copay
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 3, 60, 250.00, 20000.00, true, NOW(), NOW()),    -- Hospitalization: 60%, $250 copay
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 4, 70, 50.00, 5000.00, true, NOW(), NOW()),      -- Outpatient: 70%, $50 copay
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 5, 50, 20.00, 2000.00, true, NOW(), NOW()),      -- Prescription: 50%, $20 copay

-- Standard Plan Coverage
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 1, 100, 0.00, 10000.00, true, NOW(), NOW()),     -- Preventive: 100%, no copay
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 2, 80, 100.00, 20000.00, true, NOW(), NOW()),    -- Emergency: 80%, $100 copay
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 3, 70, 200.00, 40000.00, true, NOW(), NOW()),    -- Hospitalization: 70%, $200 copay
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 4, 80, 30.00, 10000.00, true, NOW(), NOW()),     -- Outpatient: 80%, $30 copay
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 5, 70, 15.00, 5000.00, true, NOW(), NOW()),      -- Prescription: 70%, $15 copay
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 6, 70, 50.00, 5000.00, true, NOW(), NOW()),      -- Specialist: 70%, $50 copay
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 7, 70, 40.00, 3000.00, true, NOW(), NOW()),      -- Mental Health: 70%, $40 copay

-- Premium Plan Coverage
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 1, 100, 0.00, 20000.00, true, NOW(), NOW()),     -- Preventive: 100%, no copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 2, 90, 50.00, 50000.00, true, NOW(), NOW()),     -- Emergency: 90%, $50 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 3, 80, 150.00, 100000.00, true, NOW(), NOW()),   -- Hospitalization: 80%, $150 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 4, 90, 20.00, 20000.00, true, NOW(), NOW()),     -- Outpatient: 90%, $20 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 5, 80, 10.00, 10000.00, true, NOW(), NOW()),     -- Prescription: 80%, $10 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 6, 80, 30.00, 10000.00, true, NOW(), NOW()),     -- Specialist: 80%, $30 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 7, 80, 25.00, 8000.00, true, NOW(), NOW()),      -- Mental Health: 80%, $25 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 8, 80, 100.00, 15000.00, true, NOW(), NOW()),    -- Maternity: 80%, $100 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 9, 90, 20.00, 10000.00, true, NOW(), NOW()),     -- Pediatric: 90%, $20 copay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 10, 80, 30.00, 10000.00, true, NOW(), NOW()),    -- Rehabilitation: 80%, $30 copay

-- Family Plan Coverage
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 1, 100, 0.00, 30000.00, true, NOW(), NOW()),     -- Preventive: 100%, no copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 2, 85, 75.00, 75000.00, true, NOW(), NOW()),     -- Emergency: 85%, $75 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 3, 75, 175.00, 150000.00, true, NOW(), NOW()),   -- Hospitalization: 75%, $175 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 4, 85, 25.00, 30000.00, true, NOW(), NOW()),     -- Outpatient: 85%, $25 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 5, 75, 12.00, 15000.00, true, NOW(), NOW()),     -- Prescription: 75%, $12 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 6, 75, 40.00, 15000.00, true, NOW(), NOW()),     -- Specialist: 75%, $40 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 7, 75, 30.00, 10000.00, true, NOW(), NOW()),     -- Mental Health: 75%, $30 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 8, 85, 75.00, 20000.00, true, NOW(), NOW()),     -- Maternity: 85%, $75 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 9, 90, 15.00, 15000.00, true, NOW(), NOW()),     -- Pediatric: 90%, $15 copay
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 10, 75, 35.00, 15000.00, true, NOW(), NOW()),    -- Rehabilitation: 75%, $35 copay

-- Senior Plan Coverage
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 1, 100, 0.00, 15000.00, true, NOW(), NOW()),     -- Preventive: 100%, no copay
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 2, 85, 75.00, 30000.00, true, NOW(), NOW()),     -- Emergency: 85%, $75 copay
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 3, 80, 150.00, 80000.00, true, NOW(), NOW()),    -- Hospitalization: 80%, $150 copay
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 4, 85, 25.00, 15000.00, true, NOW(), NOW()),     -- Outpatient: 85%, $25 copay
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 5, 80, 10.00, 8000.00, true, NOW(), NOW()),      -- Prescription: 80%, $10 copay
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 6, 80, 35.00, 10000.00, true, NOW(), NOW()),     -- Specialist: 80%, $35 copay
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 7, 80, 30.00, 5000.00, true, NOW(), NOW()),      -- Mental Health: 80%, $30 copay
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 10, 85, 25.00, 20000.00, true, NOW(), NOW());    -- Rehabilitation: 85%, $25 copay

-- Benefits
INSERT INTO benefits (id, benefit_category_id, name, description, active, created_at, updated_at) VALUES
-- Medical Benefits
('b1111111-1111-1111-1111-111111111111', 1, 'Primary Care Visit', 'Visit to primary care physician', true, NOW(), NOW()),
('b1111111-1111-1111-1111-111111111112', 1, 'Specialist Visit', 'Visit to specialist physician', true, NOW(), NOW()),
('b1111111-1111-1111-1111-111111111113', 1, 'Urgent Care Visit', 'Visit to urgent care facility', true, NOW(), NOW()),
('b1111111-1111-1111-1111-111111111114', 1, 'Emergency Room Visit', 'Visit to emergency room', true, NOW(), NOW()),
('b1111111-1111-1111-1111-111111111115', 1, 'Hospital Stay', 'Inpatient hospital stay', true, NOW(), NOW()),
('b1111111-1111-1111-1111-111111111116', 1, 'Outpatient Surgery', 'Surgery performed in outpatient setting', true, NOW(), NOW()),
('b1111111-1111-1111-1111-111111111117', 1, 'Diagnostic Tests', 'Laboratory and diagnostic tests', true, NOW(), NOW()),
('b1111111-1111-1111-1111-111111111118', 1, 'Imaging', 'X-rays, CT scans, MRIs', true, NOW(), NOW()),

-- Pharmacy Benefits
('b2222222-2222-2222-2222-222222222221', 2, 'Generic Medications', 'Generic prescription medications', true, NOW(), NOW()),
('b2222222-2222-2222-2222-222222222222', 2, 'Preferred Brand Medications', 'Preferred brand prescription medications', true, NOW(), NOW()),
('b2222222-2222-2222-2222-222222222223', 2, 'Non-Preferred Brand Medications', 'Non-preferred brand prescription medications', true, NOW(), NOW()),
('b2222222-2222-2222-2222-222222222224', 2, 'Specialty Medications', 'Specialty prescription medications', true, NOW(), NOW()),
('b2222222-2222-2222-2222-222222222225', 2, 'Mail Order Pharmacy', '90-day supply through mail order', true, NOW(), NOW()),

-- Dental Benefits
('b3333333-3333-3333-3333-333333333331', 3, 'Preventive Dental', 'Routine cleanings and exams', true, NOW(), NOW()),
('b3333333-3333-3333-3333-333333333332', 3, 'Basic Dental', 'Fillings and simple extractions', true, NOW(), NOW()),
('b3333333-3333-3333-3333-333333333333', 3, 'Major Dental', 'Crowns, bridges, dentures', true, NOW(), NOW()),
('b3333333-3333-3333-3333-333333333334', 3, 'Orthodontia', 'Braces and orthodontic treatment', true, NOW(), NOW()),

-- Vision Benefits
('b4444444-4444-4444-4444-444444444441', 4, 'Eye Exam', 'Routine eye examination', true, NOW(), NOW()),
('b4444444-4444-4444-4444-444444444442', 4, 'Eyeglasses', 'Prescription eyeglasses', true, NOW(), NOW()),
('b4444444-4444-4444-4444-444444444443', 4, 'Contact Lenses', 'Prescription contact lenses', true, NOW(), NOW()),

-- Wellness Benefits
('b5555555-5555-5555-5555-555555555551', 5, 'Annual Physical', 'Annual preventive physical exam', true, NOW(), NOW()),
('b5555555-5555-5555-5555-555555555552', 5, 'Immunizations', 'Preventive immunizations', true, NOW(), NOW()),
('b5555555-5555-5555-5555-555555555553', 5, 'Health Screenings', 'Preventive health screenings', true, NOW(), NOW()),
('b5555555-5555-5555-5555-555555555554', 5, 'Gym Membership', 'Discounted gym membership', true, NOW(), NOW()),

-- Telehealth Benefits
('b6666666-6666-6666-6666-666666666661', 6, 'Virtual Primary Care', 'Virtual visit with primary care physician', true, NOW(), NOW()),
('b6666666-6666-6666-6666-666666666662', 6, 'Virtual Urgent Care', 'Virtual visit for urgent care needs', true, NOW(), NOW()),
('b6666666-6666-6666-6666-666666666663', 6, 'Virtual Mental Health', 'Virtual visit with mental health provider', true, NOW(), NOW()),

-- Alternative Medicine Benefits
('b7777777-7777-7777-7777-777777777771', 7, 'Acupuncture', 'Acupuncture treatment', true, NOW(), NOW()),
('b7777777-7777-7777-7777-777777777772', 7, 'Chiropractic', 'Chiropractic treatment', true, NOW(), NOW()),
('b7777777-7777-7777-7777-777777777773', 7, 'Massage Therapy', 'Therapeutic massage', true, NOW(), NOW());

-- Plan Benefits (linking plans with benefits)
INSERT INTO plan_benefits (id, plan_id, benefit_id, coverage_percentage, copay_amount, max_annual_limit, active, created_at, updated_at) VALUES
-- Basic Plan Benefits (limited selection)
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 80, 30.00, 1000.00, true, NOW(), NOW()),  -- Primary Care Visit
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111114', 70, 150.00, 5000.00, true, NOW(), NOW()), -- Emergency Room Visit
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111115', 60, 250.00, 10000.00, true, NOW(), NOW()), -- Hospital Stay
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222221', 70, 10.00, 500.00, true, NOW(), NOW()),   -- Generic Medications
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'b5555555-5555-5555-5555-555555555551', 100, 0.00, 500.00, true, NOW(), NOW()),   -- Annual Physical

-- Standard Plan Benefits (moderate selection)
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 90, 20.00, 2000.00, true, NOW(), NOW()),  -- Primary Care Visit
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111112', 80, 40.00, 1500.00, true, NOW(), NOW()),  -- Specialist Visit
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111113', 80, 50.00, 1000.00, true, NOW(), NOW()),  -- Urgent Care Visit
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111114', 80, 100.00, 10000.00, true, NOW(), NOW()), -- Emergency Room Visit
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111115', 70, 200.00, 20000.00, true, NOW(), NOW()), -- Hospital Stay
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111117', 80, 30.00, 2000.00, true, NOW(), NOW()),  -- Diagnostic Tests
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222221', 80, 10.00, 1000.00, true, NOW(), NOW()),  -- Generic Medications
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 60, 30.00, 1000.00, true, NOW(), NOW()),  -- Preferred Brand Medications
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555551', 100, 0.00, 1000.00, true, NOW(), NOW()),  -- Annual Physical
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555552', 100, 0.00, 500.00, true, NOW(), NOW()),   -- Immunizations
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'b6666666-6666-6666-6666-666666666661', 80, 20.00, 500.00, true, NOW(), NOW()),   -- Virtual Primary Care

-- Premium Plan Benefits (comprehensive selection)
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 90, 15.00, 3000.00, true, NOW(), NOW()),  -- Primary Care Visit
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111112', 90, 30.00, 2500.00, true, NOW(), NOW()),  -- Specialist Visit
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111113', 90, 35.00, 2000.00, true, NOW(), NOW()),  -- Urgent Care Visit
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111114', 90, 50.00, 15000.00, true, NOW(), NOW()), -- Emergency Room Visit
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111115', 80, 150.00, 50000.00, true, NOW(), NOW()), -- Hospital Stay
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111116', 80, 100.00, 10000.00, true, NOW(), NOW()), -- Outpatient Surgery
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111117', 90, 20.00, 3000.00, true, NOW(), NOW()),  -- Diagnostic Tests
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111118', 80, 50.00, 5000.00, true, NOW(), NOW()),  -- Imaging
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222221', 90, 5.00, 2000.00, true, NOW(), NOW()),   -- Generic Medications
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 80, 20.00, 2000.00, true, NOW(), NOW()),  -- Preferred Brand Medications
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222223', 60, 40.00, 2000.00, true, NOW(), NOW()),  -- Non-Preferred Brand Medications
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222224', 50, 100.00, 5000.00, true, NOW(), NOW()), -- Specialty Medications
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333331', 80, 0.00, 500.00, true, NOW(), NOW()),   -- Preventive Dental
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444441', 80, 0.00, 200.00, true, NOW(), NOW()),   -- Eye Exam
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555551', 100, 0.00, 1500.00, true, NOW(), NOW()),  -- Annual Physical
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555552', 100, 0.00, 1000.00, true, NOW(), NOW()),  -- Immunizations
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555553', 100, 0.00, 1000.00, true, NOW(), NOW()),  -- Health Screenings
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666661', 90, 10.00, 1000.00, true, NOW(), NOW()),  -- Virtual Primary Care
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666662', 90, 15.00, 1000.00, true, NOW(), NOW()),  -- Virtual Urgent Care
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666663', 90, 20.00, 1000.00, true, NOW(), NOW()),  -- Virtual Mental Health
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'b7777777-7777-7777-7777-777777777772', 70, 30.00, 1000.00, true, NOW(), NOW());  -- Chiropractic

-- Claim Types
INSERT INTO claim_types (id, name, description, active) VALUES
(1, 'MEDICAL', 'Medical service claims', true),
(2, 'PHARMACY', 'Prescription medication claims', true),
(3, 'DENTAL', 'Dental service claims', true),
(4, 'VISION', 'Vision service claims', true),
(5, 'WELLNESS', 'Wellness program claims', true);

-- Claim Statuses
INSERT INTO claim_statuses (id, name, description, active) VALUES
(1, 'SUBMITTED', 'Claim has been submitted', true),
(2, 'VALIDATING', 'Claim is being validated', true),
(3, 'PROCESSING', 'Claim is being processed', true),
(4, 'UNDER_REVIEW', 'Claim is under review', true),
(5, 'ADDITIONAL_INFO_REQUIRED', 'Additional information is required', true),
(6, 'APPROVED', 'Claim has been approved', true),
(7, 'PAYMENT_PENDING', 'Payment is pending', true),
(8, 'COMPLETED', 'Claim has been completed', true),
(9, 'DENIED', 'Claim has been denied', true),
(10, 'REJECTED', 'Claim has been rejected', true),
(11, 'FAILED', 'Claim processing has failed', true),
(12, 'RESUBMITTING', 'Claim is being resubmitted', true);

-- Sample Claims
INSERT INTO claims (id, user_id, plan_id, claim_type_id, claim_status_id, service_date, submission_date, provider_name, provider_npi, diagnosis_code, procedure_code, billed_amount, allowed_amount, paid_amount, member_responsibility, notes, active, created_at, updated_at) VALUES
-- Completed Claims
('c1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 8, '2023-01-15', '2023-01-20', 'Dr. John Smith', '1234567890', 'J45.901', '99213', 150.00, 120.00, 96.00, 24.00, 'Office visit for asthma', true, NOW(), NOW()),
('c2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 8, '2023-02-10', '2023-02-12', 'Dr. Sarah Johnson', '2345678901', 'M54.5', '99214', 200.00, 180.00, 144.00, 36.00, 'Office visit for lower back pain', true, NOW(), NOW()),
('c3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 2, 8, '2023-02-15', '2023-02-15', 'City Pharmacy', '3456789012', 'E11.9', 'NDC12345678', 75.00, 60.00, 54.00, 6.00, 'Metformin prescription', true, NOW(), NOW()),

-- In-Progress Claims
('c4444444-4444-4444-4444-444444444444', 'u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 3, '2023-03-01', '2023-03-05', 'County Hospital', '4567890123', 'R07.9', '99285', 1200.00, 950.00, 0.00, 0.00, 'Emergency room visit for chest pain', true, NOW(), NOW()),
('c5555555-5555-5555-5555-555555555555', 'u2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 4, '2023-03-10', '2023-03-12', 'Dr. Michael Brown', '5678901234', 'M25.561', '29826', 4500.00, 3800.00, 0.00, 0.00, 'Arthroscopic shoulder surgery', true, NOW(), NOW()),
('c6666666-6666-6666-6666-666666666666', 'u3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 3, 5, '2023-03-15', '2023-03-16', 'Smile Dental', '6789012345', 'K02.9', 'D2392', 250.00, 200.00, 0.00, 0.00, 'Dental filling', true, NOW(), NOW()),

-- Denied/Rejected Claims
('c7777777-7777-7777-7777-777777777777', 'u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 9, '2023-01-05', '2023-01-10', 'Dr. Lisa Wilson', '7890123456', 'Z00.00', '99385', 300.00, 0.00, 0.00, 300.00, 'Annual physical - denied due to frequency limitation', true, NOW(), NOW()),
('c8888888-8888-8888-8888-888888888888', 'u2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 4, 10, '2023-02-20', '2023-02-22', 'Clear Vision', '8901234567', 'H52.4', '92015', 150.00, 0.00, 0.00, 150.00, 'Vision exam - rejected due to incomplete information', true, NOW(), NOW()),

-- Recently Submitted Claims
('c9999999-9999-9999-9999-999999999999', 'u3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1, 1, '2023-03-25', '2023-03-26', 'Dr. Robert Taylor', '9012345678', 'J30.1', '99213', 150.00, 0.00, 0.00, 0.00, 'Office visit for allergies', true, NOW(), NOW()),
('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 2, 2, '2023-03-26', '2023-03-26', 'Med Pharmacy', '0123456789', 'J30.1', 'NDC87654321', 60.00, 0.00, 0.00, 0.00, 'Allergy medication', true, NOW(), NOW());

-- Sample Documents
INSERT INTO documents (id, claim_id, document_type, file_name, file_path, file_size, mime_type, uploaded_at, active, created_at, updated_at) VALUES
('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'INVOICE', 'invoice_c1111111.pdf', '/documents/claims/c1111111-1111-1111-1111-111111111111/invoice_c1111111.pdf', 256000, 'application/pdf', '2023-01-20', true, NOW(), NOW()),
('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'INVOICE', 'invoice_c2222222.pdf', '/documents/claims/c2222222-2222-2222-2222-222222222222/invoice_c2222222.pdf', 312000, 'application/pdf', '2023-02-12', true, NOW(), NOW()),
('d3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'RECEIPT', 'receipt_c3333333.pdf', '/documents/claims/c3333333-3333-3333-3333-333333333333/receipt_c3333333.pdf', 128000, 'application/pdf', '2023-02-15', true, NOW(), NOW()),
('d4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'MEDICAL_RECORD', 'medical_record_c4444444.pdf', '/documents/claims/c4444444-4444-4444-4444-444444444444/medical_record_c4444444.pdf', 512000, 'application/pdf', '2023-03-05', true, NOW(), NOW()),
('d5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'MEDICAL_RECORD', 'medical_record_c5555555.pdf', '/documents/claims/c5555555-5555-5555-5555-555555555555/medical_record_c5555555.pdf', 768000, 'application/pdf', '2023-03-12', true, NOW(), NOW()),
('d6666666-6666-6666-6666-666666666666', 'c5555555-5555-5555-5555-555555555555', 'INVOICE', 'invoice_c5555555.pdf', '/documents/claims/c5555555-5555-5555-5555-555555555555/invoice_c5555555.pdf', 384000, 'application/pdf', '2023-03-12', true, NOW(), NOW()),
('d7777777-7777-7777-7777-777777777777', 'c6666666-6666-6666-6666-666666666666', 'INVOICE', 'invoice_c6666666.pdf', '/documents/claims/c6666666-6666-6666-6666-666666666666/invoice_c6666666.pdf', 192000, 'application/pdf', '2023-03-16', true, NOW(), NOW()),
('d8888888-8888-8888-8888-888888888888', 'c9999999-9999-9999-9999-999999999999', 'INVOICE', 'invoice_c9999999.pdf', '/documents/claims/c9999999-9999-9999-9999-999999999999/invoice_c9999999.pdf', 224000, 'application/pdf', '2023-03-26', true, NOW(), NOW());

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Notify completion
SELECT 'Plan Journey database seed completed successfully' as result;