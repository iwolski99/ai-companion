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
let companionName = localStorage.getItem('companionName') || (companionGender === 'female' ? 'Her' : 'Him');
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

    // Reset attraction button
    const resetAttractionBtn = document.getElementById('resetAttraction');
    if (resetAttractionBtn) {
        resetAttractionBtn.addEventListener('click', resetAttraction);
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

    // Settings menu toggle
    const settingsMenuBtn = document.getElementById('settingsMenuBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsMenuBtn && settingsMenu) {
        settingsMenuBtn.addEventListener('click', function() {
            settingsMenu.classList.toggle('active');
        });
    }

    // Companion name functionality
    const saveNameBtn = document.getElementById('saveCompanionName');
    const nameInput = document.getElementById('companionNameInput');
    if (saveNameBtn && nameInput) {
        nameInput.value = companionName;
        saveNameBtn.addEventListener('click', function() {
            const newName = nameInput.value.trim();
            if (newName) {
                companionName = newName;
                localStorage.setItem('companionName', companionName);
                updateCompanionNameDisplay();
                alert('Companion name updated successfully!');
            }
        });
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
            updateApiKeyInput();
        });
    }

    // API Key visibility toggle
    const toggleBtns = document.querySelectorAll('.toggle-visibility');
    toggleBtns.forEach(toggleBtn => {
        toggleBtn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const eyeIcon = this.querySelector('.eye-icon');

            if (input && eyeIcon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    eyeIcon.textContent = '🙈';
                } else {
                    input.type = 'password';
                    eyeIcon.textContent = '👁️';
                }
            }
        });
    });

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
    // Load API provider first
    const savedProvider = localStorage.getItem('apiProvider');
    if (savedProvider) {
        apiProvider = savedProvider;
        const apiSelect = document.getElementById('apiProvider');
        if (apiSelect) apiSelect.value = apiProvider;
    }

    // Load appropriate API key based on provider
    updateApiKeyInput();

    // Load saved profile picture
    const savedProfilePic = localStorage.getItem('profilePictureData');
    if (savedProfilePic) {
        const profilePic = document.getElementById('profilePic');
        if (profilePic) {
            profilePic.src = savedProfilePic;
        }
    }

    // Load companion name
    const savedName = localStorage.getItem('companionName');
    if (savedName) {
        companionName = savedName;
    }

    // Update name input field
    const nameInput = document.getElementById('companionNameInput');
    if (nameInput) {
        nameInput.value = companionName;
    }
}

function updateUI() {
    updateAttractionDisplay();
    displayChatHistory();
    updateCompanionNameDisplay();
}

function updateCompanionNameDisplay() {
    const nameDisplay = document.getElementById('companionNameDisplay');
    if (nameDisplay) {
        nameDisplay.textContent = companionName;
    }
}

function saveApiKeys() {
    console.log('Saving API keys...');

    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput && apiKeyInput.value.trim()) {
        const keyValue = apiKeyInput.value.trim();

        if (apiProvider === 'gemini') {
            geminiApiKey = keyValue;
            localStorage.setItem('geminiApiKey', geminiApiKey);
        } else if (apiProvider === 'grok') {
            grokApiKey = keyValue;
            localStorage.setItem('grokApiKey', grokApiKey);
        } else if (apiProvider === 'groq') {
            groqApiKey = keyValue;
            localStorage.setItem('groqApiKey', groqApiKey);
        }

        alert('API key saved successfully!');
    } else {
        alert('Please enter an API key');
    }
}

function updateApiKeyInput() {
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) return;

    let currentKey = '';
    let placeholder = 'Enter API Key';

    if (apiProvider === 'gemini') {
        currentKey = geminiApiKey;
        placeholder = 'Enter Gemini API Key';
    } else if (apiProvider === 'grok') {
        currentKey = grokApiKey;
        placeholder = 'Enter Grok API Key';
    } else if (apiProvider === 'groq') {
        currentKey = groqApiKey;
        placeholder = 'Enter Groq API Key';
    }

    apiKeyInput.value = currentKey;
    apiKeyInput.placeholder = placeholder;
}

function clearChatHistory() {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        displayChatHistory();
        alert('Chat history cleared!');
    }
}

function resetAttraction() {
    if (confirm('Reset attraction level back to 0 (Stranger)?\n\nThis will not affect chat history.')) {
        attraction = 0;
        localStorage.removeItem('attraction');
        updateAttractionDisplay();
        alert('Attraction level reset to Stranger!');
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

        // Set up event listeners for profile pic modal buttons
        const saveBtn = document.getElementById('saveProfilePic');
        const cancelBtn = document.getElementById('cancelProfilePic');
        const fileInput = document.getElementById('profilePicInput');

        if (saveBtn) {
            saveBtn.onclick = saveProfilePicture;
        }

        if (cancelBtn) {
            cancelBtn.onclick = closeProfilePicModal;
        }

        if (fileInput) {
            fileInput.onchange = handleProfilePicSelect;
        }
    }
}

function closeProfilePreviewModal() {
    const modal = document.getElementById('profilePreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showProfilePreview(imageSrc) {
    const modal = document.getElementById('profilePreviewModal');
    const previewImage = document.getElementById('profilePreviewImage');

    if (modal && previewImage) {
        previewImage.src = imageSrc;
        modal.style.display = 'block';
    }
}

function closeProfilePicModal() {
    const modal = document.getElementById('profilePicModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleProfilePicSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Check if it's an image file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB.');
            return;
        }
    }
}

function saveProfilePicture() {
    const fileInput = document.getElementById('profilePicInput');
    if (!fileInput || !fileInput.files[0]) {
        alert('Please select an image file first.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const imageData = e.target.result;

        // Update the profile picture display
        const profilePic = document.getElementById('profilePic');
        if (profilePic) {
            profilePic.src = imageData;
        }

        // Store in localStorage
        localStorage.setItem('profilePictureData', imageData);

        // Close modal
        closeProfilePicModal();

        alert('Profile picture updated successfully!');
    };

    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };

    reader.readAsDataURL(file);
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Check for game exit command
    if (message.toLowerCase() === '/exit' && currentGame) {
        endGame();
        return;
    }

    // Check if API key is configured
    let currentApiKey = '';
    const apiKeyInput = document.getElementById('apiKey');

    if (apiProvider === 'gemini') {
        currentApiKey = geminiApiKey || (apiKeyInput ? apiKeyInput.value.trim() : '');
    } else if (apiProvider === 'grok') {
        currentApiKey = grokApiKey || (apiKeyInput ? apiKeyInput.value.trim() : '');
    } else if (apiProvider === 'groq') {
        currentApiKey = groqApiKey || (apiKeyInput ? apiKeyInput.value.trim() : '');
    }

    if (!currentApiKey) {
        alert(`Please configure your ${apiProvider} API key first!`);
        return;
    }

    // Add user message to chat
    addMessageToHistory('user', message);
    messageInput.value = '';

    // Process game input if a game is active
    let shouldGetAIResponse = true;
    if (currentGame && gameProcessors[currentGame]) {
        shouldGetAIResponse = gameProcessors[currentGame](message);
    }

    // Display updated chat
    displayChatHistory();

    // Only get AI response if not blocked by game processor
    if (!shouldGetAIResponse) {
        return;
    }

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
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].message === 'Typing...') {
            chatHistory.pop(); // Remove "Typing..." message
        }
        addMessageToHistory('ai', response);
        displayChatHistory();

    } catch (error) {
        console.error('Error sending message:', error);
        // Remove typing indicator and add error message
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].message === 'Typing...') {
            chatHistory.pop(); // Remove "Typing..." message
        }
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

    // Add attraction points for AI messages, but significantly reduce for game AI messages
    if (sender === 'ai') {
        attraction += Math.floor(Math.random() * 3) + 1; // 1-3 points
        updateAttractionDisplay();
    } else if (sender === 'game_ai') {
        // Much smaller chance of gaining attraction during games
        if (Math.random() < 0.3) { // Only 30% chance
            attraction += 1; // Only 1 point maximum
            updateAttractionDisplay();
        }
    }

    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    localStorage.setItem('attraction', attraction.toString());
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
        messageDiv.className = `message message-${msg.sender}`;

        let senderName = 'You';
        if (msg.sender === 'ai') {
            senderName = companionName;
        } else if (msg.sender === 'game') {
            senderName = '🎮 Game System';
        } else if (msg.sender === 'game_ai') {
            senderName = companionName;
        }

        // Add special styling for game messages
        let messageContent = msg.message;
        if (msg.sender === 'game') {
            messageContent = `<span style="color: #ffd700; font-weight: 500;">${msg.message}</span>`;
        } else if (msg.sender === 'game_ai') {
            messageContent = `<span style="color: #ffd700; font-weight: 500;">${msg.message}</span>`;
        }

        // Create profile picture element for AI messages
        let profilePicHtml = '';
        if (msg.sender === 'ai' || msg.sender === 'game_ai') {
            const savedProfilePic = localStorage.getItem('profilePictureData');
            const profileSrc = savedProfilePic || 'images/sweet_neutral.svg';
            profilePicHtml = `<img src="${profileSrc}" alt="AI Profile" class="profile-pic message-profile-pic" onclick="showProfilePreview('${profileSrc}')">`;
        }

        if (msg.sender === 'ai' || msg.sender === 'game_ai') {
            messageDiv.innerHTML = `
                ${profilePicHtml}
                <div style="flex: 1;">
                    <div class="message-content">
                        <strong>${senderName}:</strong>
                        <span>${messageContent}</span>
                    </div>
                    <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div style="flex: 1;">
                    <div class="message-content">
                        <strong>${senderName}:</strong>
                        <span>${messageContent}</span>
                    </div>
                    <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
        }

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
    let fullPrompt = systemPrompt;

    // Add game awareness if in a game
    if (currentGame) {
        if (currentGame === '20questions') {
            fullPrompt += `\n\nYou are currently playing 20 Questions with the user. The GAME SYSTEM handles all the questions - DO NOT ask any yes/no questions yourself. Only react to their answers with encouragement and excitement. Let the game system do the questioning while you provide emotional support and commentary. Do not interfere with the game flow.`;
        } else {
            fullPrompt += `\n\nYou are currently playing ${currentGame} with the user. You can see all the game messages in the chat history and should respond naturally while being engaged with the game. Be encouraging, react to their moves, make comments about the game progress, and make the experience fun and interactive. Look at the recent game system messages to understand what's happening in the game.`;
        }
    }

    // Include recent chat history for context
    let conversationContext = '';
    const recentMessages = chatHistory.slice(-10); // Get last 10 messages
    if (recentMessages.length > 0) {
        conversationContext = '\n\nRecent conversation history:\n';
        recentMessages.forEach(msg => {
            let sender = msg.sender === 'user' ? 'User' : msg.sender === 'ai' ? 'You' : 'Game System';
            conversationContext += `${sender}: ${msg.message}\n`;
        });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${fullPrompt}${conversationContext}\n\nUser's latest message: ${message}\n\nRespond as the AI girlfriend, acknowledging any game activity and responding naturally to both the user and any game developments.`
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
    let fullPrompt = systemPrompt;

    // Add game awareness if in a game
    if (currentGame) {
        if (currentGame === '20questions') {
            fullPrompt += `\n\nYou are currently playing 20 Questions with the user. The GAME SYSTEM handles all the questions - DO NOT ask any yes/no questions yourself. Only react to their answers with encouragement and excitement. Let the game system do the questioning while you provide emotional support and commentary. Do not interfere with the game flow.`;
        } else {
            fullPrompt += `\n\nYou are currently playing ${currentGame} with the user. You can see all the game messages in the chat history and should respond naturally while being engaged with the game. Be encouraging, react to their moves, make comments about the game progress, and make the experience fun and interactive. Look at the recent game system messages to understand what's happening in the game.`;
        }
    }

    // Build messages array with recent chat history
    const messages = [
        {
            role: "system",
            content: fullPrompt
        }
    ];

    // Add recent chat history for context
    const recentMessages = chatHistory.slice(-8); // Get last 8 messages (excluding typing indicator)
    recentMessages.forEach(msg => {
        if (msg.sender === 'user') {
            messages.push({ role: "user", content: msg.message });
        } else if (msg.sender === 'ai') {
            messages.push({ role: "assistant", content: msg.message });
        } else if (msg.sender === 'game') {
            messages.push({ role: "user", content: `[Game System]: ${msg.message}` });
        } else if (msg.sender === 'game_ai') {
            messages.push({ role: "assistant", content: msg.message });
        }
    });

    // Add current message
    messages.push({ role: "user", content: message });

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: messages,
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
    let fullPrompt = systemPrompt;

    // Add game awareness if in a game
    if (currentGame) {
        if (currentGame === '20questions') {
            fullPrompt += `\n\nYou are currently playing 20 Questions with the user. The GAME SYSTEM handles all the questions - DO NOT ask any yes/no questions yourself. Only react to their answers with encouragement and excitement. Let the game system do the questioning while you provide emotional support and commentary. Do not interfere with the game flow.`;
        } else {
            fullPrompt += `\n\nYou are currently playing ${currentGame} with the user. You can see all the game messages in the chat history and should respond naturally while being engaged with the game. Be encouraging, react to their moves, make comments about the game progress, and make the experience fun and interactive. Look at the recent game system messages to understand what's happening in the game.`;
        }
    }

    // Build messages array with recent chat history
    const messages = [
        {
            role: "system",
            content: fullPrompt
        }
    ];

    // Add recent chat history for context
    const recentMessages = chatHistory.slice(-8); // Get last 8 messages (excluding typing indicator)
    recentMessages.forEach(msg => {
        if (msg.sender === 'user') {
            messages.push({ role: "user", content: msg.message });
        } else if (msg.sender === 'ai') {
            messages.push({ role: "assistant", content: msg.message });
        } else if (msg.sender === 'game') {
            messages.push({ role: "user", content: `[Game System]: ${msg.message}` });
        } else if (msg.sender === 'game_ai') {
            messages.push({ role: "assistant", content: msg.message });
        }
    });

    // Add current message
    messages.push({ role: "user", content: message });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            messages: messages,
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

// Game state management
let gameState = {
    isActive: false,
    currentGame: null,
    gameData: {}
};

// Helper function to add game messages
function appendGameAdminMessage(message) {
    addMessageToHistory('game', message);
}

// Generate intelligent next question for 20 questions
async function generateNextQuestion(questionHistory, answers) {
    let currentApiKey = '';
    if (apiProvider === 'gemini') {
        currentApiKey = geminiApiKey;
    } else if (apiProvider === 'grok') {
        currentApiKey = grokApiKey;
    } else if (apiProvider === 'groq') {
        currentApiKey = groqApiKey;
    }

    if (!currentApiKey) {
        // Fallback to basic questions
        const fallbackQuestions = [
            "Is it bigger than a breadbox?",
            "Can you hold it in your hand?",
            "Is it made by humans?",
            "Is it found indoors?",
            "Is it electronic?",
            "Is it soft?",
            "Does it make noise?",
            "Is it used for work?",
            "Would children play with it?",
            "Is it colorful?"
        ];
        return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    }

    // Build context from previous Q&A
    let context = "You are playing 20 questions. Here are the questions asked and answers received:\n";
    for (let i = 0; i < questionHistory.length; i++) {
        context += `Q: ${questionHistory[i]} A: ${answers[i]}\n`;
    }
    context += "\nBased on these clues, what is the BEST next yes/no question to narrow down what they're thinking of? Only respond with the question, nothing else.";

    try {
        let response = '';

        if (apiProvider === 'gemini') {
            const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: context
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.5,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 50,
                    }
                })
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.candidates[0].content.parts[0].text.trim();
            }
        } else if (apiProvider === 'grok') {
            const apiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    '