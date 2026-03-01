module.exports = async function (request) {
    try {
        const { createClient } = await import('npm:@supabase/supabase-js@2');
        return new Response(JSON.stringify({ msg: "Dynamic import works!" }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
