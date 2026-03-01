const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

module.exports = async function (request) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    try {
        const { email } = await request.json();
        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Check if user exists in public.users
        const { data: userRecord, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (fetchError || !userRecord) {
            // To prevent email enumeration, return success even if not found
            return new Response(JSON.stringify({ message: 'If the email exists, a reset link will be sent.' }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 2. Check if the user exists in Supabase Auth
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        let authUser = authUsers?.users?.find(u => u.email === email);

        if (!authUser) {
            // Create user in Supabase Auth if they only exist in custom table
            const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'; // strong temp password
            const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true
            });
            if (createAuthError) {
                console.error("Error creating auth user:", createAuthError);
                return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 });
            }
            authUser = newAuthUser.user;
        }

        // 3. Send the reset password email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${request.headers.get('origin') || 'http://localhost:5173'}/reset-password`,
        });

        if (resetError) {
            console.error("Error generating reset link:", resetError);
            return new Response(JSON.stringify({ error: 'Failed to generate reset link' }), { status: 500 });
        }

        return new Response(JSON.stringify({ message: 'Success' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
};
