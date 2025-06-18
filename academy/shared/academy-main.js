/* ===================================================================
   BLOCKZONE ACADEMY - MINIMAL JAVASCRIPT
   Simple lesson progression tracking (no Stardust)
   =================================================================== */

// Simple lesson progress tracking
let lessonProgress = 0;
const totalSections = 10;

// Update progress counter
function updateProgress() {
    const progressElement = document.getElementById('lessonProgress') || document.getElementById('progressAmount');
    if (progressElement) {
        progressElement.textContent = lessonProgress;
    }
}

// Mark section as complete
function completeSection() {
    if (lessonProgress < totalSections) {
        lessonProgress++;
        updateProgress();
    }
}

// Quiz functionality
function checkAnswer(questionId, selectedAnswer, correctAnswer) {
    const options = document.querySelectorAll(`[data-question="${questionId}"] .answer-option`);
    
    options.forEach(option => {
        if (option.dataset.answer === correctAnswer) {
            option.classList.add('correct');
        } else if (option.dataset.answer === selectedAnswer && selectedAnswer !== correctAnswer) {
            option.classList.add('incorrect');
        }
        option.style.pointerEvents = 'none';
    });
    
    if (selectedAnswer === correctAnswer) {
        completeSection();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    
    // Add click handlers to quiz options
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach(option => {
        option.addEventListener('click', function() {
            const questionId = this.closest('.question-card').dataset.question;
            const selectedAnswer = this.dataset.answer;
            const correctAnswer = this.closest('.question-card').dataset.correct;
            
            checkAnswer(questionId, selectedAnswer, correctAnswer);
        });
    });
});
