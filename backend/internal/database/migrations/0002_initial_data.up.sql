// database/migrations/0002_initial_data.up.sql
-- Insert default Super Manager Admin
INSERT INTO users (username, password_hash, role, is_active, created_at) 
VALUES ('superadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H1pqaU1ZJx5X5Jv5YHvJQz5rQbO', 'super_admin', TRUE, NOW());

-- Create default groups
INSERT INTO groups (name, description, created_by, created_at) 
VALUES 
    ('Group A', 'Default Group A for operators', 1, NOW()),
    ('Group B', 'Default Group B for operators', 1, NOW()),
    ('Group C', 'Default Group C for operators', 1, NOW());

-- Create some test managers
INSERT INTO users (username, password_hash, role, managed_by, is_active, created_by, created_at) 
VALUES 
    ('manager1', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H1pqaU1ZJx5X5Jv5YHvJQz5rQbO', 'manager', 1, TRUE, 1, NOW()),
    ('manager2', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H1pqaU1ZJx5X5Jv5YHvJQz5rQbO', 'manager', 1, TRUE, 1, NOW());

-- Assign managers to groups
UPDATE groups SET managed_by = 2 WHERE id = 1;
UPDATE groups SET managed_by = 3 WHERE id = 2;

-- Create some test operators
INSERT INTO users (username, password_hash, role, group_id, managed_by, is_active, created_by, created_at) 
VALUES 
    ('operator1', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H1pqaU1ZJx5X5Jv5YHvJQz5rQbO', 'operator', 1, 2, TRUE, 2, NOW()),
    ('operator2', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H1pqaU1ZJx5X5Jv5YHvJQz5rQbO', 'operator', 1, 2, TRUE, 2, NOW()),
    ('operator3', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H1pqaU1ZJx5X5Jv5YHvJQz5rQbO', 'operator', 2, 3, TRUE, 3, NOW());