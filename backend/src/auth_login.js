const jwt = require('jsonwebtoken');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// This function runs on the edge to securely authenticate users
module.exports = async function (request) {
    // Only accept POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
        }

        // Initialize Supabase client using Service Role to bypass RLS for credential checking
        const supabase = createSupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch user + hash
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, role, password_hash, status')
            .eq('email', email)
            .eq('is_deleted', false)
            .maybeSingle();

        if (error || !user) {
            return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
        }

        // Verify password
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
        }

        // Generate Secure JWT
        // We use the Supabase JWT secret so PostgREST recognizes it for RLS
        const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';

        const payload = {
            aud: 'authenticated',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
            sub: user.id, // Subject is the user ID (crucial for auth.uid() in RLS)
            email: user.email,
            role: user.role, // Custom claim for get_user_role()
            app_metadata: { provider: 'email' },
            user_metadata: { name: user.name, role: user.role }
        };

        const token = jwt.sign(payload, jwtSecret);

        // Remove hash from response
        delete user.password_hash;

        return new Response(JSON.stringify({
            token,
            user
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }
}
