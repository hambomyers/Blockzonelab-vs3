// Cloudflare Worker for leaderboard
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.pathname === '/leaderboard') {
        return new Response(JSON.stringify({ leaderboard: [] }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    return new Response('Not Found', { status: 404 });
}
