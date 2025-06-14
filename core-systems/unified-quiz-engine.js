/**
 * BLOCKZONE LAB - Unified Quiz Engine
 * The ONE quiz engine to rule them all
 * Nuclear option: Replace 6 duplicate systems with one unified architecture
 */

class UnifiedQuizEngine {
    constructor() {
        this.lessons = {};
        this.currentLesson = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.starfield = null;
        this.autoAdvanceDelay = 1500; // 1.5 seconds
        
        this.init();
    }

    async init() {
        // Auto-detect lesson from URL
        const lessonMatch = window.location.pathname.match(/lesson-(\d+)/);
        if (lessonMatch) {
            const lessonNumber = lessonMatch[1];
            await this.loadLesson(lessonNumber);
            this.initializeStarfield();
            this.renderQuiz();
        }
    }

    async loadLesson(lessonNumber) {
        try {            // Load lesson data from JSON
            const response = await fetch(`/academy/lessons/${String(lessonNumber).padStart(2, '0')}-*/lesson-data.json`);
            const lessonData = await response.json();
            this.currentLesson = lessonData;
            
            // Set page title
            document.title = `${lessonData.title} - BlockZone Lab`;
            
            // Update header
            const header = document.querySelector('.quiz-header h1');
            if (header) {
                header.textContent = lessonData.title;
            }
            
        } catch (error) {
            console.error('Failed to load lesson:', error);
            // Fallback to embedded data if JSON fails
            this.loadFallbackData(lessonNumber);
        }
    }

    loadFallbackData(lessonNumber) {
        // Fallback lesson data - extract from existing lesson files
        const lessons = {
            '01': {
                title: 'Introduction to Blockchain',
                questions: [
                    {
                        question: 'What is a blockchain?',
                        options: [
                            'A digital ledger',
                            'A type of cryptocurrency', 
                            'A mining tool',
                            'A wallet application'
                        ],
                        correct: 0
                    },
                    {
                        question: 'What makes blockchain secure?',
                        options: [
                            'Password protection',
                            'Cryptographic hashing',
                            'Firewall systems',
                            'Antivirus software'
                        ],
                        correct: 1
                    },
                    {
                        question: 'What is decentralization?',
                        options: [
                            'One central authority',
                            'Multiple control points',
                            'Government regulation',
                            'Corporate oversight'
                        ],
                        correct: 1
                    }
                ]
            }
        };
        
        this.currentLesson = lessons[lessonNumber] || lessons['01'];
    }

    initializeStarfield() {
        // Import and initialize universal starfield
        if (typeof UniversalStarfield !== 'undefined') {
            this.starfield = new UniversalStarfield();
        }
    }

    renderQuiz() {
        this.renderQuestion();
        this.renderProgress();
        this.attachEventListeners();
    }

    renderQuestion() {
        const container = document.querySelector('.quiz-container');
        if (!container || !this.currentLesson) return;

        const question = this.currentLesson.questions[this.currentQuestionIndex];
        const totalQuestions = this.currentLesson.questions.length;

        container.innerHTML = `
            <div class="quiz-content">
                <div class="quiz-header">
                    <h1>BlockZone Lab</h1>
                </div>
                
                <div class="quiz-main">
                    <div class="quiz-question">
                        <h2>${question.question}</h2>
                    </div>
                    
                    <div class="quiz-options">
                        ${question.options.map((option, index) => `
                            <div class="quiz-option" data-index="${index}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="quiz-progress-container">
                    <div class="quiz-progress">
                        <div class="quiz-progress-bar" style="width: ${((this.currentQuestionIndex + 1) / totalQuestions) * 100}%"></div>
                    </div>
                </div>
                
                <div class="quiz-nav back-arrow">
                    <a href="/academy/" class="back-link">← Back to Lessons</a>
                </div>
            </div>
        `;
    }

    renderProgress() {
        const progressBar = document.querySelector('.quiz-progress-bar');
        if (progressBar) {
            const totalQuestions = this.currentLesson.questions.length;
            const progress = ((this.currentQuestionIndex + 1) / totalQuestions) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    attachEventListeners() {
        // Answer selection
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleAnswerSelection(e);
            });
        });
    }

    handleAnswerSelection(event) {
        const selectedIndex = parseInt(event.target.dataset.index);
        const question = this.currentLesson.questions[this.currentQuestionIndex];
        
        // Mark answer as selected
        document.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
        event.target.classList.add('selected');
        
        // Store answer
        this.userAnswers[this.currentQuestionIndex] = selectedIndex;
        
        // Check if correct
        const isCorrect = selectedIndex === question.correct;
        if (isCorrect) {
            this.score++;
            event.target.classList.add('correct');
        } else {
            event.target.classList.add('incorrect');
            // Show correct answer
            document.querySelectorAll('.quiz-option')[question.correct].classList.add('correct');
        }

        // Auto-advance with smooth transition
        setTimeout(() => {
            this.nextQuestion();
        }, this.autoAdvanceDelay);
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentLesson.questions.length - 1) {
            // Fade out current question
            const container = document.querySelector('.quiz-content');
            container.style.opacity = '0';
            
            setTimeout(() => {
                this.currentQuestionIndex++;
                this.renderQuestion();
                this.attachEventListeners();
                
                // Fade in new question
                setTimeout(() => {
                    container.style.opacity = '1';
                }, 100);
            }, 300);
        } else {
            // Quiz complete
            this.showResults();
        }
    }

    showResults() {
        const container = document.querySelector('.quiz-container');
        const totalQuestions = this.currentLesson.questions.length;
        const percentage = Math.round((this.score / totalQuestions) * 100);
        
        container.innerHTML = `
            <div class="quiz-content quiz-results">
                <div class="quiz-header">
                    <h1>BlockZone Lab</h1>
                </div>
                
                <div class="quiz-main">
                    <div class="quiz-question">
                        <h2>Quiz Complete!</h2>
                    </div>
                    
                    <div class="quiz-score">
                        <div class="score-display">
                            <div class="score-number">${this.score}/${totalQuestions}</div>
                            <div class="score-percentage">${percentage}%</div>
                        </div>
                        
                        <div class="score-message">
                            ${this.getScoreMessage(percentage)}
                        </div>
                    </div>
                    
                    <div class="quiz-actions">
                        <a href="/academy/" class="quiz-nav primary">Back to Lessons</a>
                        <button class="quiz-nav secondary" onclick="window.location.reload()">Retake Quiz</button>
                    </div>
                </div>
                
                <div class="quiz-nav back-arrow">
                    <a href="/academy/" class="back-link">← Back to Lessons</a>
                </div>
            </div>
        `;
    }

    getScoreMessage(percentage) {
        if (percentage >= 90) return "Excellent! You've mastered this lesson.";
        if (percentage >= 70) return "Great job! You understand the concepts well.";
        if (percentage >= 50) return "Good effort! Consider reviewing the material.";
        return "Keep learning! Practice makes perfect.";
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new UnifiedQuizEngine();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedQuizEngine;
}
