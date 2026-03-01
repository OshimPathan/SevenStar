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
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and new password required' }), { status: 400 });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Find user in Supabase Auth
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        let authUser = authUsers?.users?.find(u => u.email === email);

        if (authUser) {
            // Update Supabase Auth password
            await supabase.auth.admin.updateUserById(authUser.id, { password: password });
        }

        // 2. Hash password and update public.users
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hash })
            .eq('email', email);

        if (updateError) {
            console.error("DB update error:", updateError);
            return new Response(JSON.stringify({ error: 'Failed to update custom credentials' }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, message: 'Password reset completely.' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
};
