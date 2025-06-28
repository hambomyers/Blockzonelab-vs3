/**
 * Tournament Dashboard Frontend Logic
 * Phase 2: Platform Infrastructure
 */

// DOM Elements
const activeChampionshipsDiv = document.getElementById('activeChampionships');
const scheduledChampionshipsDiv = document.getElementById('scheduledChampionships');
const challengeForm = document.getElementById('challengeForm');
const activeChallengesDiv = document.getElementById('activeChallenges');
const globalLeaderboardDiv = document.getElementById('globalLeaderboard');
const challengeModal = document.getElementById('challengeModal');
const challengeLink = document.getElementById('challengeLink');

let currentUserId = null;
let sessionId = localStorage.getItem('sessionId') || null;

// Initialize tournament dashboard
async function initializeTournaments() {
    // Check if we're on the tournaments page
    if (!activeChampionshipsDiv) {
        console.log('Not on tournaments page, skipping initialization');
        return;
    }
    
    if (sessionId && window.userManager) {
        currentUserId = window.userManager.getCurrentUser(sessionId);
    }
    
    loadActiveChampionships();
    loadScheduledChampionships();
    loadActiveChallenges();
    loadGlobalLeaderboard();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadActiveChampionships();
        loadActiveChallenges();
        loadGlobalLeaderboard();
    }, 30000);
}

// Load active championships
function loadActiveChampionships() {
    if (!window.tournamentManager || !activeChampionshipsDiv) return;
    
    const activeChampionships = window.tournamentManager.getActiveChampionships();
    
    if (activeChampionships.length === 0) {
        activeChampionshipsDiv.innerHTML = `
            <div class="col-span-2 text-center py-8">
                <p class="text-muted">No active championships right now.</p>
                <p class="text-sm text-muted">Check upcoming championships below!</p>
            </div>
        `;
        return;
    }
    
    activeChampionshipsDiv.innerHTML = activeChampionships.map(championship => {
        const startTime = new Date(championship.startTime);
        const endTime = new Date(championship.endTime);
        const timeLeft = endTime - Date.now();
        const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
        const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
        
        const isParticipating = championship.participants.has(currentUserId);
        
        return `
            <div class="card card-secondary p-4">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="text-neon-pink">🏆 Championship</h4>
                    <span class="badge badge-primary">$${championship.entryFee}</span>
                </div>
                <div class="space-y-2 text-sm">
                    <p><strong>Prize Pool:</strong> $${championship.totalPrizePool.toFixed(2)}</p>
                    <p><strong>Participants:</strong> ${championship.participants.size}</p>
                    <p><strong>Time Left:</strong> ${hoursLeft}h ${minutesLeft}m</p>
                </div>
                <div class="mt-4 space-y-2">
                    ${isParticipating ? 
                        `<button onclick="viewLeaderboard('${championship.id}')" class="btn btn-secondary w-full btn-sm">View Leaderboard</button>` :
                        `<button onclick="joinChampionship('${championship.id}')" class="btn btn-primary w-full btn-sm">Join Championship</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Load scheduled championships
function loadScheduledChampionships() {
    if (!window.tournamentManager || !scheduledChampionshipsDiv) return;
    
    const scheduledChampionships = window.tournamentManager.getScheduledChampionships();
    
    if (scheduledChampionships.length === 0) {
        scheduledChampionshipsDiv.innerHTML = `
            <div class="col-span-2 text-center py-8">
                <p class="text-muted">No upcoming championships scheduled.</p>
            </div>
        `;
        return;
    }
    
    scheduledChampionshipsDiv.innerHTML = scheduledChampionships.slice(0, 4).map(championship => {
        const startTime = new Date(championship.startTime);
        const timeUntilStart = startTime - Date.now();
        const hoursUntilStart = Math.max(0, Math.floor(timeUntilStart / (1000 * 60 * 60)));
        const minutesUntilStart = Math.max(0, Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60)));
        
        return `
            <div class="card card-secondary p-4">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="text-neon-green">📅 Upcoming</h4>
                    <span class="badge badge-secondary">$${championship.entryFee}</span>
                </div>
                <div class="space-y-2 text-sm">
                    <p><strong>Starts:</strong> ${startTime.toLocaleString()}</p>
                    <p><strong>Duration:</strong> 12 hours</p>
                    <p><strong>Starts in:</strong> ${hoursUntilStart}h ${minutesUntilStart}m</p>
                </div>
                <div class="mt-4">
                    <button onclick="setReminder('${championship.id}')" class="btn btn-ghost w-full btn-sm">Set Reminder</button>
                </div>
            </div>
        `;
    }).join('');
}

// Load active challenges
function loadActiveChallenges() {
    if (!window.tournamentManager || !activeChallengesDiv) return;
    
    const activeChallenges = window.tournamentManager.getActiveChallenges();
    
    if (activeChallenges.length === 0) {
        activeChallengesDiv.innerHTML = `
            <div class="text-center py-8">
                <p class="text-muted">No active challenges.</p>
                <p class="text-sm text-muted">Create a challenge above to get started!</p>
            </div>
        `;
        return;
    }
    
    activeChallengesDiv.innerHTML = activeChallenges.map(challenge => {
        const endTime = new Date(challenge.endTime);
        const timeLeft = endTime - Date.now();
        const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
        const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
        
        const isParticipating = challenge.participants.has(currentUserId);
        const isCreator = challenge.creatorId === currentUserId;
        
        return `
            <div class="card card-secondary p-4">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="text-neon-blue">🔗 ${challenge.gameId} Challenge</h4>
                    <span class="badge badge-primary">$${challenge.fee}</span>
                </div>
                <div class="space-y-2 text-sm">
                    <p><strong>Prize Pool:</strong> $${challenge.prizePool.toFixed(2)}</p>
                    <p><strong>Participants:</strong> ${challenge.participants.size}</p>
                    <p><strong>Time Left:</strong> ${hoursLeft}h ${minutesLeft}m</p>
                </div>
                <div class="mt-4 space-y-2">
                    ${isCreator ? 
                        `<button onclick="viewChallenge('${challenge.id}')" class="btn btn-secondary w-full btn-sm">View Challenge</button>` :
                        isParticipating ?
                        `<button onclick="viewChallenge('${challenge.id}')" class="btn btn-secondary w-full btn-sm">View Challenge</button>` :
                        `<button onclick="acceptChallenge('${challenge.id}')" class="btn btn-primary w-full btn-sm">Accept Challenge</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Load global leaderboard
function loadGlobalLeaderboard() {
    if (!globalLeaderboardDiv) return;
    
    // For now, show a sample leaderboard
    const sampleLeaderboard = [
        { userId: 'crypto_master', displayName: 'Crypto Master', score: 15420, wins: 12 },
        { userId: 'neon_warrior', displayName: 'Neon Warrior', score: 12850, wins: 8 },
        { userId: 'blockchain_king', displayName: 'Blockchain King', score: 11230, wins: 6 },
        { userId: 'sonic_speed', displayName: 'Sonic Speed', score: 9870, wins: 5 },
        { userId: 'gaming_legend', displayName: 'Gaming Legend', score: 8540, wins: 4 }
    ];
    
    globalLeaderboardDiv.innerHTML = sampleLeaderboard.map((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        return `
            <div class="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">${medal}</span>
                    <div>
                        <p class="font-semibold">${player.displayName}</p>
                        <p class="text-sm text-muted">${player.wins} wins</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold text-neon-pink">${player.score.toLocaleString()}</p>
                    <p class="text-sm text-muted">#${index + 1}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Challenge form submission
if (challengeForm) {
    challengeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUserId) {
            alert('Please log in to create a challenge.');
            return;
        }
        
        const gameId = document.getElementById('gameSelect').value;
        const fee = parseFloat(document.getElementById('challengeFee').value);
        
        if (!gameId) {
            alert('Please select a game.');
            return;
        }
        
        try {
            const result = window.tournamentManager.createChallenge(currentUserId, gameId, fee);
            showChallengeModal(result.shareableLink);
            challengeForm.reset();
            loadActiveChallenges(); // Refresh the list
        } catch (err) {
            alert('Failed to create challenge: ' + err.message);
        }
    });
}

// Show challenge modal
function showChallengeModal(link) {
    if (!challengeModal || !challengeLink) return;
    
    challengeLink.value = window.location.origin + link;
    challengeModal.style.display = 'flex';
}

// Close challenge modal
function closeChallengeModal() {
    if (challengeModal) {
        challengeModal.style.display = 'none';
    }
}

// Copy challenge link
function copyChallengeLink() {
    if (!challengeLink) return;
    
    challengeLink.select();
    document.execCommand('copy');
    alert('Challenge link copied to clipboard!');
}

// Share challenge
function shareChallenge() {
    if (!challengeLink) return;
    
    if (navigator.share) {
        navigator.share({
            title: 'BlockZone Challenge',
            text: 'I challenge you to beat my score!',
            url: challengeLink.value
        });
    } else {
        copyChallengeLink();
    }
}

// Join championship
function joinChampionship(championshipId) {
    if (!currentUserId) {
        alert('Please log in to join championships.');
        return;
    }
    
    try {
        const championship = window.tournamentManager.activeChampionships.get(championshipId);
        window.tournamentManager.joinChampionship(championshipId, currentUserId, championship.entryFee);
        alert('Successfully joined championship!');
        loadActiveChampionships();
    } catch (err) {
        alert('Failed to join championship: ' + err.message);
    }
}

// View leaderboard
function viewLeaderboard(championshipId) {
    if (!window.tournamentManager) return;
    
    const leaderboard = window.tournamentManager.getLeaderboard(championshipId);
    const leaderboardText = leaderboard.map((entry, index) => 
        `#${index + 1}: ${entry.userId} - ${entry.bestScore}`
    ).join('\n');
    
    alert(`Championship Leaderboard:\n\n${leaderboardText}`);
}

// Accept challenge
function acceptChallenge(challengeId) {
    if (!currentUserId) {
        alert('Please log in to accept challenges.');
        return;
    }
    
    try {
        window.tournamentManager.acceptChallenge(challengeId, currentUserId);
        alert('Challenge accepted!');
        loadActiveChallenges();
    } catch (err) {
        alert('Failed to accept challenge: ' + err.message);
    }
}

// View challenge
function viewChallenge(challengeId) {
    if (!window.tournamentManager) return;
    
    const challenge = window.tournamentManager.activeChallenges.get(challengeId);
    if (!challenge) {
        alert('Challenge not found.');
        return;
    }
    
    const scoresText = Array.from(challenge.scores.entries())
        .map(([userId, score]) => `${userId}: ${score}`)
        .join('\n');
    
    alert(`Challenge Details:\n\nGame: ${challenge.gameId}\nPrize Pool: $${challenge.prizePool.toFixed(2)}\n\nScores:\n${scoresText || 'No scores yet'}`);
}

// Set reminder
function setReminder(championshipId) {
    alert('Reminder set! You\'ll be notified when the championship starts.');
}

// Close modal when clicking outside
if (challengeModal) {
    challengeModal.addEventListener('click', (e) => {
        if (e.target === challengeModal) {
            closeChallengeModal();
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeTournaments); 