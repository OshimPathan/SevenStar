-- Seed data for Seven Star ERP

-- 1. Admin user (password: admin123)
-- bcrypt hash of 'admin123' with 10 rounds: $2a$10$rN5vX5e9fVLvC1Qgqo8nPOm5R5TQjYz2FVxG3Zn0s5Y5kXH0aKfKi
-- We use a pre-computed hash
INSERT INTO users (name, email, password_hash, role, status)
VALUES ('Admin', 'admin@sevenstar.edu', '$2b$10$GDZo4jhalVYHNdTTBFU/MuFsm3TOGRI9XUoaqkluNzcRP5A4giqAC', 'ADMIN', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 2. Institution profile
INSERT INTO institution_profiles (name, principal_name, contact_email, contact_phone, address)
VALUES (
    'Seven Star English Boarding School',
    'Principal Name',
    'info@sevenstar.edu',
    '+977-000-0000',
    'Nepal'
)
ON CONFLICT DO NOTHING;

-- 3. Active academic year
INSERT INTO academic_years (name, start_date, end_date, is_active)
VALUES ('2025-2026', '2025-04-01', '2026-03-31', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Default classes (Nursery to Class 12)
INSERT INTO classes (name, level) VALUES
    ('Nursery', -2),
    ('LKG', -1),
    ('UKG', 0),
    ('Class 1', 1),
    ('Class 2', 2),
    ('Class 3', 3),
    ('Class 4', 4),
    ('Class 5', 5),
    ('Class 6', 6),
    ('Class 7', 7),
    ('Class 8', 8),
    ('Class 9', 9),
    ('Class 10', 10),
    ('Class 11', 11),
    ('Class 12', 12)
ON CONFLICT (name) DO NOTHING;

-- 5. Default streams
INSERT INTO streams (name, description) VALUES
    ('Science', 'Science stream for +2'),
    ('Management', 'Management stream for +2'),
    ('Humanities', 'Humanities/Arts stream for +2')
ON CONFLICT (name) DO NOTHING;
