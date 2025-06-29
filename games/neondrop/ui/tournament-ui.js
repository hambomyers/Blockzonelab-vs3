/**
 * ui/tournament-ui.js - Beautiful, Understated Tournament Interface
 * Provides a subtle, elegant way to join tournaments
 */

export class TournamentUI {    constructor() {
        this.container = null;
        this.isVisible = false;
        this.tournament = null; // Will be set by main.js
        
        // Don't setup UI automatically - only when show() is called
    }    show() {
        // COMPLETELY DISABLED - Using HTML game menu card instead
        console.log('🏆 Tournament UI disabled - using HTML-based game menu card');
        this.isVisible = false; // Keep it marked as not visible
        return; // Do absolutely nothing
    }

    hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    setupUI() {
        // Find existing tournament panel or create one
        this.container = document.getElementById('tournamentUI');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'tournamentUI';
            this.container.className = 'tournament-panel';
            document.body.appendChild(this.container);
        }

        // Always update the content to be consistent
        this.updateContent();

        // Start with a subtle hidden state
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateX(-50%) translateY(-20px)';
        
        // Fade in beautifully after a delay
        setTimeout(() => {
            this.container.style.transition = 'all 0.8s ease';
            this.container.style.opacity = '1';
            this.container.style.transform = 'translateX(-50%) translateY(0)';
        }, 1000);
    }

    updateContent() {
        this.container.innerHTML = `
            <div class="tournament-header">
                <h3>🏆 Daily Championship</h3>
                <div class="tournament-timer" id="tournamentTimer">Loading...</div>
            </div>
            <div class="tournament-info">
                <div class="tournament-entry">Entry: $0.25 USDC | Winner Gets: <span id="prizePool">$100+</span></div>
                <div class="tournament-description">⚡ 90% to Players • 10% Platform Fee • Daily reset at 11:00 PM EST</div>
                <div class="tournament-philosophy">
                    🏆 One champion per day - compete for the daily crown!
                </div>
                <div id="tournamentParticipants">Loading participants...</div>
            </div>
            <div class="tournament-actions">
                <button id="tournamentJoinBtn" class="tournament-join-btn">Join Championship ($0.25)</button>
                <button id="practiceBtn" class="practice-btn">Practice Mode (Free)</button>
                <button id="viewLeaderboardBtn" class="view-leaderboard-btn">View Leaderboard</button>
            </div>
        `;
    }    setupEventListeners() {
        if (!this.container) return;
        
        // Join tournament button
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'tournamentJoinBtn') {
                this.handleJoinTournament();
            } else if (e.target.id === 'practiceBtn') {
                this.handlePracticeMode();
            } else if (e.target.id === 'viewLeaderboardBtn') {
                this.handleViewLeaderboard();
            }
        });

        // Auto-update timer and participants
        this.startAutoUpdate();
    }

    handleJoinTournament() {
        if (!this.tournament) {
            console.warn('Tournament system not available');
            return;
        }

        // Beautiful loading state
        const btn = document.getElementById('tournamentJoinBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Joining...';
        btn.disabled = true;

        // Try to join tournament
        this.tournament.joinTournament()
            .then(() => {
                btn.textContent = '✓ Joined!';
                btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                
                // Show success briefly, then update
                setTimeout(() => {
                    this.updateTournamentStatus();
                }, 1500);
            })
            .catch((error) => {
                console.error('Failed to join tournament:', error);
                btn.textContent = originalText;
                btn.disabled = false;
                
                // Show error briefly
                btn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
                setTimeout(() => {
                    btn.style.background = '';
                }, 2000);
            });
    }    handlePracticeMode() {
        // Hide tournament UI and start practice
        this.hide();
        
        // Start the game in practice mode
        if (window.neonDrop?.engine) {
            window.neonDrop.engine.handleInput({ type: 'START_GAME' });
        }
    }

    handleViewLeaderboard() {
        // Hide tournament UI and show leaderboard
        this.hide();
        
        // Show the leaderboard
        if (window.leaderboardUI) {
            window.leaderboardUI.show();
        } else {
            console.warn('Leaderboard UI not available');
        }
    }

    startAutoUpdate() {
        this.updateTimer();
        this.updateParticipants();
        
        // Update every 30 seconds
        setInterval(() => {
            this.updateTimer();
            this.updateParticipants();
        }, 30000);
    }

    updateTimer() {
        const timerElement = document.getElementById('tournamentTimer');
        if (!timerElement) return;

        // Calculate time until next tournament (11 PM EST)
        const now = new Date();
        const nextTournament = new Date();
        nextTournament.setUTCHours(4, 0, 0, 0); // 11 PM EST = 4 AM UTC next day
        
        if (now.getUTCHours() >= 4) {
            nextTournament.setUTCDate(nextTournament.getUTCDate() + 1);
        }

        const timeDiff = nextTournament - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        timerElement.textContent = `Next Championship: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateParticipants() {
        const participantsElement = document.getElementById('tournamentParticipants');
        if (!participantsElement) return;

        if (this.tournament?.getParticipantCount) {
            this.tournament.getParticipantCount()
                .then(count => {
                    participantsElement.textContent = `${count} players joined`;
                })
                .catch(() => {
                    participantsElement.textContent = 'Loading participants...';
                });
        } else {
            participantsElement.textContent = 'Loading participants...';
        }
    }

    updateTournamentStatus() {
        // Update button state based on tournament status
        const joinBtn = document.getElementById('tournamentJoinBtn');
        if (!joinBtn) return;

        if (this.tournament?.isJoined?.()) {
            joinBtn.textContent = '✓ Championship Joined';
            joinBtn.disabled = true;
            joinBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        } else {
            joinBtn.textContent = 'Join Championship ($0.25)';
            joinBtn.disabled = false;
            joinBtn.style.background = '';
        }
    }    show() {
        console.log('🏆 Tournament UI show() called');
        this.isVisible = true;
        this.container.style.display = 'block';
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateX(-50%) translateY(0)';
        console.log('🏆 Tournament UI visibility set to:', this.isVisible);
    }

    hide() {
        this.isVisible = false;
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateX(-50%) translateY(-20px)';
        
        setTimeout(() => {
            if (!this.isVisible) {
                this.container.style.display = 'none';
            }
        }, 300);
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Set tournament system reference
    setTournament(tournament) {
        this.tournament = tournament;
        this.updateTournamentStatus();
    }
}

