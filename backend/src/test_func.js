const bcrypt = require('bcryptjs');
module.exports = async function(request) {
    if (typeof createClient !== 'undefined') {
        return new Response(JSON.stringify({ msg: "createClient works without require!" }), { status: 200 });
    }
    return new Response(JSON.stringify({ msg: "No createClient" }), { status: 200 });
}
