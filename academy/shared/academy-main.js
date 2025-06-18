/* ===================================================================
   BLOCKZONE ACADEMY - MINIMAL JAVASCRIPT
   Simple academy functionality without complexity
   =================================================================== */

// Basic lesson progress tracking (no rewards, just progress)
let lessonProgress = {
    currentLesson: 1,
    sectionsCompleted: 0,
    totalSections: 10
};

// Update progress display
function updateProgress() {
    const progressElement = document.getElementById('lessonProgress');
    if (progressElement) {
        progressElement.textContent = lessonProgress.sectionsCompleted;
    }
}

// Mark section as completed
function completeSection() {
    if (lessonProgress.sectionsCompleted < lessonProgress.totalSections) {
        lessonProgress.sectionsCompleted++;
        updateProgress();
    }
}

// Quiz functionality
function checkAnswer(questionElement, selectedAnswer, correctAnswer) {
    const options = questionElement.querySelectorAll('.answer-option');
    
    options.forEach(option => {
        option.classList.remove('correct', 'incorrect');
        if (option.textContent.trim() === correctAnswer) {
            option.classList.add('correct');
        } else if (option === selectedAnswer && option.textContent.trim() !== correctAnswer) {
            option.classList.add('incorrect');
        }
    });
    
    if (selectedAnswer.textContent.trim() === correctAnswer) {
        completeSection();
        return true;
    }
    return false;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    
    // Add click handlers to quiz answers
    document.querySelectorAll('.answer-option').forEach(option => {
        option.addEventListener('click', function() {
            const questionCard = this.closest('.question-card');
            const correctAnswer = questionCard.dataset.correct;
            checkAnswer(questionCard, this, correctAnswer);
        });
    });
});

// Export for other scripts
window.AcademyMain = {
    updateProgress,
    completeSection,
    checkAnswer
};
