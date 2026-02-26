const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

module.exports = async function (request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { email, password, name, role } = await request.json();

        if (!email || !password || !name || !role) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
        }

        // Initialize Supabase with service role to bypass RLS for inserting new users
        const supabase = createClient(
            process.env.VITE_INSFORGE_URL || process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_INSFORGE_ANON_KEY
        );

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 400 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user with PENDING state
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                name,
                email,
                password_hash: passwordHash,
                role: role.toUpperCase(),
                status: 'PENDING'
            }])
            .select('id, name, email, role, status')
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return new Response(JSON.stringify({ error: 'Failed to create account' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            message: 'Account created successfully. Waiting for admin approval.',
            user: newUser
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Server error:', err);
        return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }
}
