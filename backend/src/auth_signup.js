const { createClient } = require('@supabase/supabase-js');

module.exports = async function (request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { email, password, name, role } = await request.json();

        if (!email || !password || !name || !role) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
        }

        // Initialize Supabase with service role
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Check if user exists in public table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 400 });
        }

        // 1. Create the user securely via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role }
        });

        if (authError) {
            console.error('Auth creation error:', authError);
            return new Response(JSON.stringify({ error: authError.message || 'Failed to register authentication' }), { status: 400 });
        }

        const authUser = authData.user;

        // 2. Insert into public.users with the corresponding Auth ID and PENDING status
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                id: authUser.id,
                name,
                email,
                role: role.toUpperCase(),
                status: 'PENDING'
            }])
            .select('id, name, email, role, status')
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            // Cleanup auth user if public table insert fails
            await supabase.auth.admin.deleteUser(authUser.id);
            return new Response(JSON.stringify({ error: 'Failed to create internal account details' }), { status: 500 });
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
        return new Response(JSON.stringify({ error: 'Server context error' }), { status: 500 });
    }
}
