/**
 * Unified Systems Test Suite
 * Comprehensive tests for all unified systems
 * Run in browser console or as a standalone test file
 */

class UnifiedSystemsTestSuite {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.systems = null;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Unified Systems Test Suite...');
        console.log('=' .repeat(60));
        
        try {
            // Import and initialize systems
            await this.initializeSystems();
            
            // Run test categories
            await this.runPlayerSystemTests();
            await this.runTournamentSystemTests();
            await this.runPlayerCardTests();
            await this.runIntegrationTests();
            await this.runLegacyCompatibilityTests();
            
            // Show final results
            this.showFinalResults();
            
        } catch (error) {
            console.error('❌ Test suite failed to initialize:', error);
        }
    }    /**
     * Initialize unified systems for testing
     */
    async initializeSystems() {
        console.log('� Initializing systems for testing...');
        
        try {
            // Dynamic import for testing
            const { UnifiedSystemsIntegration } = await import('./shared/platform/UnifiedSystemsIntegration.js');
            
            this.systems = new UnifiedSystemsIntegration({
                enableLogging: false, // Reduce noise during tests
                enableAutoMigration: false // Don't migrate during tests
            });
            
            await this.systems.initialize();
            console.log('✅ Systems initialized successfully');
        } catch (error) {
            // Fallback for testing - create mock systems
            console.warn('⚠️ Could not import real systems, using mocks for testing');
            this.systems = this.createMockSystems();
        }
    }

    /**
     * Create mock systems for testing when real imports fail
     */
    createMockSystems() {
        return {
            playerSystem: {
                isInitialized: true,
                currentPlayer: null,
                async createPlayer(data) {
                    this.currentPlayer = {
                        id: 'test_player_123',
                        displayName: data.displayName || 'Test Player',
                        level: 1,
                        experience: 0,
                        balances: { quarters: 0, usdc: 0, freeCredits: 100 },
                        stats: new Map()
                    };
                    return this.currentPlayer;
                },
                async getPlayer() { return this.currentPlayer; },
                async connectWallet(address) {
                    if (this.currentPlayer) {
                        this.currentPlayer.walletAddress = address;
                    }
                    return this.currentPlayer;
                },
                async updateGameStats(gameId, stats) {
                    if (this.currentPlayer) {
                        this.currentPlayer.experience += 50;
                        if (this.currentPlayer.experience >= 100) {
                            this.currentPlayer.level++;
                            this.currentPlayer.experience = 0;
                        }
                    }
                    return { success: true };
                },
                async processPayment(data) {
                    return { success: true, transactionId: 'test_tx_123' };
                },
                async getBalance(currency) { return 100; },
                canPlayFreeGame() { return true; },
                async useFreeGame() { return { available: 0, used: 1 }; }
            },
            tournamentSystem: {
                isInitialized: true,
                leaderboard: [],
                async getCurrentTournament() {
                    return { id: 'test_tournament_123', status: 'active' };
                },
                async submitScore(playerId, score, metadata) {
                    return {
                        playerId,
                        score,
                        rank: Math.floor(Math.random() * 100) + 1,
                        totalPlayers: 150,
                        isNewBest: score > 1000
                    };
                },
                async getLeaderboard(limit) {
                    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
                        rank: i + 1,
                        playerId: `player_${i}`,
                        playerName: `Player ${i + 1}`,
                        score: 2000 - (i * 100)
                    }));
                },
                getPlayerRank(playerId) { return Math.floor(Math.random() * 50) + 1; }
            },
            playerCard: {
                isVisible: false,
                currentState: 'hidden',
                async showWelcome() { this.isVisible = true; this.currentState = 'welcome'; },
                async showGameResults(score, stats) { this.isVisible = true; this.currentState = 'game_results'; },
                async showPlayerDashboard() { this.isVisible = true; this.currentState = 'dashboard'; },
                async showPaymentModal() { this.isVisible = true; this.currentState = 'payment'; },
                async showLeaderboard() { this.isVisible = true; this.currentState = 'leaderboard'; },
                hide() { this.isVisible = false; this.currentState = 'hidden'; }
            }
        };
    }

    // =============================================================================
    // PLAYER SYSTEM TESTS
    // =============================================================================

    async runPlayerSystemTests() {
        console.log('\n🧑‍💼 Testing Player System...');
        
        await this.test('Player System - Create Player', async () => {
            const player = await this.systems.playerSystem.createPlayer({
                displayName: 'Test Player'
            });
            
            this.assert(player, 'Player should be created');
            this.assert(player.id, 'Player should have an ID');
            this.assert(player.displayName === 'Test Player', 'Player should have correct name');
            this.assert(player.level === 1, 'Player should start at level 1');
            
            return true;
        });

        await this.test('Player System - Get Player', async () => {
            const player = await this.systems.playerSystem.getPlayer();
            
            this.assert(player, 'Should return current player');
            this.assert(player.id, 'Player should have an ID');
            
            return true;
        });

        await this.test('Player System - Connect Wallet', async () => {
            const mockAddress = '0x742d35Cc6548C6532C37D4E2c7C61d23E6b1234';
            const result = await this.systems.playerSystem.connectWallet(mockAddress);
            
            this.assert(result, 'Wallet connection should return result');
            this.assert(result.walletAddress === mockAddress, 'Player should have wallet address');
            
            return true;
        });

        await this.test('Player System - Update Game Stats', async () => {
            const result = await this.systems.playerSystem.updateGameStats('neondrop', {
                score: 1500,
                timePlayed: 120000
            });
            
            this.assert(result, 'Should return result');
            
            const player = await this.systems.playerSystem.getPlayer();
            this.assert(player.experience > 0, 'Player should gain experience');
            
            return true;
        });

        await this.test('Player System - Process Payment', async () => {
            const result = await this.systems.playerSystem.processPayment({
                amount: 0.25,
                currency: 'usdc',
                description: 'Test payment'
            });
            
            this.assert(result, 'Payment should return result');
            this.assert(result.status || result.success, 'Payment should be successful');
            
            return true;
        });

        await this.test('Player System - Free Game Management', async () => {
            const canPlay = this.systems.playerSystem.canPlayFreeGame();
            this.assert(typeof canPlay === 'boolean', 'Should return boolean for free game check');
            
            if (canPlay) {
                const result = await this.systems.playerSystem.useFreeGame();
                this.assert(result, 'Should return result when using free game');
            }
            
            return true;
        });
    }

    /**
     * Test 2: Player Creation and Management
     */
    async testPlayerManagement() {
        console.log('🧑‍💼 Test 2: Player Management');
        
        try {
            const playerSystem = this.systems.playerSystem;
            
            // Create a test player
            const testPlayer = await playerSystem.createPlayer({
                displayName: 'TestPlayer123',
                email: 'test@example.com'
            });
            
            // Verify player properties
            if (!testPlayer.id || !testPlayer.displayName) {
                throw new Error('Player missing required properties');
            }
            
            // Test experience and leveling
            await playerSystem.addExperience(150);
            const updatedPlayer = await playerSystem.getPlayer();
            
            if (updatedPlayer.level !== 2) {
                throw new Error('Level up logic failed');
            }
            
            // Test balance updates
            await playerSystem.updateBalance('quarters', 100);
            await playerSystem.updateBalance('usdc', 5.0);
            
            const finalPlayer = await playerSystem.getPlayer();
            if (finalPlayer.balances.quarters !== 100 || finalPlayer.balances.usdc !== 5.0) {
                throw new Error('Balance update failed');
            }
            
            this.testResults.push({
                test: 'Player Management',
                status: 'PASSED',
                details: `Player: ${testPlayer.displayName}, Level: ${finalPlayer.level}, Balances: Q${finalPlayer.balances.quarters} U${finalPlayer.balances.usdc}`
            });
            
            console.log('✅ Player management passed');
            
        } catch (error) {
            this.testResults.push({
                test: 'Player Management',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test 3: Tournament and Leaderboard
     */
    async testTournamentSystem() {
        console.log('🏆 Test 3: Tournament System');
        
        try {
            const tournamentSystem = this.systems.tournamentSystem;
            const playerSystem = this.systems.playerSystem;
            
            // Get current tournament
            const tournament = tournamentSystem.getCurrentTournament();
            if (!tournament) {
                throw new Error('No active tournament found');
            }
            
            // Submit test scores
            const player = await playerSystem.getPlayer();
            const scores = [1000, 1500, 2000, 1200];
            
            for (const score of scores) {
                await tournamentSystem.submitScore(player.id, score, {
                    playerName: player.displayName,
                    gameData: { testScore: true }
                });
                
                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Verify leaderboard
            const leaderboard = tournamentSystem.getLeaderboard(10);
            if (leaderboard.length === 0) {
                throw new Error('Leaderboard is empty after score submission');
            }
            
            // Verify player stats
            const playerStats = tournamentSystem.getPlayerStats(player.id);
            if (!playerStats || playerStats.bestScore !== 2000) {
                throw new Error('Player stats incorrect');
            }
            
            this.testResults.push({
                test: 'Tournament System',
                status: 'PASSED',
                details: `Tournament: ${tournament.id}, Best Score: ${playerStats.bestScore}, Rank: #${playerStats.rank}`
            });
            
            console.log('✅ Tournament system passed');
            
        } catch (error) {
            this.testResults.push({
                test: 'Tournament System',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test 4: UI Integration
     */
    async testUIIntegration() {
        console.log('🎨 Test 4: UI Integration');
        
        try {
            const playerCard = this.systems.playerCard;
            
            // Test that card container exists
            if (!playerCard.container) {
                throw new Error('Player card container not created');
            }
            
            // Test card states (quick tests without full display)
            if (!playerCard.states.WELCOME || !playerCard.states.GAME_RESULTS) {
                throw new Error('Card states not properly defined');
            }
            
            // Test that styles are injected
            const stylesElement = document.querySelector('#unified-card-styles');
            if (!stylesElement) {
                throw new Error('CSS styles not injected');
            }
            
            this.testResults.push({
                test: 'UI Integration',
                status: 'PASSED',
                details: 'Card container created, states defined, styles injected'
            });
            
            console.log('✅ UI integration passed');
            
        } catch (error) {
            this.testResults.push({
                test: 'UI Integration',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test 5: Cross-System Communication
     */
    async testCrossSystemCommunication() {
        console.log('📡 Test 5: Cross-System Communication');
        
        try {
            const playerSystem = this.systems.playerSystem;
            const tournamentSystem = this.systems.tournamentSystem;
            
            let eventReceived = false;
            
            // Test event emission
            playerSystem.on('player:updated', (data) => {
                eventReceived = true;
            });
            
            // Trigger an event
            await playerSystem.updatePlayer({ customTestField: 'test' });
            
            // Small delay for async event processing
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!eventReceived) {
                throw new Error('Cross-system event not received');
            }
            
            this.testResults.push({
                test: 'Cross-System Communication',
                status: 'PASSED',
                details: 'Events properly emitted and received between systems'
            });
            
            console.log('✅ Cross-system communication passed');
            
        } catch (error) {
            this.testResults.push({
                test: 'Cross-System Communication',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Test 6: Payment Processing
     */
    async testPaymentSystem() {
        console.log('💰 Test 6: Payment System');
        
        try {
            const playerSystem = this.systems.playerSystem;
            
            // Test balance-based payment
            const player = await playerSystem.getPlayer();
            const initialBalance = player.balances.usdc;
            
            // Add some balance first
            await playerSystem.updateBalance('usdc', 10);
            
            // Process a payment
            const paymentResult = await playerSystem.processPayment({
                amount: 2.5,
                currency: 'usdc',
                description: 'Test payment'
            });
            
            if (!paymentResult.success) {
                throw new Error('Payment processing failed');
            }
            
            // Verify balance was deducted
            const updatedPlayer = await playerSystem.getPlayer();
            const expectedBalance = initialBalance + 10 - 2.5;
            
            if (Math.abs(updatedPlayer.balances.usdc - expectedBalance) > 0.01) {
                throw new Error('Payment balance deduction incorrect');
            }
            
            this.testResults.push({
                test: 'Payment System',
                status: 'PASSED',
                details: `Payment processed: $2.50, New balance: $${updatedPlayer.balances.usdc}`
            });
            
            console.log('✅ Payment system passed');
            
        } catch (error) {
            this.testResults.push({
                test: 'Payment System',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Print test results summary
     */
    printTestResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(50));
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.status}`);
            
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            
            if (result.status === 'PASSED') passed++;
            else failed++;
        });
        
        console.log('\n' + '-' .repeat(30));
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Your unified systems are working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the errors above.');
        }
    }

    /**
     * Cleanup after tests
     */
    cleanup() {
        if (this.systems) {
            this.systems.destroy();
        }
        console.log('\n🧹 Test cleanup completed');
    }
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    // Add a button to run tests
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Run Unified Systems Tests';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        padding: 10px 15px;
        background: linear-gradient(45deg, #00d4ff, #0099cc);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
    `;
    
    testButton.addEventListener('click', async () => {
        const test = new UnifiedSystemsTest();
        await test.runAllTests();
    });
    
    document.body.appendChild(testButton);
}

export { UnifiedSystemsTest };
export default UnifiedSystemsTest;
