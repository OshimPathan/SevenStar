export default async function (req) {
    return new Response(JSON.stringify({ msg: "Hello from Deno!" }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
