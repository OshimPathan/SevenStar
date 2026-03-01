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
        const { user_id } = await request.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'user_id is required' }), {
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

        // Can't delete yourself
        if (authUser.user.id === user_id) {
            return new Response(JSON.stringify({ error: 'You cannot delete your own account' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

        // Check target user exists
        const { data: targetUser, error: fetchError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', user_id)
            .single();

        if (fetchError || !targetUser) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Delete from DB first (cascading deletes handle related records)
        const { error: deleteDbError } = await supabase
            .from('users')
            .delete()
            .eq('id', user_id);

        if (deleteDbError) {
            return new Response(JSON.stringify({ error: 'Failed to delete user record: ' + deleteDbError.message }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Delete from Auth
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user_id);

        if (authDeleteError) {
            console.error('Auth deletion failed (DB record already removed):', authDeleteError.message);
            // Don't fail — the DB record is already deleted, auth orphan is acceptable
        }

        return new Response(JSON.stringify({
            success: true,
            message: `User ${targetUser.name} (${targetUser.email}) deleted successfully`
        }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('admin-delete-user error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
};
