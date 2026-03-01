const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

module.exports = async function (request) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { name, email, password, role } = await request.json();

        // Validate required fields
        if (!name || !email || !password || !role) {
            return new Response(JSON.stringify({ error: 'name, email, password, and role are required' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const validRoles = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
        const upperRole = role.toUpperCase();
        if (!validRoles.includes(upperRole)) {
            return new Response(JSON.stringify({ error: 'Invalid role. Must be ADMIN, TEACHER, STUDENT, or PARENT.' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (password.length < 6) {
            return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Service role client (bypasses RLS)
        const supabase = createSupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verify caller is ADMIN
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: authUser, error: verifyError } = await supabase.auth.getUser(token);

        if (verifyError || !authUser?.user) {
            return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: callerProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.user.id)
            .single();

        if (!callerProfile || callerProfile.role !== 'ADMIN') {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
                status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Check if email already exists in users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return new Response(JSON.stringify({ error: 'A user with this email already exists' }), {
                status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Create Auth user (auto-confirms email, bypasses verification)
        const { data: newAuthData, error: authCreateError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: upperRole }
        });

        if (authCreateError) {
            return new Response(JSON.stringify({ error: 'Auth creation failed: ' + authCreateError.message }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const authUserId = newAuthData.user.id;

        // Insert into public.users table
        // password_hash set to sentinel — Auth handles real password validation
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                id: authUserId,
                name,
                email,
                password_hash: '$auth_managed$',
                role: upperRole,
                status: 'ACTIVE'
            }])
            .select('id, name, email, role, status')
            .single();

        if (insertError) {
            // Rollback: delete the auth user if DB insert fails
            await supabase.auth.admin.deleteUser(authUserId);
            return new Response(JSON.stringify({ error: 'Failed to create user record: ' + insertError.message }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            user: newUser,
            auth_user_id: authUserId,
            message: `User ${name} created successfully as ${upperRole}`
        }), {
            status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('admin-create-user error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
};
