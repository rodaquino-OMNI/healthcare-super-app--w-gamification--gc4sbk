-- AUSTA SuperApp Auth Database Seed Script
-- This script populates the auth database with initial data for development and testing
-- It includes users, roles, permissions, and user-role mappings

-- Clear existing data (if any)
TRUNCATE TABLE users_roles CASCADE;
TRUNCATE TABLE roles_permissions CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE permissions CASCADE;

-- =============================================
-- PERMISSIONS
-- Format: journey:resource:action
-- =============================================

-- Global permissions (not specific to any journey)
INSERT INTO permissions (id, name, description) VALUES
('11111111-1111-1111-1111-111111111101', 'global:admin', 'Full administrative access across all journeys'),
('11111111-1111-1111-1111-111111111102', 'global:user:read', 'View user information'),
('11111111-1111-1111-1111-111111111103', 'global:user:create', 'Create new users'),
('11111111-1111-1111-1111-111111111104', 'global:user:update', 'Update user information'),
('11111111-1111-1111-1111-111111111105', 'global:user:delete', 'Delete users'),
('11111111-1111-1111-1111-111111111106', 'global:role:read', 'View roles'),
('11111111-1111-1111-1111-111111111107', 'global:role:create', 'Create new roles'),
('11111111-1111-1111-1111-111111111108', 'global:role:update', 'Update roles'),
('11111111-1111-1111-1111-111111111109', 'global:role:delete', 'Delete roles'),
('11111111-1111-1111-1111-111111111110', 'global:permission:read', 'View permissions'),
('11111111-1111-1111-1111-111111111111', 'global:permission:create', 'Create new permissions'),
('11111111-1111-1111-1111-111111111112', 'global:permission:update', 'Update permissions'),
('11111111-1111-1111-1111-111111111113', 'global:permission:delete', 'Delete permissions');

-- Health Journey permissions
INSERT INTO permissions (id, name, description) VALUES
-- Health metrics
('22222222-2222-2222-2222-222222222201', 'health:metrics:read', 'View health metrics'),
('22222222-2222-2222-2222-222222222202', 'health:metrics:create', 'Record new health metrics'),
('22222222-2222-2222-2222-222222222203', 'health:metrics:update', 'Update health metrics'),
('22222222-2222-2222-2222-222222222204', 'health:metrics:delete', 'Delete health metrics'),
-- Health goals
('22222222-2222-2222-2222-222222222205', 'health:goals:read', 'View health goals'),
('22222222-2222-2222-2222-222222222206', 'health:goals:create', 'Create health goals'),
('22222222-2222-2222-2222-222222222207', 'health:goals:update', 'Update health goals'),
('22222222-2222-2222-2222-222222222208', 'health:goals:delete', 'Delete health goals'),
-- Device connections
('22222222-2222-2222-2222-222222222209', 'health:devices:read', 'View connected health devices'),
('22222222-2222-2222-2222-222222222210', 'health:devices:create', 'Connect new health devices'),
('22222222-2222-2222-2222-222222222211', 'health:devices:update', 'Update device connections'),
('22222222-2222-2222-2222-222222222212', 'health:devices:delete', 'Remove device connections'),
-- Medical events
('22222222-2222-2222-2222-222222222213', 'health:events:read', 'View medical events'),
('22222222-2222-2222-2222-222222222214', 'health:events:create', 'Record medical events'),
('22222222-2222-2222-2222-222222222215', 'health:events:update', 'Update medical events'),
('22222222-2222-2222-2222-222222222216', 'health:events:delete', 'Delete medical events'),
-- Health insights
('22222222-2222-2222-2222-222222222217', 'health:insights:read', 'View health insights'),
('22222222-2222-2222-2222-222222222218', 'health:admin', 'Administrative access to Health journey');

-- Care Journey permissions
INSERT INTO permissions (id, name, description) VALUES
-- Appointments
('33333333-3333-3333-3333-333333333301', 'care:appointments:read', 'View appointments'),
('33333333-3333-3333-3333-333333333302', 'care:appointments:create', 'Schedule appointments'),
('33333333-3333-3333-3333-333333333303', 'care:appointments:update', 'Reschedule appointments'),
('33333333-3333-3333-3333-333333333304', 'care:appointments:delete', 'Cancel appointments'),
-- Medications
('33333333-3333-3333-3333-333333333305', 'care:medications:read', 'View medications'),
('33333333-3333-3333-3333-333333333306', 'care:medications:create', 'Add medications'),
('33333333-3333-3333-3333-333333333307', 'care:medications:update', 'Update medications'),
('33333333-3333-3333-3333-333333333308', 'care:medications:delete', 'Remove medications'),
-- Providers
('33333333-3333-3333-3333-333333333309', 'care:providers:read', 'View healthcare providers'),
('33333333-3333-3333-3333-333333333310', 'care:providers:create', 'Add healthcare providers'),
('33333333-3333-3333-3333-333333333311', 'care:providers:update', 'Update healthcare providers'),
('33333333-3333-3333-3333-333333333312', 'care:providers:delete', 'Remove healthcare providers'),
-- Symptom checker
('33333333-3333-3333-3333-333333333313', 'care:symptoms:read', 'Access symptom checker'),
('33333333-3333-3333-3333-333333333314', 'care:symptoms:create', 'Record symptoms'),
-- Telemedicine
('33333333-3333-3333-3333-333333333315', 'care:telemedicine:read', 'View telemedicine sessions'),
('33333333-3333-3333-3333-333333333316', 'care:telemedicine:create', 'Schedule telemedicine sessions'),
('33333333-3333-3333-3333-333333333317', 'care:telemedicine:update', 'Update telemedicine sessions'),
('33333333-3333-3333-3333-333333333318', 'care:telemedicine:delete', 'Cancel telemedicine sessions'),
-- Treatments
('33333333-3333-3333-3333-333333333319', 'care:treatments:read', 'View treatments'),
('33333333-3333-3333-3333-333333333320', 'care:treatments:create', 'Add treatments'),
('33333333-3333-3333-3333-333333333321', 'care:treatments:update', 'Update treatments'),
('33333333-3333-3333-3333-333333333322', 'care:treatments:delete', 'Remove treatments'),
('33333333-3333-3333-3333-333333333323', 'care:admin', 'Administrative access to Care journey');

-- Plan Journey permissions
INSERT INTO permissions (id, name, description) VALUES
-- Plans
('44444444-4444-4444-4444-444444444401', 'plan:plans:read', 'View insurance plans'),
('44444444-4444-4444-4444-444444444402', 'plan:plans:create', 'Create insurance plans'),
('44444444-4444-4444-4444-444444444403', 'plan:plans:update', 'Update insurance plans'),
('44444444-4444-4444-4444-444444444404', 'plan:plans:delete', 'Delete insurance plans'),
-- Benefits
('44444444-4444-4444-4444-444444444405', 'plan:benefits:read', 'View plan benefits'),
('44444444-4444-4444-4444-444444444406', 'plan:benefits:create', 'Create plan benefits'),
('44444444-4444-4444-4444-444444444407', 'plan:benefits:update', 'Update plan benefits'),
('44444444-4444-4444-4444-444444444408', 'plan:benefits:delete', 'Delete plan benefits'),
-- Coverage
('44444444-4444-4444-4444-444444444409', 'plan:coverage:read', 'View coverage details'),
('44444444-4444-4444-4444-444444444410', 'plan:coverage:create', 'Create coverage details'),
('44444444-4444-4444-4444-444444444411', 'plan:coverage:update', 'Update coverage details'),
('44444444-4444-4444-4444-444444444412', 'plan:coverage:delete', 'Delete coverage details'),
-- Claims
('44444444-4444-4444-4444-444444444413', 'plan:claims:read', 'View insurance claims'),
('44444444-4444-4444-4444-444444444414', 'plan:claims:create', 'Submit insurance claims'),
('44444444-4444-4444-4444-444444444415', 'plan:claims:update', 'Update insurance claims'),
('44444444-4444-4444-4444-444444444416', 'plan:claims:delete', 'Delete insurance claims'),
-- Documents
('44444444-4444-4444-4444-444444444417', 'plan:documents:read', 'View insurance documents'),
('44444444-4444-4444-4444-444444444418', 'plan:documents:create', 'Upload insurance documents'),
('44444444-4444-4444-4444-444444444419', 'plan:documents:update', 'Update insurance documents'),
('44444444-4444-4444-4444-444444444420', 'plan:documents:delete', 'Delete insurance documents'),
('44444444-4444-4444-4444-444444444421', 'plan:admin', 'Administrative access to Plan journey');

-- Gamification permissions
INSERT INTO permissions (id, name, description) VALUES
-- Achievements
('55555555-5555-5555-5555-555555555501', 'gamification:achievements:read', 'View achievements'),
('55555555-5555-5555-5555-555555555502', 'gamification:achievements:create', 'Create achievements'),
('55555555-5555-5555-5555-555555555503', 'gamification:achievements:update', 'Update achievements'),
('55555555-5555-5555-5555-555555555504', 'gamification:achievements:delete', 'Delete achievements'),
-- Profiles
('55555555-5555-5555-5555-555555555505', 'gamification:profiles:read', 'View gamification profiles'),
('55555555-5555-5555-5555-555555555506', 'gamification:profiles:create', 'Create gamification profiles'),
('55555555-5555-5555-5555-555555555507', 'gamification:profiles:update', 'Update gamification profiles'),
('55555555-5555-5555-5555-555555555508', 'gamification:profiles:delete', 'Delete gamification profiles'),
-- Quests
('55555555-5555-5555-5555-555555555509', 'gamification:quests:read', 'View quests'),
('55555555-5555-5555-5555-555555555510', 'gamification:quests:create', 'Create quests'),
('55555555-5555-5555-5555-555555555511', 'gamification:quests:update', 'Update quests'),
('55555555-5555-5555-5555-555555555512', 'gamification:quests:delete', 'Delete quests'),
-- Rewards
('55555555-5555-5555-5555-555555555513', 'gamification:rewards:read', 'View rewards'),
('55555555-5555-5555-5555-555555555514', 'gamification:rewards:create', 'Create rewards'),
('55555555-5555-5555-5555-555555555515', 'gamification:rewards:update', 'Update rewards'),
('55555555-5555-5555-5555-555555555516', 'gamification:rewards:delete', 'Delete rewards'),
-- Rules
('55555555-5555-5555-5555-555555555517', 'gamification:rules:read', 'View gamification rules'),
('55555555-5555-5555-5555-555555555518', 'gamification:rules:create', 'Create gamification rules'),
('55555555-5555-5555-5555-555555555519', 'gamification:rules:update', 'Update gamification rules'),
('55555555-5555-5555-5555-555555555520', 'gamification:rules:delete', 'Delete gamification rules'),
-- Leaderboard
('55555555-5555-5555-5555-555555555521', 'gamification:leaderboard:read', 'View leaderboards'),
('55555555-5555-5555-5555-555555555522', 'gamification:leaderboard:create', 'Create leaderboards'),
('55555555-5555-5555-5555-555555555523', 'gamification:leaderboard:update', 'Update leaderboards'),
('55555555-5555-5555-5555-555555555524', 'gamification:leaderboard:delete', 'Delete leaderboards'),
-- Events
('55555555-5555-5555-5555-555555555525', 'gamification:events:read', 'View gamification events'),
('55555555-5555-5555-5555-555555555526', 'gamification:events:create', 'Create gamification events'),
('55555555-5555-5555-5555-555555555527', 'gamification:events:update', 'Update gamification events'),
('55555555-5555-5555-5555-555555555528', 'gamification:events:delete', 'Delete gamification events'),
('55555555-5555-5555-5555-555555555529', 'gamification:admin', 'Administrative access to Gamification');

-- =============================================
-- ROLES
-- =============================================

-- Global roles
INSERT INTO roles (id, name, description, journey, is_default) VALUES
(1, 'Super Admin', 'Full access to all features across all journeys', NULL, false),
(2, 'Admin', 'Administrative access across all journeys', NULL, false),
(3, 'User', 'Basic user access to all journeys', NULL, true);

-- Health Journey roles
INSERT INTO roles (id, name, description, journey, is_default) VALUES
(101, 'Health Admin', 'Administrative access to Health journey', 'health', false),
(102, 'Health Provider', 'Healthcare provider access to Health journey', 'health', false),
(103, 'Health User', 'Basic user access to Health journey', 'health', true);

-- Care Journey roles
INSERT INTO roles (id, name, description, journey, is_default) VALUES
(201, 'Care Admin', 'Administrative access to Care journey', 'care', false),
(202, 'Care Provider', 'Healthcare provider access to Care journey', 'care', false),
(203, 'Care User', 'Basic user access to Care journey', 'care', true);

-- Plan Journey roles
INSERT INTO roles (id, name, description, journey, is_default) VALUES
(301, 'Plan Admin', 'Administrative access to Plan journey', 'plan', false),
(302, 'Insurance Agent', 'Insurance agent access to Plan journey', 'plan', false),
(303, 'Plan User', 'Basic user access to Plan journey', 'plan', true);

-- Gamification roles
INSERT INTO roles (id, name, description, journey, is_default) VALUES
(401, 'Gamification Admin', 'Administrative access to Gamification', NULL, false);

-- =============================================
-- ROLE-PERMISSION MAPPINGS
-- =============================================

-- Super Admin role permissions (all permissions)
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin role permissions (all except some sensitive operations)
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name NOT LIKE '%:delete';

-- Basic User role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE 
  name LIKE '%:read' OR 
  name IN (
    'health:metrics:create', 'health:metrics:update',
    'health:goals:create', 'health:goals:update',
    'health:devices:create', 'health:devices:update', 'health:devices:delete',
    'care:appointments:create', 'care:appointments:update', 'care:appointments:delete',
    'care:medications:create', 'care:medications:update',
    'care:symptoms:create',
    'care:telemedicine:create', 'care:telemedicine:update', 'care:telemedicine:delete',
    'plan:claims:create', 'plan:claims:update',
    'plan:documents:create', 'plan:documents:update', 'plan:documents:delete'
  );

-- Health Admin role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 101, id FROM permissions WHERE name LIKE 'health:%' OR name = 'global:user:read';

-- Health Provider role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 102, id FROM permissions WHERE 
  name LIKE 'health:%:read' OR 
  name IN (
    'health:metrics:create', 'health:metrics:update',
    'health:goals:create', 'health:goals:update',
    'health:events:create', 'health:events:update',
    'global:user:read'
  );

-- Health User role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 103, id FROM permissions WHERE 
  name LIKE 'health:%:read' OR 
  name IN (
    'health:metrics:create', 'health:metrics:update',
    'health:goals:create', 'health:goals:update',
    'health:devices:create', 'health:devices:update', 'health:devices:delete'
  );

-- Care Admin role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 201, id FROM permissions WHERE name LIKE 'care:%' OR name = 'global:user:read';

-- Care Provider role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 202, id FROM permissions WHERE 
  name LIKE 'care:%:read' OR 
  name IN (
    'care:appointments:update',
    'care:treatments:create', 'care:treatments:update',
    'care:telemedicine:create', 'care:telemedicine:update',
    'global:user:read'
  );

-- Care User role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 203, id FROM permissions WHERE 
  name LIKE 'care:%:read' OR 
  name IN (
    'care:appointments:create', 'care:appointments:update', 'care:appointments:delete',
    'care:medications:create', 'care:medications:update',
    'care:symptoms:create',
    'care:telemedicine:create', 'care:telemedicine:update', 'care:telemedicine:delete'
  );

-- Plan Admin role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 301, id FROM permissions WHERE name LIKE 'plan:%' OR name = 'global:user:read';

-- Insurance Agent role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 302, id FROM permissions WHERE 
  name LIKE 'plan:%:read' OR 
  name IN (
    'plan:claims:update',
    'plan:benefits:create', 'plan:benefits:update',
    'plan:coverage:create', 'plan:coverage:update',
    'global:user:read'
  );

-- Plan User role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 303, id FROM permissions WHERE 
  name LIKE 'plan:%:read' OR 
  name IN (
    'plan:claims:create', 'plan:claims:update',
    'plan:documents:create', 'plan:documents:update', 'plan:documents:delete'
  );

-- Gamification Admin role permissions
INSERT INTO roles_permissions (role_id, permission_id)
SELECT 401, id FROM permissions WHERE name LIKE 'gamification:%' OR name = 'global:user:read';

-- =============================================
-- USERS
-- =============================================

-- Note: Passwords are hashed with bcrypt
-- All test users have the password 'Password123!'
-- Hash: $2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu

-- Admin users
INSERT INTO users (id, name, email, phone, cpf, password, created_at, updated_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Super Admin', 'superadmin@austa.com', '+5511999999999', '12345678900', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'Admin User', 'admin@austa.com', '+5511999999998', '12345678901', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW());

-- Journey admin users
INSERT INTO users (id, name, email, phone, cpf, password, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbba', 'Health Admin', 'healthadmin@austa.com', '+5511999999997', '12345678902', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Care Admin', 'careadmin@austa.com', '+5511999999996', '12345678903', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'Plan Admin', 'planadmin@austa.com', '+5511999999995', '12345678904', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'Gamification Admin', 'gamificationadmin@austa.com', '+5511999999994', '12345678905', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW());

-- Provider users
INSERT INTO users (id, name, email, phone, cpf, password, created_at, updated_at) VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccca', 'Health Provider', 'healthprovider@austa.com', '+5511999999993', '12345678906', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Care Provider', 'careprovider@austa.com', '+5511999999992', '12345678907', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccd', 'Insurance Agent', 'insuranceagent@austa.com', '+5511999999991', '12345678908', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW());

-- Regular users
INSERT INTO users (id, name, email, phone, cpf, password, created_at, updated_at) VALUES
('dddddddd-dddd-dddd-dddd-ddddddddddda', 'Regular User', 'user@austa.com', '+5511999999990', '12345678909', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddb', 'Health User', 'healthuser@austa.com', '+5511999999989', '12345678910', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddc', 'Care User', 'careuser@austa.com', '+5511999999988', '12345678911', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Plan User', 'planuser@austa.com', '+5511999999987', '12345678912', '$2b$10$6jXxQzd5WU5GDg85X.4o4.9CHwcaZ3ZVFkuAJi3UmYOY6LZQvJYUu', NOW(), NOW());

-- =============================================
-- USER-ROLE MAPPINGS
-- =============================================

-- Super Admin user roles
INSERT INTO users_roles (user_id, role_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1);

-- Admin user roles
INSERT INTO users_roles (user_id, role_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 2);

-- Journey admin user roles
INSERT INTO users_roles (user_id, role_id) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbba', 101),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 201),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 301),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 401);

-- Provider user roles
INSERT INTO users_roles (user_id, role_id) VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccca', 102),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 202),
('cccccccc-cccc-cccc-cccc-cccccccccccd', 302);

-- Regular user roles
INSERT INTO users_roles (user_id, role_id) VALUES
('dddddddd-dddd-dddd-dddd-ddddddddddda', 3),
('dddddddd-dddd-dddd-dddd-dddddddddddb', 103),
('dddddddd-dddd-dddd-dddd-dddddddddddc', 203),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 303);

-- Add journey-specific roles to regular users for testing multiple roles
INSERT INTO users_roles (user_id, role_id) VALUES
('dddddddd-dddd-dddd-dddd-ddddddddddda', 103),
('dddddddd-dddd-dddd-dddd-ddddddddddda', 203),
('dddddddd-dddd-dddd-dddd-ddddddddddda', 303);