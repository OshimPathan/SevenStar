import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://34yxw6n9.us-east.insforge.app', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjI1NzN9.TuItDLVfYiKHfOuFttoI3mVbwyKhQOrHdTDvjVFddUc' });
async function sync() {
    const { data: users, error } = await insforge.database.from('users').select('*');
    if (error) console.error(error);
    console.log(`Found ${users?.length} users in public.users`);
}
sync();
