import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

async function run() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    console.log(`INSERT INTO public.users (id, name, email, password_hash, role, status) VALUES 
('4b6c2c76-b1c0-44e7-86ac-162510433cbf', 'Test Admin', 'testadmin4737@sevenstar.edu.np', '${hash}', 'ADMIN', 'APPROVED'),
('02cd2843-5b75-4209-af7d-ed4831216c26', 'Oshim', 'oshimpathan8@gmail.com', '${hash}', 'ADMIN', 'APPROVED'),
('22345c1d-1d62-4442-8108-1e81e8fe7f18', 'Admin', 'oshim@admin.com', '${hash}', 'ADMIN', 'APPROVED')
ON CONFLICT (email) DO UPDATE SET status = 'APPROVED', password_hash = '${hash}';
`);
}
run();
