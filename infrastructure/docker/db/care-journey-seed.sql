-- Care Journey Database Seed Script
-- Purpose: Populate the care_journey database with initial data for development and testing

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data (if any) to prevent duplicates during development
TRUNCATE TABLE providers CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE medications CASCADE;
TRUNCATE TABLE treatment_plans CASCADE;
TRUNCATE TABLE telemedicine_sessions CASCADE;

-- =============================================
-- PROVIDERS
-- =============================================

-- Insert healthcare providers with different specialties
INSERT INTO providers (id, name, specialty, practice_location, contact_phone, contact_email, telemedicine_available, created_at, updated_at)
VALUES
  -- Primary Care Physicians
  (uuid_generate_v4(), 'Dr. Ana Silva', 'Clínico Geral', 'São Paulo - Centro', '+55 11 3456-7890', 'ana.silva@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dr. Carlos Mendes', 'Clínico Geral', 'São Paulo - Pinheiros', '+55 11 3456-7891', 'carlos.mendes@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dra. Juliana Costa', 'Clínico Geral', 'São Paulo - Moema', '+55 11 3456-7892', 'juliana.costa@austacare.com.br', true, NOW(), NOW()),
  
  -- Specialists
  (uuid_generate_v4(), 'Dr. Roberto Almeida', 'Cardiologia', 'São Paulo - Jardins', '+55 11 3456-7893', 'roberto.almeida@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dra. Fernanda Santos', 'Dermatologia', 'São Paulo - Itaim Bibi', '+55 11 3456-7894', 'fernanda.santos@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dr. Marcelo Oliveira', 'Ortopedia', 'São Paulo - Moema', '+55 11 3456-7895', 'marcelo.oliveira@austacare.com.br', false, NOW(), NOW()),
  (uuid_generate_v4(), 'Dra. Patricia Lima', 'Ginecologia', 'São Paulo - Pinheiros', '+55 11 3456-7896', 'patricia.lima@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dr. Eduardo Martins', 'Neurologia', 'São Paulo - Vila Mariana', '+55 11 3456-7897', 'eduardo.martins@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dra. Camila Rocha', 'Pediatria', 'São Paulo - Tatuapé', '+55 11 3456-7898', 'camila.rocha@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dr. Ricardo Nunes', 'Psiquiatria', 'São Paulo - Jardins', '+55 11 3456-7899', 'ricardo.nunes@austacare.com.br', true, NOW(), NOW()),
  
  -- Mental Health Specialists
  (uuid_generate_v4(), 'Dra. Beatriz Campos', 'Psicologia', 'São Paulo - Pinheiros', '+55 11 3456-7900', 'beatriz.campos@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dr. Felipe Barros', 'Psicologia', 'São Paulo - Vila Madalena', '+55 11 3456-7901', 'felipe.barros@austacare.com.br', true, NOW(), NOW()),
  
  -- Nutritionists
  (uuid_generate_v4(), 'Dra. Luciana Ferreira', 'Nutrição', 'São Paulo - Moema', '+55 11 3456-7902', 'luciana.ferreira@austacare.com.br', true, NOW(), NOW()),
  (uuid_generate_v4(), 'Dr. Gabriel Souza', 'Nutrição', 'São Paulo - Pinheiros', '+55 11 3456-7903', 'gabriel.souza@austacare.com.br', true, NOW(), NOW()),
  
  -- Physical Therapists
  (uuid_generate_v4(), 'Dra. Amanda Vieira', 'Fisioterapia', 'São Paulo - Vila Mariana', '+55 11 3456-7904', 'amanda.vieira@austacare.com.br', false, NOW(), NOW()),
  (uuid_generate_v4(), 'Dr. Thiago Pereira', 'Fisioterapia', 'São Paulo - Moema', '+55 11 3456-7905', 'thiago.pereira@austacare.com.br', false, NOW(), NOW());

-- Store provider IDs for reference in other tables
DO $$
DECLARE
  provider_ids UUID[] := ARRAY(
    SELECT id FROM providers ORDER BY created_at
  );
  
  -- Sample user IDs (these would normally come from the auth service)
  user_id_1 UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  user_id_2 UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
  user_id_3 UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
  
  -- Variables for appointment creation
  appointment_id UUID;
  telemedicine_appointment_id UUID;
  
  -- Current timestamp for reference
  current_date TIMESTAMP := NOW();
  future_date TIMESTAMP;
  past_date TIMESTAMP;
  
 BEGIN
  -- =============================================
  -- APPOINTMENTS
  -- =============================================
  
  -- Create future appointments (scheduled)
  future_date := current_date + interval '2 days';
  INSERT INTO appointments (id, user_id, provider_id, scheduled_at, type, status, created_at, updated_at)
  VALUES 
    (uuid_generate_v4(), user_id_1, provider_ids[1], future_date + interval '10 hours', 'IN_PERSON', 'SCHEDULED', current_date, current_date),
    (uuid_generate_v4(), user_id_2, provider_ids[4], future_date + interval '11 hours', 'IN_PERSON', 'SCHEDULED', current_date, current_date),
    (uuid_generate_v4(), user_id_3, provider_ids[7], future_date + interval '14 hours', 'IN_PERSON', 'SCHEDULED', current_date, current_date);
  
  -- Create telemedicine appointments (one for future use)
  telemedicine_appointment_id := uuid_generate_v4();
  INSERT INTO appointments (id, user_id, provider_id, scheduled_at, type, status, created_at, updated_at)
  VALUES 
    (telemedicine_appointment_id, user_id_1, provider_ids[2], future_date + interval '13 hours', 'TELEMEDICINE', 'SCHEDULED', current_date, current_date),
    (uuid_generate_v4(), user_id_2, provider_ids[5], future_date + interval '15 hours 30 minutes', 'TELEMEDICINE', 'SCHEDULED', current_date, current_date);
  
  -- Create past appointments (completed)
  past_date := current_date - interval '5 days';
  INSERT INTO appointments (id, user_id, provider_id, scheduled_at, type, status, created_at, updated_at)
  VALUES 
    (uuid_generate_v4(), user_id_1, provider_ids[3], past_date + interval '9 hours', 'IN_PERSON', 'COMPLETED', past_date - interval '10 days', past_date),
    (uuid_generate_v4(), user_id_1, provider_ids[6], past_date + interval '14 hours', 'IN_PERSON', 'COMPLETED', past_date - interval '15 days', past_date),
    (uuid_generate_v4(), user_id_2, provider_ids[8], past_date + interval '11 hours', 'IN_PERSON', 'COMPLETED', past_date - interval '12 days', past_date),
    (uuid_generate_v4(), user_id_3, provider_ids[10], past_date + interval '16 hours', 'IN_PERSON', 'COMPLETED', past_date - interval '14 days', past_date);
  
  -- Create past telemedicine appointments (completed)
  appointment_id := uuid_generate_v4();
  INSERT INTO appointments (id, user_id, provider_id, scheduled_at, type, status, created_at, updated_at)
  VALUES 
    (appointment_id, user_id_1, provider_ids[11], past_date + interval '10 hours', 'TELEMEDICINE', 'COMPLETED', past_date - interval '7 days', past_date);
  
  -- Create cancelled appointments
  INSERT INTO appointments (id, user_id, provider_id, scheduled_at, type, status, created_at, updated_at)
  VALUES 
    (uuid_generate_v4(), user_id_2, provider_ids[9], past_date + interval '13 hours', 'IN_PERSON', 'CANCELLED', past_date - interval '8 days', past_date - interval '6 days'),
    (uuid_generate_v4(), user_id_3, provider_ids[12], past_date + interval '15 hours', 'TELEMEDICINE', 'CANCELLED', past_date - interval '9 days', past_date - interval '7 days');
  
  -- =============================================
  -- TELEMEDICINE SESSIONS
  -- =============================================
  
  -- Create a completed telemedicine session for the past appointment
  INSERT INTO telemedicine_sessions (id, appointment_id, patient_id, provider_id, start_time, end_time, status, created_at, updated_at)
  VALUES 
    (uuid_generate_v4(), appointment_id, user_id_1, provider_ids[11], past_date + interval '10 hours', past_date + interval '10 hours 30 minutes', 'COMPLETED', past_date, past_date);
  
  -- =============================================
  -- MEDICATIONS
  -- =============================================
  
  -- Create medications for users
  INSERT INTO medications (id, user_id, name, dosage, frequency, start_date, end_date, reminder_enabled, notes, active, created_at, updated_at)
  VALUES
    -- User 1 medications
    (uuid_generate_v4(), user_id_1, 'Losartana', '50mg', 'Uma vez ao dia', current_date - interval '30 days', current_date + interval '60 days', true, 'Tomar pela manhã com alimento', true, current_date - interval '30 days', current_date - interval '30 days'),
    (uuid_generate_v4(), user_id_1, 'Atorvastatina', '20mg', 'Uma vez ao dia', current_date - interval '60 days', current_date + interval '30 days', true, 'Tomar à noite antes de dormir', true, current_date - interval '60 days', current_date - interval '60 days'),
    
    -- User 2 medications
    (uuid_generate_v4(), user_id_2, 'Levotiroxina', '75mcg', 'Uma vez ao dia', current_date - interval '90 days', current_date + interval '90 days', true, 'Tomar em jejum, 30 minutos antes do café da manhã', true, current_date - interval '90 days', current_date - interval '90 days'),
    (uuid_generate_v4(), user_id_2, 'Escitalopram', '10mg', 'Uma vez ao dia', current_date - interval '45 days', current_date + interval '45 days', true, 'Tomar pela manhã', true, current_date - interval '45 days', current_date - interval '45 days'),
    
    -- User 3 medications
    (uuid_generate_v4(), user_id_3, 'Metformina', '500mg', 'Duas vezes ao dia', current_date - interval '120 days', current_date + interval '60 days', true, 'Tomar com as refeições', true, current_date - interval '120 days', current_date - interval '120 days'),
    (uuid_generate_v4(), user_id_3, 'Omeprazol', '20mg', 'Uma vez ao dia', current_date - interval '15 days', current_date + interval '15 days', true, 'Tomar 30 minutos antes do café da manhã', true, current_date - interval '15 days', current_date - interval '15 days'),
    (uuid_generate_v4(), user_id_3, 'Ibuprofeno', '400mg', 'A cada 8 horas conforme necessário', current_date - interval '5 days', current_date + interval '5 days', false, 'Tomar para dor nas costas conforme necessário', true, current_date - interval '5 days', current_date - interval '5 days');
  
  -- =============================================
  -- TREATMENT PLANS
  -- =============================================
  
  -- Create treatment plans for users
  INSERT INTO treatment_plans (id, name, description, start_date, end_date, progress, created_at, updated_at)
  VALUES
    -- User 1 treatment plan
    (uuid_generate_v4(), 'Plano de Controle de Hipertensão', 'Plano de tratamento para controle de pressão arterial com medicação e mudanças no estilo de vida', current_date - interval '30 days', current_date + interval '150 days', 35, current_date - interval '30 days', current_date),
    
    -- User 2 treatment plan
    (uuid_generate_v4(), 'Plano de Tratamento para Hipotireoidismo', 'Plano de tratamento para regulação da tireoide com medicação e acompanhamento', current_date - interval '90 days', current_date + interval '275 days', 45, current_date - interval '90 days', current_date),
    
    -- User 3 treatment plans
    (uuid_generate_v4(), 'Plano de Controle de Diabetes Tipo 2', 'Plano de tratamento para controle de glicemia com medicação, dieta e exercícios', current_date - interval '120 days', current_date + interval '245 days', 60, current_date - interval '120 days', current_date),
    (uuid_generate_v4(), 'Plano de Fisioterapia para Lombalgia', 'Plano de tratamento para dor lombar com exercícios e terapia física', current_date - interval '5 days', current_date + interval '25 days', 10, current_date - interval '5 days', current_date);

END $$;

-- =============================================
-- COMMIT TRANSACTION
-- =============================================

COMMIT;

-- Log completion message
DO $$
BEGIN
  RAISE NOTICE 'Care Journey seed data successfully loaded.';
END $$;