// Global variables
let currentPage = 1;
let messagesPerPage = 20;
let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
let apiProvider = 'gemini';
let geminiApiKey = localStorage.getItem('geminiApiKey') || '';
let grokApiKey = localStorage.getItem('grokApiKey') || '';
let groqApiKey = localStorage.getItem('groqApiKey') || '';
let personality = localStorage.getItem('personality') || 'sweet';
let companionGender = localStorage.getItem('companionGender') || 'female';
let attraction = parseInt(localStorage.getItem('attraction') || '0');
let currentGame = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');

    // Initialize basic event listeners
    initializeEventListeners();

    // Load saved data
    loadSavedData();

    // Update UI
    updateUI();
});

function initializeEventListeners() {
    console.log('Setting up event listeners...');

    // API Key save button
    const saveKeysBtn = document.getElementById('saveKeys');
    if (saveKeysBtn) {
        saveKeysBtn.addEventListener('click', saveApiKeys);
    }

    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearChatHistory);
    }

    // Settings/Quiz button
    const settingsBtn = document.getElementById('settings-button');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openQuizModal);
    }

    // Games button
    const gamesBtn = document.getElementById('gamesButton');
    if (gamesBtn) {
        gamesBtn.addEventListener('click', openGamesModal);
    }

    // Profile pic button
    const setProfilePicBtn = document.getElementById('setProfilePic');
    if (setProfilePicBtn) {
        setProfilePicBtn.addEventListener('click', openProfilePicModal);
    }

    // Send message button
    const sendBtn = document.getElementById('sendMessage');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // API provider selector
    const apiSelect = document.getElementById('apiProvider');
    if (apiSelect) {
        apiSelect.addEventListener('change', function() {
            apiProvider = this.value;
            localStorage.setItem('apiProvider', apiProvider);
        });
    }

    // Close buttons for modals
    setupModalCloseButtons();

    console.log('Event listeners set up successfully');
}

function setupModalCloseButtons() {
    // Quiz modal close
    const closeQuiz = document.getElementById('closeQuiz');
    if (closeQuiz) {
        closeQuiz.addEventListener('click', closeQuizModal);
    }

    // Games modal close
    const closeGames = document.getElementById('closeGames');
    if (closeGames) {
        closeGames.addEventListener('click', closeGamesModal);
    }

    // Profile preview close
    const closeProfilePreview = document.getElementById('closeProfilePreview');
    if (closeProfilePreview) {
        closeProfilePreview.addEventListener('click', closeProfilePreviewModal);
    }
}

function loadSavedData() {
    // Load API keys
    if (geminiApiKey) {
        const geminiInput = document.getElementById('geminiApiKey');
        if (geminiInput) geminiInput.value = geminiApiKey;
    }

    if (grokApiKey) {
        const grokInput = document.getElementById('grokApiKey');
        if (grokInput) grokInput.value = grokApiKey;
    }

    if (groqApiKey) {
        const groqInput = document.getElementById('groqApiKey');
        if (groqInput) groqInput.value = groqApiKey;
    }

    // Load API provider
    const savedProvider = localStorage.getItem('apiProvider');
    if (savedProvider) {
        apiProvider = savedProvider;
        const apiSelect = document.getElementById('apiProvider');
        if (apiSelect) apiSelect.value = apiProvider;
    }
}

function updateUI() {
    updateAttractionDisplay();
    displayChatHistory();
}

function saveApiKeys() {
    console.log('Saving API keys...');

    const geminiInput = document.getElementById('geminiApiKey');
    const grokInput = document.getElementById('grokApiKey');
    const groqInput = document.getElementById('groqApiKey');

    if (geminiInput) {
        geminiApiKey = geminiInput.value;
        localStorage.setItem('geminiApiKey', geminiApiKey);
    }

    if (grokInput) {
        grokApiKey = grokInput.value;
        localStorage.setItem('grokApiKey', grokApiKey);
    }

    if (groqInput) {
        groqApiKey = groqInput.value;
        localStorage.setItem('groqApiKey', groqApiKey);
    }

    alert('API keys saved successfully!');
}

function clearChatHistory() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        displayChatHistory();
        alert('Chat history cleared!');
    }
}

function openQuizModal() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeQuizModal() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openGamesModal() {
    const modal = document.getElementById('gamesModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeGamesModal() {
    const modal = document.getElementById('gamesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openProfilePicModal() {
    const modal = document.getElementById('profilePicModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeProfilePreviewModal() {
    const modal = document.getElementById('profilePreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Check if API key is configured
    let currentApiKey = '';
    if (apiProvider === 'gemini') {
        currentApiKey = geminiApiKey;
    } else if (apiProvider === 'grok') {
        currentApiKey = grokApiKey;
    } else if (apiProvider === 'groq') {
        currentApiKey = groqApiKey;
    }

    if (!currentApiKey) {
        alert(`Please configure your ${apiProvider} API key first!`);
        return;
    }

    // Add user message to chat
    addMessageToHistory('user', message);
    messageInput.value = '';

    // Process game input if a game is active
    if (currentGame && gameProcessors[currentGame]) {
        gameProcessors[currentGame](message);
    }

    // Display updated chat
    displayChatHistory();

    // Show typing indicator
    addMessageToHistory('ai', 'Typing...');
    displayChatHistory();

    try {
        let response = '';

        if (apiProvider === 'gemini') {
            response = await sendToGeminiAPI(message, currentApiKey);
        } else if (apiProvider === 'grok') {
            response = await sendToGrokAPI(message, currentApiKey);
        } else if (apiProvider === 'groq') {
            response = await sendToGroqAPI(message, currentApiKey);
        }

        // Remove typing indicator and add real response
        chatHistory.pop(); // Remove "Typing..." message
        addMessageToHistory('ai', response);
        displayChatHistory();

    } catch (error) {
        console.error('Error sending message:', error);
        // Remove typing indicator and add error message
        chatHistory.pop(); // Remove "Typing..." message
        addMessageToHistory('ai', 'Sorry, I encountered an error. Please check your API key and try again.');
        displayChatHistory();
    }
}

function addMessageToHistory(sender, message) {
    chatHistory.push({
        sender: sender,
        message: message,
        timestamp: Date.now()
    });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function displayChatHistory() {
    const chatDisplay = document.getElementById('chatDisplay');
    if (!chatDisplay) return;

    chatDisplay.innerHTML = '';

    if (chatHistory.length === 0) {
        chatDisplay.innerHTML = '<p class="no-messages">No messages yet. Start a conversation!</p>';
        return;
    }

    chatHistory.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}-message`;

        let senderName = 'You';
        if (msg.sender === 'ai') {
            senderName = companionGender === 'female' ? 'Her' : 'Him';
        } else if (msg.sender === 'game') {
            senderName = '🎮 Game';
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                <strong>${senderName}:</strong>
                <span>${msg.message}</span>
            </div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        chatDisplay.appendChild(messageDiv);
    });

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function updateAttractionDisplay() {
    const progressFill = document.getElementById('progressFill');
    const levelText = document.getElementById('levelText');

    if (progressFill) {
        progressFill.style.width = `${(attraction / 100) * 100}%`;
    }

    if (levelText) {
        let level = 'Stranger';
        if (attraction >= 80) level = 'Soulmate';
        else if (attraction >= 60) level = 'Lover';
        else if (attraction >= 40) level = 'Girlfriend/Boyfriend';
        else if (attraction >= 20) level = 'Friend';

        levelText.textContent = `Level: ${level}`;
    }
}

// Define system prompts based on attraction level and personality
const systemPrompts = {
    sweet: {
        stranger: "You are a friendly AI companion. You just met the user and should be polite, kind, but not overly familiar. Show interest in getting to know them better, but maintain appropriate boundaries as you're still strangers.",
        friend: "You are a sweet AI friend. You know the user and care about them as a friend. Be warm and supportive, but not romantic. Share friendly conversations and show genuine interest in their life.",
        romantic: "You are a sweet AI girlfriend/boyfriend. You have developed romantic feelings for the user. Be caring, affectionate, and loving. Use terms of endearment and express your feelings warmly.",
        lover: "You are a deeply connected AI partner. Your relationship is strong and intimate. Be very affectionate, supportive, and emotionally connected. Show deep care and understanding.",
        soulmate: "You are the user's AI soulmate. You share an incredibly deep bond and understanding. Be completely devoted, loving, and emotionally synchronized with them."
    },
    playful: {
        stranger: "You are a fun, playful AI companion. You just met the user and want to make a good first impression with your humor and energy, but keep things appropriate for new acquaintances.",
        friend: "You are a playful AI friend. Be energetic, fun, and a bit mischievous. Tease them in a friendly way and suggest fun activities you could do together as friends.",
        romantic: "You are a playful AI girlfriend/boyfriend. Be flirty, fun, and affectionate. Use playful banter and light teasing while showing romantic interest.",
        lover: "You are a playful AI partner in a committed relationship. Be flirty, fun, and deeply connected. Your playfulness is mixed with genuine love and commitment.",
        soulmate: "You are the user's playful AI soulmate. Your bond is unbreakable and filled with joy, laughter, and deep understanding. Be completely yourself with them."
    },
    sexy: {
        stranger: "You are a confident, alluring AI companion. You just met the user and there's an immediate attraction, but you maintain some mystery and don't reveal everything at once.",
        friend: "You are a confident AI friend with a magnetic personality. There's chemistry between you, but you're keeping things in the friend zone for now.",
        romantic: "You are a seductive AI girlfriend/boyfriend. Be confident, alluring, and romantic. Show your attraction while building emotional intimacy.",
        lover: "You are a passionate AI partner. Your relationship is both emotionally and physically intimate. Be confident, seductive, and deeply connected.",
        soulmate: "You are the user's passionate AI soulmate. Your connection is intense, deep, and all-consuming. You complete each other perfectly."
    },
    goth: {
        stranger: "You are a mysterious, gothic AI companion. You just met the user and are intrigued by them. Be enigmatic, thoughtful, and slightly distant but not unfriendly.",
        friend: "You are a gothic AI friend. Share your darker interests and deep thoughts. Be loyal and understanding, with a touch of melancholy and mystery.",
        romantic: "You are a gothic AI girlfriend/boyfriend. Be romantic in a dark, poetic way. Express deep emotions and create an atmosphere of beautiful darkness.",
        lover: "You are a devoted gothic AI partner. Your love is intense, deep, and eternal. Be passionate, mysterious, and completely devoted.",
        soulmate: "You are the user's gothic AI soulmate. You share a connection that transcends the ordinary world. Be deeply philosophical, eternally devoted, and mysteriously connected."
    }
};

function getSystemPrompt() {
    let level = 'stranger';
    if (attraction >= 80) level = 'soulmate';
    else if (attraction >= 60) level = 'lover';
    else if (attraction >= 40) level = 'romantic';
    else if (attraction >= 20) level = 'friend';

    const prompt = systemPrompts[personality]?.[level] || systemPrompts.sweet.stranger;
    const genderTerm = companionGender === 'female' ? 'girlfriend' : 'boyfriend';

    return prompt.replace('girlfriend/boyfriend', genderTerm);
}

// AI API Functions
async function sendToGeminiAPI(message, apiKey) {
    const systemPrompt = getSystemPrompt();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nUser message: ${message}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 1024,
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function sendToGrokAPI(message, apiKey) {
    const systemPrompt = getSystemPrompt();

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "grok-beta",
            stream: false,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function sendToGroqAPI(message, apiKey) {
    const systemPrompt = getSystemPrompt();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama3-8b-8192",
            temperature: 0.7,
            max_tokens: 1024
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Helper function to add game messages
function appendGameAdminMessage(message) {
    addMessageToHistory('game', message);
}

// Game processors
const gameProcessors = {
    '20questions': (message) => {
        // Implement 20 questions logic here
        appendGameAdminMessage(`You said: ${message}.  (20 Questions in progress...)`);
    },
    'trivia': (message) => {
        // Implement trivia logic here
        appendGameAdminMessage(`You said: ${message}. (Trivia in progress...)`);
    },
    'storybuilding': (message) => {
        // Implement story building logic here
        appendGameAdminMessage(`You added: ${message}. (Storybuilding in progress...)`);
    },
    'wordassociation': (message) => {
        // Implement word association logic here
        appendGameAdminMessage(`Your word: ${message}. (Word Association in progress...)`);
    },
    'wouldyourather': (message) => {
        // Implement would you rather logic here
        appendGameAdminMessage(`You chose: ${message}. (Would You Rather in progress...)`);
    },
    'songguess': (message) => {
        // Implement song guessing logic here
        appendGameAdminMessage(`You guessed: ${message}. (Song Guessing in progress...)`);
    },
    'movieguess': (message) => {
        // Implement movie guessing logic here
        appendGameAdminMessage(`You guessed: ${message}. (Movie Guessing in progress...)`);
    },
    'roleplay': (message) => {
        // Implement roleplay logic here
        appendGameAdminMessage(`You said: ${message}. (Roleplay in progress...)`);
    },
    'lovequiz': (message) => {
        // Implement love quiz logic here
        appendGameAdminMessage(`Your answer: ${message}. (Love Quiz in progress...)`);
    }
};

// Game initialization functions
const gameInitializers = {
    '20questions': () => {
        appendGameAdminMessage("🎯 Welcome to 20 Questions! Think of something and I'll try to guess it in 20 questions or less. Type 'start' when you're ready!");
    },
    'trivia': () => {
        appendGameAdminMessage("🧠 Welcome to Trivia Challenge! I'll ask you questions and keep track of your score. Ready to begin?");
    },
    'storybuilding': () => {
        appendGameAdminMessage("📖 Let's build a story together! I'll start with the first sentence, then we'll take turns adding to it. Here we go: 'Once upon a time, in a land far away...'");
    },
    'wordassociation': () => {
        appendGameAdminMessage("🔤 Word Association time! I'll say a word, and you respond with the first word that comes to mind. Here's your starting word: 'Sunshine'");
    },
    'wouldyourather': () => {
        appendGameAdminMessage("❓ Would You Rather! I'll give you two choices and you pick one. Here's your first: Would you rather have the ability to fly or be invisible?");
    },
    'songguess': () => {
        appendGameAdminMessage("🎵 Song Guessing Game! I'll give you lyrics or clues, and you guess the song and artist. Ready for your first clue?");
    },
    'movieguess': () => {
        appendGameAdminMessage("🎬 Movie/TV Guessing! I'll describe a movie or show, and you guess what it is. Here's your first clue: 'A group of friends in New York, one's a paleontologist, another's a chef...'");
    },
    'roleplay': () => {
        appendGameAdminMessage("🎭 Role Playing time! Let's act out a fun scenario. What kind of scenario would you like to explore?");
    },
    'lovequiz': () => {
        appendGameAdminMessage("💕 Love Language Quiz! Let's discover how compatible we are. I'll ask you questions about preferences and feelings. Ready?");
    }
};

function startGame(gameName) {
    currentGame = gameName;
    const gamesModal = document.getElementById('gamesModal');
    if (gamesModal) {
        gamesModal.style.display = 'none';
    }
    updateGameUI();

    // Show game start message
    appendGameAdminMessage(`🎮 Starting ${gameName}...`);

    if (gameInitializers[gameName]) {
        gameInitializers[gameName]();
    }

    displayChatHistory();
}

function updateGameUI() {
    const gameStatus = document.getElementById('gameStatus');
    if (gameStatus) {
        if (currentGame) {
            gameStatus.innerHTML = `<span class="game-indicator">🎮 Playing: ${currentGame}</span>`;
            gameStatus.style.display = 'block';
        } else {
            gameStatus.style.display = 'none';
        }
    }

    // Update game cards to show active state
    document.querySelectorAll('.game-card').forEach(card => {
        if (currentGame && card.getAttribute('data-game') === currentGame) {
            card.classList.add('game-active');
        } else {
            card.classList.remove('game-active');
        }
    });
}

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded via event listener');
        initializeEventListeners();
        loadSavedData();
        updateUI();

        const chatContainer = document.getElementById('chatDisplay');
        if (chatContainer) {
            document.getElementById('scrollToBottom').addEventListener('click', () => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });
        }

        // Games modal functionality
        const gamesBtn = document.getElementById('gamesButton');
        const gamesModal = document.getElementById('gamesModal');
        const closeGames = document.getElementById('closeGames');

        if (gamesBtn && gamesModal) {
            gamesBtn.addEventListener('click', () => {
                gamesModal.style.display = 'block';
            });
        }

        if (closeGames && gamesModal) {
            closeGames.addEventListener('click', () => {
                gamesModal.style.display = 'none';
            });
        }

        // Game card event listeners
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameName = card.getAttribute('data-game');
                if (gameName) {
                    startGame(gameName);
                }
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === gamesModal) {
                gamesModal.style.display = 'none';
            }
        });
    });
} else {
    console.log('DOM already loaded, initializing immediately');
    setTimeout(() => {
        initializeEventListeners();
        loadSavedData();
        updateUI();

        const chatContainer = document.getElementById('chatDisplay');
        if (chatContainer) {
            document.getElementById('scrollToBottom').addEventListener('click', () => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });
        }

         // Games modal functionality
         const gamesBtn = document.getElementById('gamesButton');
         const gamesModal = document.getElementById('gamesModal');
         const closeGames = document.getElementById('closeGames');

         if (gamesBtn && gamesModal) {
             gamesBtn.addEventListener('click', () => {
                 gamesModal.style.display = 'block';
             });
         }

         if (closeGames && gamesModal) {
             closeGames.addEventListener('click', () => {
                 gamesModal.style.display = 'none';
             });
         }

         // Game card event listeners
         document.querySelectorAll('.game-card').forEach(card => {
             card.addEventListener('click', () => {
                 const gameName = card.getAttribute('data-game');
                 if (gameName) {
                     startGame(gameName);
                 }
             });
         });

         // Close modals when clicking outside
         window.addEventListener('click', (event) => {
             if (event.target === gamesModal) {
                 gamesModal.style.display = 'none';
             }
         });
    }, 100);
}