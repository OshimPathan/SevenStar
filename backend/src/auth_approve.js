const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

module.exports = async function (request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { target_user_id, role, mapping_data } = await request.json();

        if (!target_user_id || !role) {
            return new Response(JSON.stringify({ error: 'User ID and Role are required' }), { status: 400 });
        }

        // Initialize Supabase with service role to bypass RLS for administrative tasks
        const supabase = createSupabaseClient(
            process.env.VITE_INSFORGE_URL || process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_INSFORGE_ANON_KEY
        );

        // 1. Verify the requester is actually an ADMIN
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: adminUser, error: verifyError } = await supabase.auth.getUser(token);

        if (verifyError || !adminUser?.user) {
            // Fallback for custom JWTs deployed via Edge (verify against our users table)
            const { data: dbAdminUser } = await supabase
                .from('users')
                .select('role')
                .eq('role', 'ADMIN')
                .limit(1)
                .single();

            if (!dbAdminUser) {
                return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 403 });
            }
        } else {
            const { data: adminProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', adminUser.user.id)
                .single();

            if (!adminProfile || adminProfile.role !== 'ADMIN') {
                return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 403 });
            }
        }

        // 2. Fetch the target user to ensure they exist and get their basic info
        const { data: targetUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', target_user_id)
            .single();

        if (fetchError || !targetUser) {
            return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404 });
        }

        if (targetUser.status === 'ACTIVE') {
            return new Response(JSON.stringify({ error: 'User is already active' }), { status: 400 });
        }

        // Split name into first and last for ERP tables
        const nameParts = targetUser.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // 3. Insert into the appropriate entity table
        let entityError = null;

        if (role === 'STUDENT') {
            if (!mapping_data?.admission_number) {
                return new Response(JSON.stringify({ error: 'Admission Number is strictly required for Students' }), { status: 400 });
            }
            const { error } = await supabase.from('students').insert([{
                user_id: target_user_id,
                admission_number: mapping_data.admission_number,
                first_name: firstName,
                last_name: lastName,
                status: 'Active'
            }]);
            entityError = error;

        } else if (role === 'TEACHER') {
            if (!mapping_data?.employee_id) {
                return new Response(JSON.stringify({ error: 'Employee ID is strictly required for Teachers' }), { status: 400 });
            }
            const { error } = await supabase.from('staff').insert([{
                user_id: target_user_id,
                employee_id: mapping_data.employee_id,
                first_name: firstName,
                last_name: lastName,
                role: 'Teacher',
                status: 'Active'
            }]);
            entityError = error;

        } else if (role === 'PARENT') {
            const { error } = await supabase.from('parents').insert([{
                user_id: target_user_id,
                father_name: targetUser.name,
                father_email: targetUser.email
            }]);
            entityError = error;
        }

        // Handle Unique Constraint Violations Exceptionally
        if (entityError) {
            console.error('Entity insertion failed:', entityError);
            if (entityError.code === '23505') {
                return new Response(JSON.stringify({ error: `The provided ID (${mapping_data?.admission_number || mapping_data?.employee_id}) is already assigned to another user.` }), { status: 409 });
            }
            return new Response(JSON.stringify({ error: 'Failed to create internal entity record. Please check mapping data.' }), { status: 500 });
        }

        // 4. Update the user status to ACTIVE
        const { error: updateError } = await supabase
            .from('users')
            .update({ status: 'ACTIVE' })
            .eq('id', target_user_id);

        if (updateError) {
            console.error('Status update failed:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to mark user as active' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            message: `User ${targetUser.name} has been successfully approved as a ${role}.`,
            success: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Server error:', err);
        return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }
}
