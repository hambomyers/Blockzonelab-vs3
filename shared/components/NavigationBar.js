/**
 * NavigationBar.js - Universal Side Panel Navigation
 * AAA Production Quality Side Panel Navigation System
 * Discord/Steam inspired side navigation panel
 * ENHANCED: Context-aware with lesson-specific features
 */

export class NavigationBar {
    constructor() {
        this.container = null;
        this.isVisible = true;
        this.isExpanded = false;
        this.currentPage = this.detectCurrentPage();
        this.currentLesson = this.detectCurrentLesson();
        this.isGameActive = false;
        this.lessonProgress = this.loadLessonProgress();
        
        this.createContainer();
        this.bindEvents();
        this.updateVisibility();
        this.setupLessonContext();
        
        console.log('🧭 Smart Side Panel Navigation initialized for page:', this.currentPage, 'lesson:', this.currentLesson);
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/games/neondrop')) return 'game';
        if (path.includes('/academy')) return 'academy';
        if (path.includes('/test-challenge-ui')) return 'challenge';
        if (path.includes('/games')) return 'games';
        
        return 'home';
    }

    detectCurrentLesson() {
        const path = window.location.pathname;
        const lessonMatch = path.match(/\/lesson-(\d+)/);
        return lessonMatch ? parseInt(lessonMatch[1]) : null;
    }

    loadLessonProgress() {
        try {
            const saved = localStorage.getItem('blockzone_lesson_progress');
            return saved ? JSON.parse(saved) : {
                1: { completed: false, quizScore: 0, lastAccessed: null },
                2: { completed: false, quizScore: 0, lastAccessed: null },
                3: { completed: false, quizScore: 0, lastAccessed: null },
                4: { completed: false, quizScore: 0, lastAccessed: null },
                5: { completed: false, quizScore: 0, lastAccessed: null },
                6: { completed: false, quizScore: 0, lastAccessed: null }
            };
        } catch (e) {
            return {};
        }
    }

    saveLessonProgress() {
        try {
            localStorage.setItem('blockzone_lesson_progress', JSON.stringify(this.lessonProgress));
        } catch (e) {
            console.warn('Could not save lesson progress:', e);
        }
    }

    updateLessonProgress(lessonNumber, data) {
        this.lessonProgress[lessonNumber] = {
            ...this.lessonProgress[lessonNumber],
            ...data,
            lastAccessed: new Date().toISOString()
        };
        this.saveLessonProgress();
        this.updateLessonContext();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'sidePanelNavigation';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            width: 60px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            border-left: 1px solid rgba(0, 212, 255, 0.3);
            z-index: 10000;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0;
            box-shadow: -8px 0 32px rgba(0, 212, 255, 0.1);
            transform: translateX(0);
        `;
        
        this.container.innerHTML = this.generateNavigationHTML();
        document.body.appendChild(this.container);
        
        // Animate in
        setTimeout(() => {
            this.container.style.transform = 'translateX(0)';
        }, 100);
    }

    generateNavigationHTML() {
        const navItems = [
            { id: 'home', icon: '🏠', label: 'Home', url: '/' },
            { id: 'games', icon: '🎮', label: 'Games', url: '/games/' },
            { id: 'challenge', icon: '⚡', label: 'Challenges', url: '/test-challenge-ui.html' },
            { id: 'leaderboard', icon: '🏆', label: 'Leaderboard', url: '/games/neondrop/' },
            { id: 'academy', icon: '📚', label: 'Academy', url: '/academy/' }
        ];

        // Add lesson-specific items if in academy
        const lessonItems = this.currentLesson ? this.generateLessonItems() : '';

        return `
            <div class="side-panel-header" style="
                margin-bottom: 30px;
                text-align: center;
            ">
                <div class="logo-mini" style="
                    font-size: 20px;
                    color: #00d4ff;
                    margin-bottom: 5px;
                    text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
                ">✧</div>
                <div class="logo-text" style="
                    font-size: 8px;
                    color: #00d4ff;
                    font-weight: bold;
                    letter-spacing: 1px;
                    opacity: 0.8;
                ">BZ</div>
            </div>
            
            <div class="nav-items" style="
                display: flex;
                flex-direction: column;
                gap: 15px;
                flex: 1;
            ">
                ${navItems.map(item => {
                    const isActive = this.currentPage === item.id;
                    const activeClass = isActive ? 'nav-active' : '';
                    
                    return `
                        <button class="nav-item ${activeClass}" data-page="${item.id}" data-url="${item.url}" style="
                            background: ${isActive ? 'linear-gradient(135deg, #00d4ff, #0099cc)' : 'transparent'};
                            color: ${isActive ? '#ffffff' : '#ffffff'};
                            border: none;
                            border-radius: 12px;
                            padding: 12px;
                            font-size: 18px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 40px;
                            height: 40px;
                            opacity: ${isActive ? '1' : '0.7'};
                            transform: ${isActive ? 'scale(1.1)' : 'scale(1)'};
                            box-shadow: ${isActive ? '0 4px 15px rgba(0, 212, 255, 0.3)' : 'none'};
                            position: relative;
                        " onmouseover="this.style.opacity='1'; this.style.transform='scale(1.1)'" onmouseout="this.style.opacity='${isActive ? '1' : '0.7'}'; this.style.transform='scale(${isActive ? '1.1' : '1'})'">
                            <span style="font-size: 18px;">${item.icon}</span>
                            <span class="nav-label" style="
                                position: absolute;
                                left: 50px;
                                background: rgba(0, 0, 0, 0.9);
                                color: white;
                                padding: 8px 12px;
                                border-radius: 8px;
                                font-size: 12px;
                                white-space: nowrap;
                                opacity: 0;
                                transform: translateX(-10px);
                                transition: all 0.3s ease;
                                pointer-events: none;
                                z-index: 10001;
                                border: 1px solid rgba(0, 212, 255, 0.3);
                            ">${item.label}</span>
                        </button>
                    `;
                }).join('')}
                
                ${lessonItems}
            </div>
            
            <div class="side-panel-footer" style="
                margin-top: auto;
                padding-top: 20px;
                text-align: center;
            ">
                <button class="expand-toggle" style="
                    background: transparent;
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    color: #00d4ff;
                    border-radius: 8px;
                    padding: 8px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0.7;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                    ⋯
                </button>
            </div>
        `;
    }

    generateLessonItems() {
        if (!this.currentLesson) return '';

        const lessonTitles = {
            1: 'Computing & Binary',
            2: 'Money & Scarcity',
            3: 'Blockchain Fundamentals',
            4: 'Smart Contracts',
            5: 'DeFi & DEXes',
            6: 'Sonic Labs'
        };

        const lessonIcons = {
            1: '💻',
            2: '💰',
            3: '⛓️',
            4: '📜',
            5: '🔄',
            6: '⚡'
        };

        const currentProgress = this.lessonProgress[this.currentLesson] || {};
        const isCompleted = currentProgress.completed;
        const quizScore = currentProgress.quizScore || 0;

        return `
            <div class="lesson-context" style="
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(0, 212, 255, 0.2);
            ">
                <div class="lesson-header" style="
                    text-align: center;
                    margin-bottom: 15px;
                ">
                    <div class="lesson-icon" style="
                        font-size: 24px;
                        color: ${isCompleted ? '#22c55e' : '#00d4ff'};
                        margin-bottom: 5px;
                    ">${lessonIcons[this.currentLesson]}</div>
                    <div class="lesson-number" style="
                        font-size: 10px;
                        color: rgba(255, 255, 255, 0.7);
                        font-weight: bold;
                    ">LESSON ${this.currentLesson}</div>
                </div>

                <div class="lesson-progress" style="
                    margin-bottom: 15px;
                ">
                    <div class="progress-bar" style="
                        width: 40px;
                        height: 4px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 2px;
                        overflow: hidden;
                        margin: 0 auto 8px;
                    ">
                        <div class="progress-fill" style="
                            height: 100%;
                            background: ${isCompleted ? '#22c55e' : '#00d4ff'};
                            width: ${isCompleted ? '100%' : '0%'};
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <div class="progress-text" style="
                        font-size: 8px;
                        color: rgba(255, 255, 255, 0.6);
                        text-align: center;
                    ">${isCompleted ? 'COMPLETE' : 'IN PROGRESS'}</div>
                </div>

                <div class="lesson-actions" style="
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                ">
                    ${this.currentLesson > 1 ? `
                        <button class="lesson-nav prev-lesson" data-lesson="${this.currentLesson - 1}" style="
                            background: transparent;
                            border: 1px solid rgba(0, 212, 255, 0.3);
                            color: #00d4ff;
                            border-radius: 8px;
                            padding: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            opacity: 0.7;
                        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                            ←
                        </button>
                    ` : ''}
                    
                    ${this.currentLesson < 6 ? `
                        <button class="lesson-nav next-lesson" data-lesson="${this.currentLesson + 1}" style="
                            background: transparent;
                            border: 1px solid rgba(0, 212, 255, 0.3);
                            color: #00d4ff;
                            border-radius: 8px;
                            padding: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            opacity: 0.7;
                        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                            →
                        </button>
                    ` : ''}
                    
                    <button class="lesson-help" style="
                        background: transparent;
                        border: 1px solid rgba(255, 215, 0, 0.3);
                        color: #ffd700;
                        border-radius: 8px;
                        padding: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        opacity: 0.7;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                        ?
                    </button>
                </div>

                ${quizScore > 0 ? `
                    <div class="quiz-score" style="
                        margin-top: 10px;
                        text-align: center;
                        padding: 6px;
                        background: rgba(34, 197, 94, 0.1);
                        border: 1px solid rgba(34, 197, 94, 0.3);
                        border-radius: 6px;
                    ">
                        <div style="font-size: 8px; color: #22c55e; font-weight: bold;">QUIZ</div>
                        <div style="font-size: 10px; color: #22c55e;">${quizScore}%</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupLessonContext() {
        if (this.currentLesson) {
            // Update progress when quiz is completed
            window.addEventListener('quizCompleted', (e) => {
                const { score, totalQuestions } = e.detail;
                const percentage = Math.round((score / totalQuestions) * 100);
                this.updateLessonProgress(this.currentLesson, {
                    completed: percentage >= 70,
                    quizScore: percentage
                });
            });

            // Update progress when lesson is accessed
            this.updateLessonProgress(this.currentLesson, {
                lastAccessed: new Date().toISOString()
            });
        }
    }

    updateLessonContext() {
        if (this.currentLesson) {
            const lessonContext = this.container.querySelector('.lesson-context');
            if (lessonContext) {
                lessonContext.innerHTML = this.generateLessonItems();
            }
        }
    }

    bindEvents() {
        // Navigation item clicks
        this.container.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const page = navItem.dataset.page;
                const url = navItem.dataset.url;
                
                if (page === this.currentPage) {
                    // Already on this page, maybe scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                
                // Navigate to new page
                this.navigateTo(url, page);
            }
            
            // Lesson navigation
            const lessonNav = e.target.closest('.lesson-nav');
            if (lessonNav) {
                const lessonNumber = parseInt(lessonNav.dataset.lesson);
                this.navigateToLesson(lessonNumber);
            }
            
            // Lesson help
            if (e.target.classList.contains('lesson-help')) {
                this.showLessonHelp();
            }
            
            // Expand toggle
            if (e.target.classList.contains('expand-toggle')) {
                this.toggleExpanded();
            }
        });

        // Show labels on hover
        this.container.addEventListener('mouseenter', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const label = navItem.querySelector('.nav-label');
                if (label) {
                    label.style.opacity = '1';
                    label.style.transform = 'translateX(0)';
                }
            }
        });

        this.container.addEventListener('mouseleave', (e) => {
            const labels = this.container.querySelectorAll('.nav-label');
            labels.forEach(label => {
                label.style.opacity = '0';
                label.style.transform = 'translateX(-10px)';
            });
        });

        // Keyboard shortcuts for lesson navigation
        document.addEventListener('keydown', (e) => {
            if (this.currentLesson && !e.target.matches('input, textarea')) {
                if (e.key === 'ArrowLeft' && this.currentLesson > 1) {
                    e.preventDefault();
                    this.navigateToLesson(this.currentLesson - 1);
                } else if (e.key === 'ArrowRight' && this.currentLesson < 6) {
                    e.preventDefault();
                    this.navigateToLesson(this.currentLesson + 1);
                } else if (e.key === 'h' || e.key === 'H') {
                    e.preventDefault();
                    this.showLessonHelp();
                }
            }
        });

        // Auto-hide during gameplay
        this.setupGameDetection();
        
        // Mobile touch handling
        this.setupMobileHandling();
    }

    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
            this.container.style.width = '200px';
            this.container.style.transform = 'translateX(0)';
        } else {
            this.container.style.width = '60px';
            this.container.style.transform = 'translateX(0)';
        }
    }

    setupGameDetection() {
        // Listen for game state changes
        window.addEventListener('gameStarted', () => {
            this.isGameActive = true;
            this.updateVisibility();
        });
        
        window.addEventListener('gameEnded', () => {
            this.isGameActive = false;
            this.updateVisibility();
        });
        
        // Auto-detect if we're in a game
        if (window.location.pathname.includes('/games/neondrop')) {
            this.isGameActive = true;
        }
    }

    setupMobileHandling() {
        // On mobile, make the side panel a bottom sheet
        if (window.BlockZoneMobile && window.BlockZoneMobile.isMobile()) {
            this.container.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                top: auto;
                height: 80px;
                width: 100%;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border-top: 1px solid rgba(0, 212, 255, 0.3);
                z-index: 10000;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-around;
                padding: 0 20px;
                box-shadow: 0 -8px 32px rgba(0, 212, 255, 0.1);
                transform: translateY(0);
            `;
            
            // Update the navigation items for mobile
            const navItems = this.container.querySelector('.nav-items');
            if (navItems) {
                navItems.style.cssText = `
                    display: flex;
                    flex-direction: row;
                    gap: 20px;
                    justify-content: space-around;
                    width: 100%;
                `;
            }
        }
    }

    navigateTo(url, page) {
        console.log('🧭 Navigating to:', page, url);
        
        // Update current page
        this.currentPage = page;
        
        // Navigate
        window.location.href = url;
    }

    navigateToLesson(lessonNumber) {
        const lessonUrl = `/academy/lessons/lesson-${lessonNumber}/`;
        window.location.href = lessonUrl;
    }

    showLessonHelp() {
        if (!this.currentLesson) return;

        const helpContent = {
            1: {
                title: '💻 Computing & Binary Help',
                content: `
                    <h3>Key Concepts:</h3>
                    <ul>
                        <li><strong>Binary System:</strong> Base-2 number system using only 0s and 1s</li>
                        <li><strong>Turing Machine:</strong> Theoretical model of computation</li>
                        <li><strong>Information Theory:</strong> How data can be encoded and transmitted</li>
                    </ul>
                    <h3>Interactive Elements:</h3>
                    <ul>
                        <li>Use the binary converter to see how numbers work in different bases</li>
                        <li>Click on highlighted terms for more information</li>
                        <li>Complete the 30-question quiz to test your understanding</li>
                    </ul>
                `
            },
            2: {
                title: '💰 Money & Scarcity Help',
                content: `
                    <h3>Key Concepts:</h3>
                    <ul>
                        <li><strong>Digital Money:</strong> Information that represents value</li>
                        <li><strong>Scarcity Paradox:</strong> How digital copies can remain valuable</li>
                        <li><strong>Cryptographic Proof:</strong> Mathematical verification of ownership</li>
                    </ul>
                    <h3>Interactive Elements:</h3>
                    <ul>
                        <li>Compare physical vs digital money costs in the converter</li>
                        <li>Explore the story sections for deep insights</li>
                        <li>Test your knowledge with the comprehensive quiz</li>
                    </ul>
                `
            },
            3: {
                title: '⛓️ Blockchain Fundamentals Help',
                content: `
                    <h3>Key Concepts:</h3>
                    <ul>
                        <li><strong>Distributed Ledger:</strong> Shared database across multiple nodes</li>
                        <li><strong>Consensus Mechanisms:</strong> How agreement is reached</li>
                        <li><strong>Cryptographic Hashing:</strong> Creating unique digital fingerprints</li>
                    </ul>
                    <h3>Interactive Elements:</h3>
                    <ul>
                        <li>Visualize blockchain structure in the interactive demo</li>
                        <li>Learn about different consensus mechanisms</li>
                        <li>Understand the security principles</li>
                    </ul>
                `
            },
            4: {
                title: '📜 Smart Contracts Help',
                content: `
                    <h3>Key Concepts:</h3>
                    <ul>
                        <li><strong>Programmable Money:</strong> Code that executes automatically</li>
                        <li><strong>Gas Fees:</strong> Cost of computation on blockchain</li>
                        <li><strong>Decentralized Applications:</strong> Apps running on blockchain</li>
                    </ul>
                    <h3>Interactive Elements:</h3>
                    <ul>
                        <li>Write and test smart contract code</li>
                        <li>Learn about gas optimization</li>
                        <li>Explore real-world use cases</li>
                    </ul>
                `
            },
            5: {
                title: '🔄 DeFi & DEXes Help',
                content: `
                    <h3>Key Concepts:</h3>
                    <ul>
                        <li><strong>Decentralized Finance:</strong> Financial services without intermediaries</li>
                        <li><strong>Automated Market Makers:</strong> Algorithmic trading protocols</li>
                        <li><strong>Yield Farming:</strong> Earning rewards for providing liquidity</li>
                    </ul>
                    <h3>Interactive Elements:</h3>
                    <ul>
                        <li>Simulate trading on a DEX</li>
                        <li>Learn about liquidity pools</li>
                        <li>Understand yield strategies</li>
                    </ul>
                `
            },
            6: {
                title: '⚡ Sonic Labs Help',
                content: `
                    <h3>Key Concepts:</h3>
                    <ul>
                        <li><strong>High Performance:</strong> Ultra-fast blockchain technology</li>
                        <li><strong>Scalability:</strong> Handling thousands of transactions per second</li>
                        <li><strong>Innovation:</strong> Cutting-edge blockchain solutions</li>
                    </ul>
                    <h3>Interactive Elements:</h3>
                    <ul>
                        <li>Explore Sonic Labs architecture</li>
                        <li>Test high-speed transactions</li>
                        <li>Learn about future developments</li>
                    </ul>
                `
            }
        };

        const help = helpContent[this.currentLesson];
        if (!help) return;

        // Create help modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                padding: 30px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                color: white;
                font-family: 'Inter', sans-serif;
                transform: scale(0.8);
                transition: transform 0.3s ease;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                ">
                    <h2 style="color: #00d4ff; margin: 0;">${help.title}</h2>
                    <button onclick="this.closest('.help-modal').remove()" style="
                        background: none;
                        border: none;
                        color: #00d4ff;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div style="line-height: 1.6;">
                    ${help.content}
                </div>
                <div style="
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(0, 212, 255, 0.3);
                    text-align: center;
                ">
                    <button onclick="this.closest('.help-modal').remove()" style="
                        background: linear-gradient(135deg, #00d4ff, #0099cc);
                        border: none;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Got it!</button>
                </div>
            </div>
        `;

        modal.className = 'help-modal';
        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        }, 10);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    updateVisibility() {
        if (this.isGameActive && this.isVisible) {
            this.hide();
        } else if (!this.isGameActive && !this.isVisible) {
            this.show();
        }
    }

    show() {
        this.isVisible = true;
        this.container.style.transform = 'translateX(0)';
        console.log('🧭 Side panel shown');
    }

    hide() {
        this.isVisible = false;
        this.container.style.transform = 'translateX(100%)';
        console.log('🧭 Side panel hidden');
    }

    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateCurrentPage(page) {
        this.currentPage = page;
        // Update active states
        const navItems = this.container.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('nav-active');
            if (item.dataset.page === page) {
                item.classList.add('nav-active');
            }
        });
    }

    showQuickActions(actions = []) {
        // Implementation for quick actions if needed
        console.log('🧭 Quick actions:', actions);
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Global navigation instance
window.globalNavigation = null;

// Auto-initialize navigation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.globalNavigation) {
        window.globalNavigation = new NavigationBar();
    }
});

// Export for module usage
export default NavigationBar; 