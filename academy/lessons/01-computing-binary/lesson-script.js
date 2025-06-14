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
            question: "How many possible values can a single bit represent?",
            options: ["1", "2", "8", "256"],
            correct: 1
        },
        {
            question: "Binary representation is also known as:",
            options: ["Base-10", "Base-16", "Base-2", "Base-8"],
            correct: 2
        },
        
        // Historical Development (5 questions)
        {
            question: "Who developed the modern binary number system in 1679?",
            options: ["Isaac Newton", "Gottfried Leibniz", "Blaise Pascal", "René Descartes"],
            correct: 1
        },
        {
            question: "George Boole's contribution to computing was:",
            options: ["The first computer", "Boolean algebra", "The transistor", "The internet"],
            correct: 1
        },
        {
            question: "Alan Turing conceptualized the universal computing machine in:",
            options: ["1927", "1937", "1947", "1957"],
            correct: 1
        },
        {
            question: "The Bitcoin Genesis Block was mined in:",
            options: ["2007", "2008", "2009", "2010"],
            correct: 2
        },
        {
            question: "What did Turing prove about computation?",
            options: [
                "Computers would replace humans",
                "What is theoretically computable",
                "Binary is superior to decimal",
                "Quantum computing is possible"
            ],
            correct: 1
        },
        
        // Digital Scarcity & Economics (5 questions)
        {
            question: "According to Carl Menger, value comes from all of these EXCEPT:",
            options: ["Utility", "Labor costs", "Scarcity", "Human action"],
            correct: 1
        },
        {
            question: "Which type of digital scarcity uses mathematical proofs?",
            options: ["Artificial scarcity", "Practical scarcity", "Cryptographic scarcity", "Legal scarcity"],
            correct: 2
        },
        {
            question: "The paradox of digital abundance refers to:",
            options: [
                "Too much storage space",
                "Perfect copying at near-zero cost",
                "High internet speeds",
                "Expensive computers"
            ],
            correct: 1
        },
        {
            question: "Digital scarcity is important for economics because it:",
            options: [
                "Makes computers expensive",
                "Enables digital assets to have value",
                "Prevents internet access",
                "Increases government control"
            ],
            correct: 1
        },
        {
            question: "The formula for digital value includes all EXCEPT:",
            options: ["Utility", "Scarcity", "Network Effect", "Government backing"],
            correct: 3
        },
        
        // Technical Applications (5 questions)
        {
            question: "How many bits are in a byte?",
            options: ["2", "4", "8", "16"],
            correct: 2
        },
        {
            question: "The binary number 11111111 equals what in decimal?",
            options: ["127", "255", "256", "1024"],
            correct: 1
        },
        {
            question: "Hash functions transform inputs into:",
            options: [
                "Variable-size outputs",
                "Fixed-size outputs",
                "Encrypted messages",
                "Random numbers"
            ],
            correct: 1
        },
        {
            question: "Digital signatures prove:",
            options: [
                "Government identity",
                "Mathematical identity without revealing private keys",
                "Physical location",
                "Internet speed"
            ],
            correct: 1
        },
        {
            question: "Smart contracts use binary logic to create:",
            options: [
                "Legal documents",
                "Government regulations",
                "Self-executing agreements",
                "Paper contracts"
            ],
            correct: 2
        }
    ];
    
    // Quiz State
    let currentQuestionIndex = 0;
    let selectedAnswers = new Array(quizQuestions.length).fill(null);
    let quizCompleted = false;
    
    // Quiz Elements
    const questionContainer = document.getElementById('questionContainer');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const correctAnswersSpan = document.getElementById('correctAnswers');
    const progressFill = document.getElementById('progressFill');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');
    const resultsContainer = document.getElementById('resultsContainer');
    const quizSection = document.getElementById('quizSection');
    
    // Initialize Quiz
    displayQuestion();
    
    // Event Listeners
    prevButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });
    
    nextButton.addEventListener('click', () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });
    
    submitButton.addEventListener('click', submitQuiz);
    
    document.getElementById('retryButton').addEventListener('click', () => {
        resetQuiz();
    });
    
    function displayQuestion() {
        const question = quizQuestions[currentQuestionIndex];
        
        questionContainer.innerHTML = `
            <h3 class="question-text">${question.question}</h3>
            <div class="answer-options">
                ${question.options.map((option, index) => `
                    <button class="answer-option ${selectedAnswers[currentQuestionIndex] === index ? 'selected' : ''}" 
                            data-index="${index}">
                        ${String.fromCharCode(65 + index)}) ${option}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Add click handlers to answer options
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', function() {
                if (!quizCompleted) {
                    selectAnswer(parseInt(this.dataset.index));
                }
            });
        });
        
        updateProgress();
        updateNavigationButtons();
    }
    
    function selectAnswer(index) {
        selectedAnswers[currentQuestionIndex] = index;
        displayQuestion();
        updateCorrectCount();
    }
    
    function updateProgress() {
        currentQuestionSpan.textContent = currentQuestionIndex + 1;
        progressFill.style.width = `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;
    }
    
    function updateCorrectCount() {
        let correct = 0;
        selectedAnswers.forEach((answer, index) => {
            if (answer !== null && answer === quizQuestions[index].correct) {
                correct++;
            }
        });
        correctAnswersSpan.textContent = correct;
    }
    
    function updateNavigationButtons() {
        prevButton.disabled = currentQuestionIndex === 0;
        nextButton.style.display = currentQuestionIndex === quizQuestions.length - 1 ? 'none' : 'block';
        submitButton.style.display = currentQuestionIndex === quizQuestions.length - 1 ? 'block' : 'none';
    }
    
    function submitQuiz() {
        quizCompleted = true;
        const correctCount = calculateScore();
        const stardustEarned = calculateStardust(correctCount);
        
        // Save progress to localStorage
        saveProgress(stardustEarned);
        
        // Show results
        showResults(correctCount, stardustEarned);
    }
    
    function calculateScore() {
        let correct = 0;
        selectedAnswers.forEach((answer, index) => {
            if (answer === quizQuestions[index].correct) {
                correct++;
            }
        });
        return correct;
    }
    
    function calculateStardust(correct) {
        // Stardust distribution based on performance
        if (correct >= 18) return 200;  // Mastery
        if (correct >= 15) return 160;  // Proficient
        if (correct >= 12) return 120;  // Developing
        if (correct >= 9) return 80;    // Beginning
        return 40;                       // Needs review
    }
    
    function saveProgress(stardust) {
        // Save to localStorage for persistence
        const progress = {
            lesson: 1,
            completed: true,
            stardust: stardust,
            date: new Date().toISOString()
        };
        
        localStorage.setItem('academy_lesson_1', JSON.stringify(progress));
        
        // Update total stardust
        const currentTotal = parseInt(localStorage.getItem('academy_total_stardust') || '0');
        localStorage.setItem('academy_total_stardust', currentTotal + stardust);
    }
    
    function showResults(correct, stardust) {
        const percentage = (correct / quizQuestions.length) * 100;
        let message = '';
        
        if (percentage >= 90) {
            message = 'Outstanding! You\'ve mastered binary fundamentals. Ready for the monetary revolution?';
        } else if (percentage >= 75) {
            message = 'Great work! You have a solid understanding of digital foundations.';
        } else if (percentage >= 60) {
            message = 'Good effort! Review the material to strengthen your understanding.';
        } else {
            message = 'Keep learning! Binary concepts are crucial for understanding digital economics.';
        }
        
        document.getElementById('finalScore').textContent = stardust;
        document.getElementById('resultMessage').textContent = message;
        document.getElementById('lessonStardust').textContent = stardust;
        
        questionContainer.style.display = 'none';
        document.querySelector('.quiz-progress').style.display = 'none';
        document.querySelector('.quiz-navigation').style.display = 'none';
        resultsContainer.style.display = 'block';
        
        // Animate stardust counter
        animateStardustCounter(stardust);
    }
    
    function animateStardustCounter(target) {
        const counter = document.getElementById('lessonStardust');
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current);
        }, duration / steps);
    }
    
    function resetQuiz() {
        currentQuestionIndex = 0;
        selectedAnswers = new Array(quizQuestions.length).fill(null);
        quizCompleted = false;
        
        questionContainer.style.display = 'block';
        document.querySelector('.quiz-progress').style.display = 'flex';
        document.querySelector('.quiz-navigation').style.display = 'flex';
        resultsContainer.style.display = 'none';
        
        displayQuestion();
        updateCorrectCount();
    }
    
    // Check if returning user
    const savedProgress = localStorage.getItem('academy_lesson_1');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        document.getElementById('lessonStardust').textContent = progress.stardust;
    }
});

// === BINARY/DECIMAL CONVERTER LOGIC ===
(function() {
    const decInputs = [
        document.getElementById('dec-0'),
        document.getElementById('dec-1'),
        document.getElementById('dec-2'),
        document.getElementById('dec-3')
    ];
    const decimalInputRow = document.getElementById('decimalInputRow');
    const bitBtns = Array.from(document.querySelectorAll('.bit-btn'));
    const dotCanvas = document.getElementById('dotCanvas');
    const ctx = dotCanvas.getContext('2d');
    const MAX_BINARY = 8191; // 13 bits
    const MAX_DECIMAL = 9999; // 4 digits

    // Helper: Get decimal value from inputs
    function getDecimalValue() {
        return parseInt(decInputs.map(inp => inp.value || '0').join(''), 10) || 0;
    }
    // Helper: Set decimal inputs from value
    function setDecimalInputs(val) {
        let str = val.toString().padStart(4, '0');
        for (let i = 0; i < 4; i++) decInputs[i].value = str[i];
    }
    // Helper: Get binary value from buttons
    function getBinaryValue() {
        return parseInt(bitBtns.map(btn => btn.textContent).join(''), 2);
    }
    // Helper: Set binary buttons from value
    function setBinaryBtns(val) {
        let bin = val.toString(2).padStart(13, '0');
        bitBtns.forEach((btn, i) => {
            btn.textContent = bin[i];
            btn.classList.toggle('active', bin[i] === '1');
        });
    }
    // Helper: Show error on binary if overflow
    function showBinaryError() {
        bitBtns.forEach(btn => {
            btn.textContent = 'E';
            btn.classList.add('error');
        });
    }
    function clearBinaryError() {
        bitBtns.forEach(btn => btn.classList.remove('error'));
    }
    // Decimal input handler
    function onDecimalInput(e) {
        let val = getDecimalValue();
        if (val > MAX_BINARY) {
            showBinaryError();
        } else {
            clearBinaryError();
            setBinaryBtns(val);
        }
        renderDots(val);
        updateDotInfoSentence(val);
    }
    // Binary button handler
    function onBinaryBtnClick(e) {
        if (bitBtns[0].textContent === 'E') return; // ignore if error
        let idx = bitBtns.indexOf(e.target);
        let current = e.target.textContent;
        e.target.textContent = current === '0' ? '1' : '0';
        e.target.classList.toggle('active', e.target.textContent === '1');
        let val = getBinaryValue();
        setDecimalInputs(val);
        renderDots(val);
        updateDotInfoSentence(val);
    }
    // Attach events
    decInputs.forEach((inp, idx) => {
        inp.addEventListener('focus', function() {
            // Remove only if not already zero
            if (this.value === '0') this.select();
        });
        inp.addEventListener('blur', function() {
            if (!this.value || this.value.length === 0) {
                this.value = '0';
                onDecimalInput();
            }
        });
        inp.addEventListener('input', function(e) {
            // Only allow 0-9
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 0) {
                this.value = '0';
            }
            // Special logic for ones box (last input): always replace with last key pressed
            if (idx === 3 && this.value.length > 1) {
                this.value = this.value.slice(-1);
            }
            if (this.value.length === 1 && idx < decInputs.length - 1) {
                decInputs[idx + 1].focus();
            }
            onDecimalInput(e);
        });
    });
    // Enhanced: On keydown, always replace with pressed digit and advance focus (except last box)
    decInputs.forEach((inp, idx) => {
        inp.addEventListener('keydown', function(e) {
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                this.value = e.key;
                onDecimalInput();
                // Advance to next input if not last
                if (idx < decInputs.length - 1) {
                    decInputs[idx + 1].focus();
                }
            }
        });
    });
    bitBtns.forEach(btn => btn.addEventListener('click', onBinaryBtnClick));
    // Click-to-focus logic for decimal input row
    decimalInputRow.addEventListener('click', function(e) {
        if (e.target.classList.contains('decimal-digit')) return;
        // Focus first empty, else leftmost
        let firstEmpty = decInputs.find(inp => !inp.value);
        (firstEmpty || decInputs[0]).focus();
    });
    // Initial state
    setDecimalInputs(0);
    setBinaryBtns(0);
    renderDots(0);
    updateDotInfoSentence(0);
    // --- Clean Oval Dot Visualization ---
    // Large, centered ellipse nearly filling the canvas
    const w = dotCanvas.width, h = dotCanvas.height;
    const marginX = 18, marginY = 18; // smaller margins for more fill
    const cx = w / 2, cy = h / 2;
    const baseRadiusX = (w / 2) - marginX;
    const baseRadiusY = (h / 2) - marginY;
    function pointInOval(x, y) {
        // Standard ellipse equation: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 <= 1
        return (
            Math.pow((x - cx) / baseRadiusX, 2) +
            Math.pow((y - cy) / baseRadiusY, 2)
        ) <= 1;
    }
    // Use pointInOval in dot placement
    function renderDots(val) {
        ctx.clearRect(0, 0, dotCanvas.width, dotCanvas.height);
        if (!val) return;
        let maxDots = Math.min(val, 9999);
        // Estimate area of oval
        let organicArea = Math.PI * baseRadiusX * baseRadiusY * 0.85;
        let minDot = 0.6, maxDot = 8; // Halved dot sizes
        let dotSize = Math.max(minDot, Math.min(maxDot, Math.sqrt(organicArea / maxDots)));
        let dotsDrawn = 0, tries = 0, maxTries = maxDots * 20;
        const placed = [];
        // Only try points within oval's bounding box
        const minX = cx - baseRadiusX, maxX = cx + baseRadiusX;
        const minY = cy - baseRadiusY, maxY = cy + baseRadiusY;
        while (dotsDrawn < maxDots && tries < maxTries) {
            let x = minX + Math.random() * (maxX - minX);
            let y = minY + Math.random() * (maxY - minY);
            if (!pointInOval(x, y)) { tries++; continue; }
            let ok = true;
            for (let i = 0; i < placed.length; i++) {
                let dx = placed[i].x - x, dy = placed[i].y - y;
                if (dx*dx + dy*dy < dotSize*dotSize*1.1) { ok = false; break; }
            }
            if (!ok) { tries++; continue; }
            ctx.beginPath();
            ctx.arc(x, y, dotSize / 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fill();
            placed.push({x, y});
            dotsDrawn++;
            tries++;
        }
    }
    // --- Dot Info Sentence Update ---
    function updateDotInfoSentence(val) {
        const infoDiv = document.getElementById('dotInfoSentence');
        let binary = val.toString(2);
        let decimal = val.toString(10);
        let dotWord = (val === 1) ? 'dot' : 'dots';
        if (val === 0) {
            infoDiv.innerHTML = '';
            return;
        }
        infoDiv.innerHTML = `This is both <span class="binary">${binary}</span> <span class="binary-label">(binary)</span> or <span class="decimal">${decimal}</span> (decimal) ${dotWord}`;
    }
})();