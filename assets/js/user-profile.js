// User Profile Frontend Logic
// Assumes window.userManager is available (backend logic)

// Initialize variables at the top level
let sessionId = null;
let currentUserId = null;
let selectedAvatar = '';
let currentCategory = 'all';
let avatarSearchTerm = '';

// DOM Elements
const authSection = document.getElementById('auth-section');
const profileSection = document.getElementById('profile-section');
const emailLoginForm = document.getElementById('emailLoginForm');
const profileForm = document.getElementById('profileForm');
const displayNameInput = document.getElementById('displayName');
const avatarGrid = document.getElementById('avatarGrid');
const photoUpload = document.getElementById('photoUpload');
const bioInput = document.getElementById('bio');
const avatarPreview = document.getElementById('avatarPreview');
const logoutBtn = document.getElementById('logoutBtn');
const profileStatus = document.getElementById('profileStatus');
const profileFormStatus = document.getElementById('profileFormStatus');
const emailInput = document.getElementById('emailInput');
const walletAddressSpan = document.getElementById('walletAddress');
const walletBalanceSpan = document.getElementById('walletBalance');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const avatarModal = document.getElementById('avatarModal');
const closeAvatarModal = document.getElementById('closeAvatarModal');
const avatarSearch = document.getElementById('avatarSearch');
const categoryBtns = document.querySelectorAll('.category-btn');

// Popular email domains for autocomplete
const popularDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'aol.com', 'protonmail.com', 'mail.com', 'live.com', 'msn.com',
    'yandex.com', 'zoho.com', 'gmx.com', 'fastmail.com', 'tutanota.com',
    'hushmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com', 'tempmail.org'
];

// Comprehensive avatar collection with categories
const avatarCategories = {
    gaming: [
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer1&backgroundColor=ff1493',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer2&backgroundColor=00ff88',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer3&backgroundColor=0088ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer4&backgroundColor=ff0088',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer5&backgroundColor=8800ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer6&backgroundColor=00ffff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer7&backgroundColor=ffff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer8&backgroundColor=ff8800',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer9&backgroundColor=88ff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer10&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer11&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer12&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer13&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer14&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer15&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer16&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer17&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer18&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer19&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer20&backgroundColor=ff8000'
    ],
    crypto: [
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto1&backgroundColor=ff1493',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto2&backgroundColor=00ff88',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto3&backgroundColor=0088ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto4&backgroundColor=ff0088',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto5&backgroundColor=8800ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto6&backgroundColor=00ffff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto7&backgroundColor=ffff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto8&backgroundColor=ff8800',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto9&backgroundColor=88ff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto10&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto11&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto12&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto13&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto14&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto15&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto16&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto17&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto18&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto19&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=crypto20&backgroundColor=ff8000'
    ],
    anime: [
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime1&backgroundColor=ff1493',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime2&backgroundColor=00ff88',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime3&backgroundColor=0088ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime4&backgroundColor=ff0088',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime5&backgroundColor=8800ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime6&backgroundColor=00ffff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime7&backgroundColor=ffff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime8&backgroundColor=ff8800',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime9&backgroundColor=88ff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime10&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime11&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime12&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime13&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime14&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime15&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime16&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime17&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime18&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime19&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=anime20&backgroundColor=ff8000'
    ],
    abstract: [
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract1&backgroundColor=ff1493',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract2&backgroundColor=00ff88',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract3&backgroundColor=0088ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract4&backgroundColor=ff0088',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract5&backgroundColor=8800ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract6&backgroundColor=00ffff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract7&backgroundColor=ffff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract8&backgroundColor=ff8800',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract9&backgroundColor=88ff00',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract10&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract11&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract12&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract13&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract14&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract15&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract16&backgroundColor=ff8000',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract17&backgroundColor=00ff80',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract18&backgroundColor=ff0080',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract19&backgroundColor=8000ff',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=abstract20&backgroundColor=ff8000'
    ]
};

// Flatten all avatars for "all" category
const allAvatars = Object.values(avatarCategories).flat();

// Initialize after all variables are declared
function initializePage() {
    // Check if we're on the user profile page
    if (!authSection || !profileSection) {
        console.log('Not on user profile page, skipping initialization');
        // Exit gracefully if not on the right page
        if (typeof window !== 'undefined') {
            // Still initialize email autocomplete if email input exists
            if (emailInput) {
                setupEmailAutocomplete();
            }
        }
    } else {
        // Only initialize if we're on the user profile page
        initializeUserProfile();
    }
}

function showStatus(msg, isError = false, duration = 3000) {
    if (profileStatus) {
        profileStatus.textContent = msg;
        profileStatus.className = `status-message show ${isError ? 'error' : 'success'}`;
        
        // Auto-hide after duration
        setTimeout(() => {
            profileStatus.classList.remove('show');
        }, duration);
    }
}

function showFormStatus(msg, type = 'info', duration = 3000) {
    if (profileFormStatus) {
        profileFormStatus.textContent = msg;
        profileFormStatus.className = `form-status-message show ${type}`;
        
        // Auto-hide after duration
        setTimeout(() => {
            profileFormStatus.classList.remove('show');
        }, duration);
    }
}

function setupAvatarModal() {
    if (!changeAvatarBtn || !avatarModal || !closeAvatarModal) return;
    
    // Open modal
    changeAvatarBtn.addEventListener('click', () => {
        avatarModal.style.display = 'flex';
        renderAvatarGrid();
    });
    
    // Close modal
    closeAvatarModal.addEventListener('click', () => {
        avatarModal.style.display = 'none';
    });
    
    // Close on outside click
    avatarModal.addEventListener('click', (e) => {
        if (e.target === avatarModal) {
            avatarModal.style.display = 'none';
        }
    });
    
    // Category buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderAvatarGrid();
        });
    });
    
    // Search functionality
    if (avatarSearch) {
        avatarSearch.addEventListener('input', (e) => {
            avatarSearchTerm = e.target.value.toLowerCase();
            renderAvatarGrid();
        });
    }
}

function renderAvatarGrid() {
    if (!avatarGrid) return;
    
    let avatarsToShow = currentCategory === 'all' ? allAvatars : avatarCategories[currentCategory] || [];
    
    // Filter by search term
    if (avatarSearchTerm) {
        avatarsToShow = avatarsToShow.filter(avatar => 
            avatar.includes(avatarSearchTerm) || 
            currentCategory.includes(avatarSearchTerm)
        );
    }
    
    avatarGrid.innerHTML = '';
    
    avatarsToShow.forEach((avatar, index) => {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar-option';
        if (selectedAvatar === avatar) {
            avatarDiv.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = avatar;
        img.alt = `Avatar ${index + 1}`;
        
        avatarDiv.appendChild(img);
        
        avatarDiv.addEventListener('click', () => {
            // Remove selection from all avatars
            document.querySelectorAll('.avatar-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select this avatar
            avatarDiv.classList.add('selected');
            selectedAvatar = avatar;
            
            // Update preview
            if (avatarPreview) {
                avatarPreview.src = avatar;
            }
            
            // Close modal after selection
            setTimeout(() => {
                avatarModal.style.display = 'none';
            }, 500);
        });
        
        avatarGrid.appendChild(avatarDiv);
    });
}

function setupPhotoUpload() {
    if (!photoUpload) return;
    
    photoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showStatus('Please select an image file.', true);
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showStatus('Image must be smaller than 5MB.', true);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                selectedAvatar = event.target.result;
                if (avatarPreview) {
                    avatarPreview.src = selectedAvatar;
                }
                
                // Clear avatar selection
                document.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                showStatus('Photo uploaded successfully!');
                
                // Close modal if open
                if (avatarModal) {
                    avatarModal.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

function showProfileSection(profile, user = null) {
    if (!authSection || !profileSection) return;
    
    authSection.style.display = 'none';
    profileSection.style.display = 'block';
    
    // Update profile info
    if (profileName) {
        profileName.textContent = profile.displayName || 'Welcome!';
    }
    
    if (profileEmail) {
        profileEmail.textContent = user ? user.email : '';
    }
    
    if (displayNameInput) {
        displayNameInput.value = profile.displayName || '';
    }
    
    if (bioInput) {
        bioInput.value = profile.bio || '';
    }
    
    // Show wallet information if available
    if (user && user.wallet && walletAddressSpan && walletBalanceSpan) {
        const shortWallet = user.wallet.slice(0, 6) + '...' + user.wallet.slice(-4);
        walletAddressSpan.textContent = shortWallet;
        walletBalanceSpan.textContent = `${user.walletBalance || 0} USDC.E`;
    } else if (walletAddressSpan && walletBalanceSpan) {
        // Clear wallet info if not available
        walletAddressSpan.textContent = 'Not connected';
        walletBalanceSpan.textContent = '0 USDC.E';
    }
    
    // Set avatar
    if (profile.avatar) {
        selectedAvatar = profile.avatar;
        if (avatarPreview) {
            avatarPreview.src = profile.avatar;
        }
    } else {
        // Set default avatar
        selectedAvatar = allAvatars[0];
        if (avatarPreview) {
            avatarPreview.src = selectedAvatar;
        }
    }
}

function showAuthSection() {
    if (!authSection || !profileSection) return;
    
    authSection.style.display = 'block';
    profileSection.style.display = 'none';
}

async function loadProfile() {
    // Wait for UserManager to be available
    if (!window.userManager) {
        console.log('Waiting for UserManager to load...');
        setTimeout(loadProfile, 100);
        return;
    }
    
    // Get sessionId from localStorage
    const storedSessionId = localStorage.getItem('sessionId');
    
    if (!storedSessionId) {
        showAuthSection();
        return;
    }
    
    try {
        currentUserId = window.userManager.getCurrentUser(storedSessionId);
        if (!currentUserId) {
            showAuthSection();
            return;
        }
        
        // Get full user data to show wallet info
        const user = window.userManager.users.get(currentUserId);
        if (!user) {
            showStatus('User not found.');
            showAuthSection();
            return;
        }
        
        // Update sessionId only after successful validation
        sessionId = storedSessionId;
        
        showProfileSection(user.profile, user);
        showStatus('Logged in.');
    } catch (e) {
        console.error('Failed to load profile:', e);
        showStatus('Failed to load profile.', true);
        showAuthSection();
    }
}

function initializeUserProfile() {
    // Email login (auto-creates wallet)
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!emailInput) return;
            
            const email = emailInput.value.trim();
            if (!email) return;
            
            if (!window.userManager) {
                showStatus('User manager not loaded. Please refresh the page.', true);
                return;
            }
            
            try {
                showStatus('Creating your account and wallet...');
                
                // Login will auto-register if user doesn't exist
                const result = await window.userManager.login({ email });
                
                // Update session variables
                sessionId = result.sessionId;
                currentUserId = result.user.id;
                localStorage.setItem('sessionId', sessionId);
                
                // Show wallet info to user
                if (result.user && result.user.wallet) {
                    const walletAddress = result.user.wallet;
                    const shortWallet = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
                    
                    showProfileSection(result.user.profile, result.user);
                    showStatus(`Welcome! Your wallet: ${shortWallet}`);
                    
                    // Show wallet info in console for debugging
                    console.log(`🎉 User logged in: ${email}`);
                    console.log(`💰 Wallet created: ${walletAddress}`);
                    console.log(`💎 Balance: ${result.user.walletBalance} USDC.E`);
                } else {
                    showProfileSection(result.user.profile, result.user);
                    showStatus('Welcome! Wallet creation in progress...');
                    console.log(`🎉 User logged in: ${email}`);
                }
                
            } catch (err) {
                console.error('Login failed:', err);
                showStatus('Login failed: ' + err.message, true);
            }
        });
    }

    // Profile form submit
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUserId) return;
            
            if (!window.userManager) {
                showFormStatus('User manager not loaded. Please refresh the page.', 'error');
                return;
            }
            
            const profileUpdates = {
                displayName: displayNameInput ? displayNameInput.value.trim() : '',
                avatar: selectedAvatar,
                bio: bioInput ? bioInput.value.trim() : ''
            };
            try {
                await window.userManager.updateProfile(currentUserId, profileUpdates);
                showFormStatus('Profile updated successfully!', 'success');
                
                // Update profile name display
                if (profileName) {
                    profileName.textContent = profileUpdates.displayName || 'Welcome!';
                }
            } catch (err) {
                showFormStatus('Failed to update profile: ' + err.message, 'error');
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (sessionId && window.userManager) {
                window.userManager.logout(sessionId);
                localStorage.removeItem('sessionId');
                sessionId = null;
                currentUserId = null;
                showAuthSection();
                showStatus('Logged out.');
            }
        });
    }

    // Initialize everything
    setupEmailAutocomplete();
    setupAvatarModal();
    setupPhotoUpload();

    // On load - wait a bit for UserManager to initialize
    setTimeout(loadProfile, 100);
}

// Email autocomplete functionality
function setupEmailAutocomplete() {
    if (!emailInput) return;
    
    let autocompleteList = null;
    
    emailInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const atIndex = value.indexOf('@');
        
        if (atIndex !== -1) {
            const domain = value.substring(atIndex + 1);
            const suggestions = popularDomains.filter(d => d.startsWith(domain));
            
            if (suggestions.length > 0 && domain.length > 0) {
                showAutocompleteSuggestions(suggestions, atIndex);
            } else {
                hideAutocompleteSuggestions();
            }
        } else {
            hideAutocompleteSuggestions();
        }
    });
    
    emailInput.addEventListener('blur', function() {
        // Delay hiding to allow clicking on suggestions
        setTimeout(hideAutocompleteSuggestions, 200);
    });
    
    function showAutocompleteSuggestions(suggestions, atIndex) {
        hideAutocompleteSuggestions();
        
        const inputRect = emailInput.getBoundingClientRect();
        autocompleteList = document.createElement('div');
        autocompleteList.className = 'autocomplete-list';
        autocompleteList.style.cssText = `
            position: absolute;
            top: ${inputRect.bottom + 5}px;
            left: ${inputRect.left}px;
            width: ${inputRect.width}px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #333;
                color: #fff;
                font-size: 14px;
            `;
            item.textContent = suggestion;
            
            item.addEventListener('mouseenter', function() {
                this.style.background = '#333';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });
            
            item.addEventListener('click', function() {
                const currentValue = emailInput.value;
                const beforeAt = currentValue.substring(0, atIndex + 1);
                emailInput.value = beforeAt + suggestion;
                hideAutocompleteSuggestions();
                emailInput.focus();
            });
            
            autocompleteList.appendChild(item);
        });
        
        document.body.appendChild(autocompleteList);
    }
    
    function hideAutocompleteSuggestions() {
        if (autocompleteList) {
            autocompleteList.remove();
            autocompleteList = null;
        }
    }
}

// Initialize the page after all variables and functions are declared
initializePage(); 