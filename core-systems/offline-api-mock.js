export class OfflineAPIMock {
    constructor() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
            const urlString = url.toString();

            if (urlString.includes('/api/stats')) {
                return new Response(JSON.stringify({
                    prizePool: 250.00,
                    playersToday: 42
                }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }

            if (urlString.includes('/api/leaderboard')) {
                return new Response(JSON.stringify({
                    scores: this.generateMockLeaderboard()
                }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }

            return originalFetch(url, options);
        };
    }

    generateMockLeaderboard() {
        const leaderboard = [];
        for (let i = 0; i < 20; i++) {
            leaderboard.push({
                player_id: `player_${i}`,
                display_name: `Player${i}`,
                score: 50000 - (i * 2000)
            });
        }
        return leaderboard;
    }
}

window.offlineAPI = new OfflineAPIMock();
