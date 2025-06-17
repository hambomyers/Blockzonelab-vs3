// Lesson 1: Computing & Binary Fundamentals - Quiz Engine
// This script handles the interactive binary demo and quiz functionality

// Binary Demo Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Binary Interactive Demo
    const bits = document.querySelectorAll('.bit');
    const binaryDisplay = document.getElementById('binaryValue');
    const decimalDisplay = document.getElementById('decimalValue');
    
    bits.forEach(bit => {
        bit.addEventListener('click', function() {
            const currentValue = this.textContent;
            this.textContent = currentValue === '0' ? '1' : '0';
            this.classList.toggle('active', this.textContent === '1');
            updateBinaryDisplay();
        });
    });
    
    function updateBinaryDisplay() {
        let binaryString = '';
        let decimalValue = 0;
        
        bits.forEach((bit, index) => {
            const bitValue = bit.textContent;
            binaryString += bitValue;
            if (bitValue === '1') {
                decimalValue += Math.pow(2, 7 - index);
            }
        });
        
        binaryDisplay.textContent = binaryString;
        decimalDisplay.textContent = decimalValue;
    }
    
    // Quiz Data
    const quizQuestions = [
        // Information Theory & Binary (5 questions)
        {
            question: "Who proved that any information could be encoded using just two symbols?",
            options: ["Alan Turing", "Claude Shannon", "John von Neumann", "Charles Babbage"],
            correct: 1
        },
        {
            question: "In what year was 'A Mathematical Theory of Communication' published?",
            options: ["1937", "1948", "1969", "1991"],
            correct: 1
        },
        {
            question: "What is the fundamental unit of information in computing?",
            options: ["Byte", "Bit", "Nibble", "Word"],
            correct: 1
        },
        {
            question: "What does 'bit' stand for?",
            options: ["Basic Information Type", "Binary Digit", "Byte Information Transfer", "Binary Information Technology"],
            correct: 1
        },
        {
            question: "How many different values can one bit store?",
            options: ["1", "2", "4", "8"],
            correct: 1
        },
        
        // Binary Math (5 questions)
        {
            question: "What is 1010 in binary converted to decimal?",
            options: ["8", "10", "12", "16"],
            correct: 1
        },
        {
            question: "What is the binary representation of decimal 15?",
            options: ["1111", "1110", "1101", "1100"],
            correct: 0
        },
        {
            question: "In an 8-bit system, what is the largest decimal number you can represent?",
            options: ["128", "255", "256", "512"],
            correct: 1
        },
        {
            question: "What is 101 + 110 in binary?",
            options: ["1011", "1100", "1001", "1111"],
            correct: 0
        },
        {
            question: "How many bits are in one byte?",
            options: ["4", "6", "8", "16"],
            correct: 2
        }
    ];

    // Quiz Logic
    let currentQuestion = 0;
    let score = 0;
    let quizCompleted = false;
    
    const quizContainer = document.getElementById('quizContainer');
    const questionElement = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const nextButton = document.getElementById('nextQuestion');
    const resultContainer = document.getElementById('resultContainer');
    const progressBar = document.querySelector('.progress-fill');
    
    function startQuiz() {
        currentQuestion = 0;
        score = 0;
        quizCompleted = false;
        quizContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        displayQuestion();
    }
    
    function displayQuestion() {
        const question = quizQuestions[currentQuestion];
        questionElement.textContent = question.question;
        
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionButton = document.createElement('button');
            optionButton.className = 'option-btn';
            optionButton.textContent = option;
            optionButton.onclick = () => selectOption(index);
            optionsContainer.appendChild(optionButton);
        });
        
        nextButton.style.display = 'none';
        updateProgressBar();
    }
    
    function selectOption(selectedIndex) {
        const options = document.querySelectorAll('.option-btn');
        const question = quizQuestions[currentQuestion];
        
        options.forEach((option, index) => {
            option.disabled = true;
            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === selectedIndex && index !== question.correct) {
                option.classList.add('incorrect');
            }
        });
        
        if (selectedIndex === question.correct) {
            score++;
        }
        
        nextButton.style.display = 'block';
    }
    
    function nextQuestion() {
        currentQuestion++;
        if (currentQuestion < quizQuestions.length) {
            displayQuestion();
        } else {
            finishQuiz();
        }
    }
    
    function finishQuiz() {
        const correctCount = score;
        const totalQuestions = quizQuestions.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        
        // Save progress (progress tracking only, no rewards)
        saveProgress(percentage);
        
        // Show results
        showResults(correctCount, percentage);
    }
    
    function saveProgress(percentage) {
        const progress = {
            lesson: 'binary-fundamentals',
            completed: true,
            score: percentage,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('lesson_binary_progress', JSON.stringify(progress));
        
        // Update overall academy progress
        const overallProgress = JSON.parse(localStorage.getItem('academy_progress') || '{}');
        overallProgress['binary-fundamentals'] = progress;
        localStorage.setItem('academy_progress', JSON.stringify(overallProgress));
    }
    
    function showResults(correct, percentage) {
        quizContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        
        let grade = 'F';
        let message = 'Keep studying! You can retake this lesson.';
        
        if (percentage >= 90) {
            grade = 'A';
            message = 'Excellent! You have mastered binary fundamentals!';
        } else if (percentage >= 80) {
            grade = 'B';
            message = 'Great job! You understand the core concepts well.';
        } else if (percentage >= 70) {
            grade = 'C';
            message = 'Good work! Review the material to strengthen your understanding.';
        } else if (percentage >= 60) {
            grade = 'D';
            message = 'You\'re getting there! Practice more with binary conversions.';
        }
        
        document.getElementById('finalScore').textContent = `${correct}/${quizQuestions.length}`;
        document.getElementById('finalGrade').textContent = grade;
        document.getElementById('finalMessage').textContent = message;
        document.getElementById('lessonProgress').textContent = `${percentage}%`;
        
        // Update progress display
        updateProgressDisplay();
    }
    
    function updateProgressBar() {
        const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    function updateProgressDisplay() {
        const progress = JSON.parse(localStorage.getItem('lesson_binary_progress') || '{}');
        if (progress.score) {
            document.getElementById('lessonProgress').textContent = `${progress.score}%`;
        }
    }
    
    // Event Listeners
    document.getElementById('startQuiz').addEventListener('click', startQuiz);
    document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
    document.getElementById('retakeQuiz').addEventListener('click', startQuiz);
    
    // Initialize progress display
    updateProgressDisplay();
});
