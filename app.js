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
    const choice = confirm('Clear chat history?\n\nClick OK to clear history only\nClick Cancel to clear EVERYTHING (history + attraction level)');

    if (choice === true) {
        // Clear only chat history
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        displayChatHistory();
        alert('Chat history cleared!');
    } else if (choice === false) {
        // User clicked Cancel, ask if they want to reset everything
        const resetAll = confirm('This will reset EVERYTHING:\n• Chat history\n• Attraction level\n• Relationship progress\n\nAre you sure?');
        if (resetAll) {
            chatHistory = [];
            attraction = 0;
            localStorage.removeItem('chatHistory');
            localStorage.removeItem('attraction');
            displayChatHistory();
            updateAttractionDisplay();
            alert('Everything has been reset!');
        }
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

    // Check for game exit command
    if (message.toLowerCase() === '/exit' && currentGame) {
        endGame();
        return;
    }

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
        messageDiv.className = `message ${msg.sender}-message`;

        let senderName = 'You';
        if (msg.sender === 'ai') {
            senderName = companionGender === 'female' ? 'Her' : 'Him';
        } else if (msg.sender === 'game') {
            senderName = '🎮 Game System';
        } else if (msg.sender === 'game_ai') {
            senderName = companionGender === 'female' ? 'Her' : 'Him';
        }

        // Add special styling for game messages
        let messageContent = msg.message;
        if (msg.sender === 'game') {
            messageContent = `<span style="color: #ffd700; font-weight: 500;">${msg.message}</span>`;
        } else if (msg.sender === 'game_ai') {
            messageContent = `<span style="color: #ffd700; font-weight: 500;">${msg.message}</span>`;
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                <strong>${senderName}:</strong>
                <span>${messageContent}</span>
            </div>
            <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are playing 20 questions. Generate the best next yes/no question." },
                        { role: "user", content: context }
                    ],
                    model: "grok-beta",
                    stream: false,
                    temperature: 0.5,
                    max_tokens: 50
                })
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.choices[0].message.content.trim();
            }
        } else if (apiProvider === 'groq') {
            const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are playing 20 questions. Generate the best next yes/no question." },
                        { role: "user", content: context }
                    ],
                    model: "llama3-8b-8192",
                    temperature: 0.5,
                    max_tokens: 50
                })
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.choices[0].message.content.trim();
            }
        }

        // Clean up the response
        response = response.replace(/^["']|["']$/g, '');
        return response || "Is it something you use every day?";

    } catch (error) {
        console.error('Error generating question:', error);
        return "Is it something you use every day?";
    }
}

// Make an intelligent guess based on all the answers
async function makeIntelligentGuess(questionHistory, answers) {
    let currentApiKey = '';
    if (apiProvider === 'gemini') {
        currentApiKey = geminiApiKey;
    } else if (apiProvider === 'grok') {
        currentApiKey = grokApiKey;
    } else if (apiProvider === 'groq') {
        currentApiKey = groqApiKey;
    }

    if (!currentApiKey) {
        return null;
    }

    // Build context from all Q&A
    let context = "Based on this 20 questions game, what do you think they're thinking of?\n";
    for (let i = 0; i < questionHistory.length; i++) {
        context += `Q: ${questionHistory[i]} A: ${answers[i]}\n`;
    }
    context += "\nWhat is your best guess? Respond with just the object/animal/thing name, nothing else.";

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
                        temperature: 0.3,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 20,
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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are making a guess in 20 questions. Respond with just the object name." },
                        { role: "user", content: context }
                    ],
                    model: "grok-beta",
                    stream: false,
                    temperature: 0.3,
                    max_tokens: 20
                })
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.choices[0].message.content.trim();
            }
        } else if (apiProvider === 'groq') {
            const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are making a guess in 20 questions. Respond with just the object name." },
                        { role: "user", content: context }
                    ],
                    model: "llama3-8b-8192",
                    temperature: 0.3,
                    max_tokens: 20
                })
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.choices[0].message.content.trim();
            }
}

        // Clean up the response
        response = response.replace(/^["']|["']$/g, '').toLowerCase();
        return response || null;

    } catch (error) {
        console.error('Error making guess:', error);
        return null;
    }
}

// Get AI contribution for story building game
async function getAIStoryContribution(currentStory) {
    let currentApiKey = '';
    if (apiProvider === 'gemini') {
        currentApiKey = geminiApiKey;
    } else if (apiProvider === 'grok') {
        currentApiKey = grokApiKey;
    } else if (apiProvider === 'groq') {
        currentApiKey = groqApiKey;
    }

    if (!currentApiKey) {
        return null;
    }

    const storyPrompt = `We're playing a collaborative story-building game. Here's our story so far: "${currentStory.join(' ')}"

Please add exactly ONE sentence to continue this story. Make it engaging and creative, but keep it appropriate for the story's tone. Only respond with the single sentence to add - nothing else.`;

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
                            text: storyPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        topP: 0.9,
                        topK: 40,
                        maxOutputTokens: 100,
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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are helping build a collaborative story. Respond with exactly one sentence to continue the story." },
                        { role: "user", content: storyPrompt }
                    ],
                    model: "grok-beta",
                    stream: false,
                    temperature: 0.8,
                    max_tokens: 100
                })
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.choices[0].message.content.trim();
            }
        } else if (apiProvider === 'groq') {
            const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are helping build a collaborative story. Respond with exactly one sentence to continue the story." },
                        { role: "user", content: storyPrompt }
                    ],
                    model: "llama3-8b-8192",
                    temperature: 0.8,
                    max_tokens: 100
                })
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = data.choices[0].message.content.trim();
            }
        }

        // Clean up the response - remove quotes if they exist
        response = response.replace(/^["']|["']$/g, '');

        return response || null;
    } catch (error) {
        console.error('Error getting AI story contribution:', error);
        return null;
    }
}

// Game processors with full functionality
const gameProcessors = {
    '20questions': async (message) => {
        if (!gameState.gameData['20questions']) {
            gameState.gameData['20questions'] = {
                questionsAsked: 0,
                gamePhase: 'waiting', // waiting, ready, questioning, ended
                waitingForAnswer: false,
                answers: [], // Store all answers
                questionHistory: [] // Store all questions asked
            };
        }

        const data = gameState.gameData['20questions'];

        if (message.toLowerCase().includes('start') && data.gamePhase === 'waiting') {
            data.gamePhase = 'ready';
            appendGameAdminMessage("🎯 Great! Think of something (an object, animal, person, etc.) and I'll try to guess it. Type 'ready' when you've thought of something!");
            displayChatHistory();
            return true; // Allow AI response to be encouraging
        }

        if (message.toLowerCase().includes('ready') && data.gamePhase === 'ready') {
            data.gamePhase = 'questioning';
            data.questionsAsked = 0;
            data.waitingForAnswer = true;
            data.answers = [];
            data.questionHistory = [];

            // Start with the first intelligent question
            const firstQuestion = "Is it alive?";
            data.questionHistory.push(firstQuestion);
            appendGameAdminMessage(`🎯 Perfect! Question 1/20: ${firstQuestion} (Please answer YES or NO)`);
            displayChatHistory();
            return true; // Allow AI response to show excitement
        }

        if (data.gamePhase === 'questioning' && data.waitingForAnswer) {
            const response = message.toLowerCase().trim();

            // Strict yes/no checking
            if (!response.includes('yes') && !response.includes('no')) {
                appendGameAdminMessage("🎯 Please answer with 'YES' or 'NO' only!");
                displayChatHistory();
                return false; // Block AI response for invalid input
            }

            // Record the answer
            const answer = response.includes('yes') ? 'yes' : 'no';
            data.answers.push(answer);
            data.questionsAsked++;
            data.waitingForAnswer = false;

            // Check if we should make a guess (after 15 questions or if confident)
            if (data.questionsAsked >= 15) {
                // Try to make an intelligent guess
                const guess = await makeIntelligentGuess(data.questionHistory, data.answers);
                if (guess && data.questionsAsked >= 18) {
                    data.gamePhase = 'guessing';
                    appendGameAdminMessage(`🎯 I think I know! Is it a ${guess}? (YES or NO)`);
                    displayChatHistory();
                    return false; // Block AI response during guessing
                }
            }

            if (data.questionsAsked >= 20) {
                data.gamePhase = 'ended';
                appendGameAdminMessage("🎯 I've used all 20 questions! I give up. What were you thinking of?");
                displayChatHistory();
                return false; // Block AI response when game ends
            }

            // Generate next intelligent question
            setTimeout(async () => {
                data.waitingForAnswer = true;
                const nextQuestion = await generateNextQuestion(data.questionHistory, data.answers);
                data.questionHistory.push(nextQuestion);
                appendGameAdminMessage(`🎯 Question ${data.questionsAsked + 1}/20: ${nextQuestion} (Please answer YES or NO)`);
                displayChatHistory();
            }, 1000);
            return false; // Block AI response during questioning phase
        }

        if (data.gamePhase === 'guessing') {
            const response = message.toLowerCase().trim();
            if (response.includes('yes')) {
                appendGameAdminMessage(`🎯 Yes! I guessed it! Thanks for playing! That was fun. Type '/exit' to leave the game.`);
                data.gamePhase = 'ended';
                displayChatHistory();
                return false; // Block AI response during game end
            } else if (response.includes('no')) {
                appendGameAdminMessage(`🎯 Hmm, let me ask more questions then...`);
                data.gamePhase = 'questioning';
                data.waitingForAnswer = true;

                // Continue with more questions
                setTimeout(async () => {
                    const nextQuestion = await generateNextQuestion(data.questionHistory, data.answers);
                    data.questionHistory.push(nextQuestion);
                    appendGameAdminMessage(`🎯 Question ${data.questionsAsked + 1}/20: ${nextQuestion} (Please answer YES or NO)`);
                    displayChatHistory();
                }, 1000);
                return false; // Block AI response during questioning
            } else {
                appendGameAdminMessage("🎯 Please answer with 'YES' or 'NO' only!");
                displayChatHistory();
                return false;
            }
        }

        if (data.gamePhase === 'ended' && !data.waitingForAnswer) {
            appendGameAdminMessage(`🎯 "${message}" - interesting! I should have guessed that! Thanks for playing! Type '/exit' to leave the game.`);
            displayChatHistory();
            return false; // Block AI response during game end
        }

        return true; // Allow AI response for other cases
    },

    'trivia': (message) => {
        if (!gameState.gameData['trivia']) {
            gameState.gameData['trivia'] = {
                score: 0,
                questionsAsked: 0,
                currentQuestion: null,
                currentAnswer: null,
                questions: [
                    { q: "What is the capital of France?", a: "paris" },
                    { q: "What year did World War II end?", a: "1945" },
                    { q: "What is the largest planet in our solar system?", a: "jupiter" },
                    { q: "Who painted the Mona Lisa?", a: "leonardo da vinci" },
                    { q: "What is 15 + 27?", a: "42" }
                ]
            };
        }

        const data = gameState.gameData['trivia'];

        if (message.toLowerCase().includes('start') && !data.currentQuestion) {
            data.questionsAsked = 0;
            data.score = 0;
            const question = data.questions[data.questionsAsked];
            data.currentQuestion = question.q;
            data.currentAnswer = question.a;
            appendGameAdminMessage(`🧠 Question ${data.questionsAsked + 1}: ${data.currentQuestion}`);
            displayChatHistory();
            return false;
        }

        if (data.currentQuestion) {
            const userAnswer = message.toLowerCase().trim();
            if (userAnswer.includes(data.currentAnswer)) {
                data.score++;
                appendGameAdminMessage(`🧠 Correct! Score: ${data.score}/${data.questionsAsked + 1}`);
            } else {
                appendGameAdminMessage(`🧠 Wrong! The answer was: ${data.currentAnswer}. Score: ${data.score}/${data.questionsAsked + 1}`);
            }

            data.questionsAsked++;
            if (data.questionsAsked < data.questions.length) {
                const question = data.questions[data.questionsAsked];
                data.currentQuestion = question.q;
                data.currentAnswer = question.a;
                appendGameAdminMessage(`🧠 Question ${data.questionsAsked + 1}: ${data.currentQuestion}`);
            } else {
                data.currentQuestion = null;
                appendGameAdminMessage(`🧠 Game over! Final score: ${data.score}/${data.questions.length}. Type '/exit' to leave the game.`);
            }
            displayChatHistory();
            return false;
        }

        return true;
    },

    'storybuilding': async (message) => {
        if (!gameState.gameData['storybuilding']) {
            gameState.gameData['storybuilding'] = {
                story: ["Once upon a time, in a land far away..."],
                turnCount: 1,
                waitingForAI: false
            };
        }

        const data = gameState.gameData['storybuilding'];

        if (message.toLowerCase().includes('start')) {
            appendGameAdminMessage("📖 Let's build a story together! I'll start: 'Once upon a time, in a land far away...' Now add your sentence!");
            displayChatHistory();
            return false;
        }

        // Add user's contribution to story
        data.story.push(message);
        data.turnCount++;

        // Get AI's story contribution first
        data.waitingForAI = true;
        const aiContribution = await getAIStoryContribution(data.story);

        if (aiContribution) {
            data.story.push(aiContribution);
            data.turnCount++;

            // Add the AI's contribution as "Her" message in yellow
            addMessageToHistory('game_ai', aiContribution);

            // Then add the game system message
            appendGameAdminMessage(`📖 Updated story: "${data.story.join(' ')}" Your turn again!`);
        } else {
            appendGameAdminMessage("📖 I'm having trouble thinking of what to add. Your turn again!");
        }

        data.waitingForAI = false;
        displayChatHistory();
        return false;
    },

    'wordassociation': (message) => {
        if (!gameState.gameData['wordassociation']) {
            gameState.gameData['wordassociation'] = {
                currentWord: 'sunshine',
                wordChain: ['sunshine'],
                turnCount: 0
            };
        }

        const data = gameState.gameData['wordassociation'];

        if (message.toLowerCase().includes('start')) {
            appendGameAdminMessage(`🔤 Word Association! Starting word: "${data.currentWord}". What word comes to mind?`);
            displayChatHistory();
            return false;
        }

        const userWord = message.toLowerCase().trim();
        data.wordChain.push(userWord);
        data.currentWord = userWord;
        data.turnCount++;
        appendGameAdminMessage(`🔤 "${userWord}" - good one! Chain: ${data.wordChain.join(' → ')}`);
        displayChatHistory();
        return true; // Allow AI response for this game
    },

    'wouldyourather': (message) => {
        if (!gameState.gameData['wouldyourather']) {
            gameState.gameData['wouldyourather'] = {
                questionsAsked: 0,
                questions: [
                    "Would you rather have the ability to fly or be invisible?",
                    "Would you rather always be 10 minutes late or 20 minutes early?",
                    "Would you rather have unlimited money or unlimited time?",
                    "Would you rather read minds or predict the future?",
                    "Would you rather live in the past or the future?"
                ]
            };
        }

        const data = gameState.gameData['wouldyourather'];

        if (message.toLowerCase().includes('start')) {
            appendGameAdminMessage(`❓ ${data.questions[0]}`);
            displayChatHistory();
            return true; // Allow AI response for this game
        }

        appendGameAdminMessage(`❓ Interesting choice! I can see why you'd pick that.`);
        data.questionsAsked++;

        if (data.questionsAsked < data.questions.length) {
            appendGameAdminMessage(`❓ Next question: ${data.questions[data.questionsAsked]}`);
        } else {
            appendGameAdminMessage(`❓ That was fun! We've gone through all my questions. Type '/exit' to leave the game.`);
        }
        displayChatHistory();
        return true; // Allow AI response for this game
    },

    'songguess': (message) => {
        if (!gameState.gameData['songguess']) {
            gameState.gameData['songguess'] = {
                currentSong: 0,
                score: 0,
                songs: [
                    { clue: "🎵 'Is this the real life? Is this just fantasy?'", answer: "bohemian rhapsody", artist: "Queen" },
                    { clue: "🎵 'Hello, is it me you're looking for?'", answer: "hello", artist: "Lionel Richie" },
                    { clue: "🎵 'I see trees of green, red roses too'", answer: "what a wonderful world", artist: "Louis Armstrong" }
                ]
            };
        }

        const data = gameState.gameData['songguess'];

        if (message.toLowerCase().includes('start')) {
            appendGameAdminMessage(`🎵 Song Guessing Game! Here's your first clue: ${data.songs[0].clue}`);
            displayChatHistory();
            return false;
        }

        const guess = message.toLowerCase();
        const currentSong = data.songs[data.currentSong];

        if (guess.includes(currentSong.answer.toLowerCase()) || guess.includes(currentSong.artist.toLowerCase())) {
            data.score++;
            appendGameAdminMessage(`🎵 Correct! It was "${currentSong.answer}" by ${currentSong.artist}. Score: ${data.score}`);
        } else {
            appendGameAdminMessage(`🎵 Not quite! It was "${currentSong.answer}" by ${currentSong.artist}. Score: ${data.score}`);
        }

        data.currentSong++;
        if (data.currentSong < data.songs.length) {
            appendGameAdminMessage(`🎵 Next clue: ${data.songs[data.currentSong].clue}`);
        } else {
            appendGameAdminMessage(`🎵 Game over! Final score: ${data.score}/${data.songs.length}. Type '/exit' to leave the game.`);
        }
        displayChatHistory();
        return false;
    },

    'movieguess': (message) => {
        if (!gameState.gameData['movieguess']) {
            gameState.gameData['movieguess'] = {
                currentMovie: 0,
                score: 0,
                movies: [
                    { clue: "🎬 A group of friends in New York, one's a paleontologist, another's a chef...", answer: "friends" },
                    { clue: "🎬 A wizard boy attends a magical school and fights a dark lord", answer: "harry potter" },
                    { clue: "🎬 'I'll be back' - Time traveling robots", answer: "terminator" }
                ]
            };
        }

        const data = gameState.gameData['movieguess'];

        if (message.toLowerCase().includes('start')) {
            appendGameAdminMessage(`🎬 Movie/TV Guessing! Here's your first clue: ${data.movies[0].clue}`);
            displayChatHistory();
            return false;
        }

        const guess = message.toLowerCase();
        const currentMovie = data.movies[data.currentMovie];

        if (guess.includes(currentMovie.answer.toLowerCase())) {
            data.score++;
            appendGameAdminMessage(`🎬 Correct! It was "${currentMovie.answer}". Score: ${data.score}`);
        } else {
            appendGameAdminMessage(`🎬 Not quite! It was "${currentMovie.answer}". Score: ${data.score}`);
        }

        data.currentMovie++;
        if (data.currentMovie < data.movies.length) {
            appendGameAdminMessage(`🎬 Next clue: ${data.movies[data.currentMovie].clue}`);
        } else {
            appendGameAdminMessage(`🎬 Game over! Final score: ${data.score}/${data.movies.length}. Type '/exit' to leave the game.`);
        }
        displayChatHistory();
        return false;
    },

    'roleplay': (message) => {
        if (!gameState.gameData['roleplay']) {
            gameState.gameData['roleplay'] = {
                scenario: null,
                started: false
            };
        }

        const data = gameState.gameData['roleplay'];

        if (message.toLowerCase().includes('start') && !data.started) {
            appendGameAdminMessage("🎭 Role Playing time! What scenario would you like to explore? (cafe date, adventure quest, mystery detective, etc.)");
            displayChatHistory();
            return false;
        }

        if (!data.started && !data.scenario) {
            data.scenario = message;
            data.started = true;
            appendGameAdminMessage(`🎭 Great! Let's roleplay a ${message} scenario. I'll play along with whatever character fits the scene!`);
            displayChatHistory();
            return true; // Allow AI response for roleplay
        }

        appendGameAdminMessage(`🎭 *Playing along in the ${data.scenario} scenario* This is so much fun!`);
        displayChatHistory();
        return true; // Allow AI response for roleplay
    },

    'lovequiz': (message) => {
        if (!gameState.gameData['lovequiz']) {
            gameState.gameData['lovequiz'] = {
                currentQuestion: 0,
                questions: [
                    "What's your ideal date activity?",
                    "What's most important in a relationship?",
                    "How do you prefer to show affection?",
                    "What's your love language?",
                    "What makes you feel most loved?"
                ]
            };
        }

        const data = gameState.gameData['lovequiz'];

        if (message.toLowerCase().includes('start')) {
            appendGameAdminMessage(`💕 Love Language Quiz! Question 1: ${data.questions[0]}`);
            displayChatHistory();
            return true; // Allow AI response for love quiz
        }

        appendGameAdminMessage(`💕 Interesting answer! That tells me a lot about you.`);
        data.currentQuestion++;

        if (data.currentQuestion < data.questions.length) {
            appendGameAdminMessage(`💕 Question ${data.currentQuestion + 1}: ${data.questions[data.currentQuestion]}`);
        } else {
            appendGameAdminMessage(`💕 Thanks for sharing! I feel like I know you better now. We're very compatible! Type '/exit' to leave the game.`);
        }
        displayChatHistory();
        return true; // Allow AI response for love quiz
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
        appendGameAdminMessage("📖 Let's build a story together! I'll start with the first sentence, then we'll take turns adding to it. Here we go: 'Once upon a time, in a land far away...' Add your sentence!");
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

// Game context for AI integration
function getGameContext() {
    if (!currentGame || !gameState.isActive) {
        return '';
    }

    const gameName = currentGame;
    const data = gameState.gameData[gameName] || {};

    let context = `\n\n[GAME CONTEXT - DO NOT MENTION THIS TO USER]\n`;
    context += `Currently playing: ${gameName}\n`;
    context += `Game state: ${JSON.stringify(data)}\n`;
    context += `You are participating in this ${gameName} game. Respond as the AI girlfriend while being engaged with the game. The user can see all game messages in the chat history, so you can reference them naturally.\n`;
    context += `You can comment on their game performance, encourage them, or react to their moves. Type '/exit' exits the game.\n`;
    context += `[END GAME CONTEXT]\n\n`;

    return context;
}

function startGame(gameName) {
    currentGame = gameName;
    gameState.isActive = true;
    gameState.currentGame = gameName;

    const gamesModal = document.getElementById('gamesModal');
    if (gamesModal) {
        gamesModal.style.display = 'none';
    }
    updateGameUI();

    // Show game start message
    appendGameAdminMessage(`🎮 Starting ${gameName}... (Type '/exit' anytime to quit the game)`);

    if (gameInitializers[gameName]) {
        gameInitializers[gameName]();
    }

    displayChatHistory();
}

function endGame() {
    if (currentGame) {
        appendGameAdminMessage(`🎮 Exiting ${currentGame}. Thanks for playing!`);
        currentGame = null;
        gameState.isActive = false;
        gameState.currentGame = null;
        gameState.gameData = {}; // Reset game data
        updateGameUI();

        // Add user message for the exit command
        addMessageToHistory('user', '/exit');
        displayChatHistory();
    }
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