// The Conspiracy Timeline - Interactive JavaScript
// Lesson 2: Money, Information & Scarcity

// Timeline Data
const timelineEvents = [
    {
        year: 1910,
        title: 'Jekyll Island Conspiracy',
        description: 'Six powerful men meet in secret to design the Federal Reserve',
        era: 'conspiracy'
    },
    {
        year: 1913,
        title: 'Federal Reserve Act',
        description: 'The central banking cartel becomes law',
        era: 'conspiracy'
    },
    {
        year: 1944,
        title: 'Bretton Woods',
        description: 'Dollar becomes world reserve currency, backed by gold',
        era: 'fiat'
    },
    {
        year: 1971,
        title: 'Nixon Shock',
        description: 'Gold backing removed "temporarily" - pure fiat begins',
        era: 'fiat'
    },
    {
        year: 2008,
        title: 'Financial Crisis',
        description: 'Banking system collapses, trillions printed in bailouts',
        era: 'bitcoin'
    },
    {
        year: 2009,
        title: 'Bitcoin Genesis',
        description: 'Satoshi Nakamoto releases the antidote to fiat money',
        era: 'bitcoin'
    }
];

// Philosopher Data
const philosophers = {
    griffin: {
        name: 'G. Edward Griffin',
        quote: 'The Federal Reserve is a cartel no different than OPEC, except it controls money instead of oil.',
        side: 'left'
    },
    sowell: {
        name: 'Thomas Sowell',
        quote: 'The first lesson of economics is scarcity. The first lesson of politics is to disregard the first lesson of economics.',
        side: 'right'
    },
    hayek: {
        name: 'Friedrich Hayek',
        quote: 'The curious task of economics is to demonstrate to men how little they really know about what they imagine they can design.',
        side: 'left'
    },
    mises: {
        name: 'Ludwig von Mises',
        quote: 'Government is the only institution that can take a valuable commodity like paper, and make it worthless by applying ink.',
        side: 'right'
    },
    ammous: {
        name: 'Saifedean Ammous',
        quote: 'Bitcoin is the hardest money ever invented: growth in supply is predetermined and declining.',
        side: 'left'
    }
};

// Lesson Cards Data
const lessonCards = [
    {
        type: 'hook',
        title: 'THE $30 TRILLION SECRET',
        content: 'Six men met on a secret island in 1910. What they planned controls your money TODAY. But one genius in 2008 broke their system forever...'
    },
    {
        type: 'story',
        title: 'Money as a Political Tool',
        content: 'Before the Fed, money was gold—a market good. The Fed transformed money into a tool for policy, not just trade.'
    },
    {
        type: 'scholar',
        title: 'The Cantillon Effect',
        content: 'Those closest to money creation benefit most. Banks and governments spend new money before prices rise.'
    },
    {
        type: 'hook',
        title: 'Digital Scarcity Revolution',
        content: 'Bitcoin: Only 21 million will ever exist. No politician can change this. Code, not corruption, enforces the rules.'
    },
    {
        type: 'story',
        title: 'From Gold to Fiat to Bitcoin',
        content: 'Gold: Limited by nature. Fiat: Unlimited by decree. Bitcoin: Limited by mathematics.'
    },
    {
        type: 'scholar',
        title: 'Proof-of-Work',
        content: 'Bitcoin mining requires real energy, making new coins costly to produce. This prevents inflation and ensures fairness.'
    }
];

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    initializeStardust();
    initializeTimeline();
    initializeScrollEffects();
    initializeParallax();
    renderCards();
    createStardustParticles();
});

// Initialize Stardust Counter
function initializeStardust() {
    const stardustAmount = localStorage.getItem('academyStardust') || '0';
    const stardustEl = document.getElementById('stardustAmount');
    if (stardustEl) {
        stardustEl.textContent = stardustAmount;
    }
}

// Initialize Timeline
function initializeTimeline() {
    // Observe timeline events for fade-in
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Trigger philosopher panel if within viewport
                const year = entry.target.getAttribute('data-year');
                if (year === '1910') {
                    setTimeout(function() { showPhilosopher('griffin'); }, 500);
                } else if (year === '2008') {
                    setTimeout(function() { showPhilosopher('sowell'); }, 500);
                }
            }
        });
    }, { threshold: 0.3 });
    
    document.querySelectorAll('.timeline-event').forEach(function(event) {
        observer.observe(event);
    });
}

// Scroll Effects
function initializeScrollEffects() {
    let ticking = false;
    
    function updateScrollProgress() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (window.scrollY / scrollHeight) * 100;
        
        // Update timeline line progress
        const timelineLine = document.getElementById('timelineLine');
        if (timelineLine) {
            timelineLine.classList.add('active');
            timelineLine.style.setProperty('--scroll-progress', scrollProgress + '%');
        }
        
        // Update progress indicator
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill && progressText) {
            const dashOffset = 188.5 - (188.5 * scrollProgress / 100);
            progressFill.style.strokeDashoffset = dashOffset;
            progressText.textContent = Math.round(scrollProgress) + '%';
        }
        
        // Update header on scroll
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateScrollProgress);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    updateScrollProgress(); // Initial call
}

// Parallax Effects
function initializeParallax() {
    const parallaxBg = document.getElementById('parallaxBg');
    const parallaxMid = document.getElementById('parallaxMid');
    
    if (!parallaxBg || !parallaxMid) return;
    
    // Create floating elements
    for (let i = 0; i < 20; i++) {
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.width = Math.random() * 4 + 2 + 'px';
        dot.style.height = dot.style.width;
        dot.style.background = '#ffd700';
        dot.style.borderRadius = '50%';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.top = Math.random() * 100 + '%';
        dot.style.opacity = Math.random() * 0.5 + 0.1;
        
        if (i < 10) {
            parallaxBg.appendChild(dot);
        } else {
            parallaxMid.appendChild(dot);
        }
    }
    
    // Parallax scroll
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        parallaxBg.style.transform = 'translateY(' + scrolled * 0.5 + 'px)';
        parallaxMid.style.transform = 'translateY(' + scrolled * 0.3 + 'px)';
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Reveal Secret Documents
function revealSecret(element) {
    element.classList.toggle('revealed');
    createStardustBurst(element);
}

// Show Philosopher Panels
function showPhilosopher(philosopherId) {
    const philosopher = philosophers[philosopherId];
    if (!philosopher) return;
    
    const panel = philosopher.side === 'left' ? 
        document.getElementById('philosopherLeft') : 
        document.getElementById('philosopherRight');
    
    if (!panel) return;
    
    const nameEl = panel.querySelector('.philosopher-name');
    const quoteEl = panel.querySelector('.philosopher-quote');
    
    if (nameEl) nameEl.textContent = philosopher.name;
    if (quoteEl) quoteEl.textContent = philosopher.quote;
    
    panel.classList.add('visible');
    
    // Hide after 5 seconds
    setTimeout(function() {
        panel.classList.remove('visible');
    }, 5000);
}

// Render Interactive Cards
function renderCards() {
    const cardGrid = document.getElementById('cardGrid');
    if (!cardGrid) return;
    
    lessonCards.forEach(function(card, index) {
        const cardEl = document.createElement('div');
        cardEl.className = 'concept-card';
        cardEl.style.animationDelay = (index * 0.1) + 's';
        
        let typeIcon = '📚';
        if (card.type === 'hook') typeIcon = '🎯';
        if (card.type === 'story') typeIcon = '📖';
        
        cardEl.innerHTML = 
            '<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">' +
            '<span style="font-size: 1.5rem;">' + typeIcon + '</span>' +
            '<h4 style="color: #ffd700; margin: 0;">' + card.title + '</h4>' +
            '</div>' +
            '<p style="color: #bfc2d4; line-height: 1.6;">' + card.content + '</p>';
        
        cardEl.addEventListener('click', function() {
            createStardustBurst(cardEl);
            cardEl.style.transform = 'scale(0.95)';
            setTimeout(function() {
                cardEl.style.transform = '';
            }, 200);
        });
        
        cardGrid.appendChild(cardEl);
    });
}

// Create Stardust Particles
function createStardustParticles() {
    setInterval(function() {
        if (Math.random() > 0.7) {
            createStardustParticle();
        }
    }, 2000);
}

function createStardustParticle() {
    const particle = document.createElement('div');
    particle.className = 'stardust-particle';
    particle.textContent = '✨';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.bottom = '0';
    particle.style.fontSize = Math.random() * 20 + 10 + 'px';
    
    document.body.appendChild(particle);
    
    setTimeout(function() {
        particle.remove();
    }, 3000);
}

// Create Stardust Burst Effect
function createStardustBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'stardust-particle';
        particle.textContent = '✨';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.fontSize = '20px';
        
        // Random direction
        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 50 + Math.random() * 50;
        particle.style.setProperty('--dx', Math.cos(angle) * velocity + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * velocity + 'px');
        
        document.body.appendChild(particle);
        
        setTimeout(function() {
            particle.remove();
        }, 1000);
    }
}

// Quiz Functions (simplified for timeline version)
function initializeQuiz() {
    const quizContent = document.getElementById('quizContent');
    if (!quizContent) return;
    
    quizContent.innerHTML = 
        '<div style="text-align: center; padding: 2rem;">' +
        '<h3 style="color: #ffd700; margin-bottom: 1rem;">Quiz Starting Soon!</h3>' +
        '<p style="color: #bfc2d4;">The full quiz experience is loading...</p>' +
        '<div style="margin-top: 2rem;">' +
        '<div class="stardust-particle" style="position: relative; animation: pulse 1s infinite;">✨</div>' +
        '</div>' +
        '</div>';
    
    // Add 100 stardust for attempting
    const currentStardust = parseInt(localStorage.getItem('academyStardust') || '0');
    const newTotal = currentStardust + 100;
    localStorage.setItem('academyStardust', String(newTotal));
    
    const stardustEl = document.getElementById('stardustAmount');
    if (stardustEl) {
        stardustEl.textContent = String(newTotal);
    }
    
    // Create celebration effect
    for (let i = 0; i < 20; i++) {
        setTimeout(function() {
            createStardustParticle();
        }, i * 100);
    }
}

// Smooth Scroll for Navigation
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Global function exports
window.revealSecret = revealSecret;
window.showPhilosopher = showPhilosopher;
window.initializeQuiz = initializeQuiz;
