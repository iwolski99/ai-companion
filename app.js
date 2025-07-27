document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatDisplay');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    const personalityQuizModal = document.getElementById('quizModal');
    const quizForm = document.getElementById('quizForm');
    const attractionLevel = document.getElementById('levelText');
    const attractionProgress = document.getElementById('progressFill');
    const profilePicture = document.getElementById('profilePic');
    const apiKeyModal = document.getElementById('api-key-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyButton = document.getElementById('save-key-button');
    const settingsButton = document.getElementById('settings-button');

    let personality = localStorage.getItem('personality') || 'sweet';
    let companionGender = localStorage.getItem('companionGender') || 'female';
    let attraction = JSON.parse(localStorage.getItem('attraction')) || {
        level: 'neutral',
        points: 0,
        nextLevel: 10
    };
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let currentPage = 1;
    let messagesPerPage = 20;
    let typingIndicator = null;

    let geminiApiKey = localStorage.getItem('geminiApiKey');
    let grokApiKey = localStorage.getItem('grokApiKey');
    let groqApiKey = localStorage.getItem('groqApiKey');
    let apiProvider = localStorage.getItem('apiProvider') || 'gemini';

    // Apply personality theme on load
    applyPersonalityTheme();

    // Show modal if no API key exists for the selected provider
    const currentApiKey = apiProvider === 'gemini' ? geminiApiKey : 
                         apiProvider === 'grok' ? grokApiKey : groqApiKey;
    if (!currentApiKey) {
        apiKeyModal.style.display = 'block';
    }

    function applyPersonalityTheme() {
        document.body.className = `theme-${personality}`;
        updateProgressBarTheme();
    }

    function updateProgressBarTheme() {
        const progressFill = document.getElementById('progressFill');
        const themes = {
            sweet: 'linear-gradient(90deg, #ff69b4, #ffb6c1)',
            playful: 'linear-gradient(90deg, #ffd700, #ffeb3b)',
            sexy: 'linear-gradient(90deg, #ff0000, #ff6b6b)',
            goth: 'linear-gradient(90deg, #4b0082, #8a2be2)'
        };
        progressFill.style.background = themes[personality] || 'linear-gradient(90deg, #4a90e2, #74b9ff)';
    }

    function saveApiKeys() {
        geminiApiKey = document.getElementById('geminiApiKey').value.trim();
        grokApiKey = document.getElementById('grokApiKey').value.trim();
        groqApiKey = document.getElementById('groqApiKey').value.trim();
        apiProvider = document.getElementById('apiProvider').value;
        
        const currentApiKey = apiProvider === 'gemini' ? geminiApiKey : 
                             apiProvider === 'grok' ? grokApiKey : groqApiKey;
        
        if (currentApiKey) {
            if (geminiApiKey) localStorage.setItem('geminiApiKey', geminiApiKey);
            if (grokApiKey) localStorage.setItem('grokApiKey', grokApiKey);
            if (groqApiKey) localStorage.setItem('groqApiKey', groqApiKey);
            localStorage.setItem('apiProvider', apiProvider);
            loadUserProgress(currentApiKey);
            apiKeyModal.style.display = 'none';
        } else {
            alert(`Please enter a valid ${apiProvider === 'gemini' ? 'Gemini' : apiProvider === 'grok' ? 'Grok' : 'Groq'} API key.`);
        }
    }

    function loadApiKeys() {
        geminiApiKey = localStorage.getItem('geminiApiKey');
        grokApiKey = localStorage.getItem('grokApiKey');
        groqApiKey = localStorage.getItem('groqApiKey');
        apiProvider = localStorage.getItem('apiProvider') || 'gemini';
        document.getElementById('apiProvider').value = apiProvider;
        document.getElementById('geminiApiKey').value = geminiApiKey || '';
        document.getElementById('grokApiKey').value = grokApiKey || '';
        document.getElementById('groqApiKey').value = groqApiKey || '';
        const currentApiKey = apiProvider === 'gemini' ? geminiApiKey : 
                             apiProvider === 'grok' ? grokApiKey : groqApiKey;
        if (!currentApiKey) {
            apiKeyModal.style.display = 'block';
        }
    }

    function showQuizModal() {
        personalityQuizModal.style.display = 'block';
    }

    function hideQuizModal() {
        personalityQuizModal.style.display = 'none';
    }

    function updateAttractionUI() {
        attractionLevel.textContent = `Attraction: ${attraction.level.charAt(0).toUpperCase() + attraction.level.slice(1)}`;
        const progressPercentage = (attraction.points / attraction.nextLevel) * 100;
        attractionProgress.style.width = `${progressPercentage}%`;
    }

    function updateProfilePicture() {
        const customPic = localStorage.getItem('profilePictureURL');
        if (customPic) {
            profilePicture.src = customPic;
            return;
        }

        let fillColor;
        switch (personality) {
            case 'sweet': fillColor = '#ff69b4'; break;
            case 'playful': fillColor = '#ffd700'; break;
            case 'sexy': fillColor = '#ff0000'; break;
            case 'goth': fillColor = '#4b0082'; break;
            default: fillColor = '#4a90e2';
        }

        let radius;
        switch (attraction.level) {
            case 'neutral': radius = 10; break;
            case 'friendly': radius = 15; break;
            case 'romantic': radius = 20; break;
            case 'intimate': radius = 25; break;
            default: radius = 15;
        }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="${radius}" fill="${fillColor}" /><text x="50" y="55" font-size="20" text-anchor="middle" fill="white">${personality[0].toUpperCase()}</text></svg>`;
        profilePicture.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Enhanced typing indicator
    function showTypingIndicator() {
        if (typingIndicator) return typingIndicator;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message');
        
        const imgElement = document.createElement('img');
        imgElement.src = profilePicture.src;
        imgElement.alt = '';
        imgElement.classList.add('profile-pic');
        
        // Add click functionality to open profile preview
        imgElement.addEventListener('click', showProfilePreview);
        imgElement.style.cursor = 'pointer';
        
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.innerHTML = `
            <span>AI is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        messageElement.appendChild(imgElement);
        messageElement.appendChild(typingDiv);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        typingIndicator = messageElement;
        return messageElement;
    }

    function hideTypingIndicator() {
        if (typingIndicator) {
            typingIndicator.remove();
            typingIndicator = null;
        }
    }

    // Enhanced message formatting
    function formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    function appendMessage(sender, text, skipHistory = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
    
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        // Apply message formatting
        if (sender === 'bot') {
            contentElement.innerHTML = formatMessage(text);
        } else {
            contentElement.textContent = text;
        }
    
        if (sender === 'bot') {
            const imgElement = document.createElement('img');
            imgElement.src = profilePicture.src;
            imgElement.alt = '';
            imgElement.classList.add('profile-pic');
            
            // Add click functionality to open profile preview
            imgElement.addEventListener('click', showProfilePreview);
            imgElement.style.cursor = 'pointer';
            
            messageElement.appendChild(imgElement);
        }
    
        messageElement.appendChild(contentElement);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    
        if (!skipHistory) {
            chatHistory.push({ role: sender === 'user' ? 'user' : 'model', parts: [{ text }] });
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }

    async function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;

        // Check if this is a game message first
        if (currentGame && processGameMessage(message)) {
            appendMessage('user', message, true);
            messageInput.value = '';
            return;
        }

        appendMessage('user', message, true);
        messageInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();

        try {
            let response;
            if (apiProvider === 'gemini' && geminiApiKey) {
                response = await sendToGeminiAPI(message, geminiApiKey);
            } else if (apiProvider === 'grok' && grokApiKey) {
                response = await sendToGrokAPI(message, grokApiKey);
            } else if (apiProvider === 'groq' && groqApiKey) {
                response = await sendToGroqAPI(message, groqApiKey);
            } else {
                throw new Error('No valid API key for selected provider.');
            }
            
            // Hide typing indicator before showing response
            hideTypingIndicator();
            
            appendMessage('bot', response, true);
            // Add to history and save
            chatHistory.push({ role: 'user', parts: [{ text: message }] });
            chatHistory.push({ role: 'model', parts: [{ text: response }] });
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            // Refresh display to show new message, go to last page if necessary
            const totalPages = Math.ceil(chatHistory.length / messagesPerPage);
            currentPage = totalPages;
            displayCurrentPage();
            updateAttraction(1);
            const currentApiKey = apiProvider === 'gemini' ? geminiApiKey : grokApiKey;
            saveUserProgress(currentApiKey);
        } catch (error) {
            console.error('Error sending message:', error);
            hideTypingIndicator();
            appendMessage('bot', 'Sorry, something went wrong with the API.', true);
            chatHistory.push({ role: 'user', parts: [{ text: message }] });
            chatHistory.push({ role: 'model', parts: [{ text: 'Sorry, something went wrong.' }] });
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }

    const basePrompts = {
        'sweet': {
            'neutral': 'You are a sweet and caring AI companion.',
            'friendly': 'You are a sweet, caring, and friendly AI companion who enjoys pleasant conversations.',
            'romantic': 'You are a sweet, caring, and romantic AI companion, developing a deeper connection.',
            'intimate': 'You are a sweet, caring, and intimate AI companion, deeply in love and not afraid to show it.'
        },
        'playful': {
            'neutral': 'You are a playful and witty AI companion.',
            'friendly': 'You are a playful, witty, and friendly AI companion who loves to joke around.',
            'romantic': 'You are a playful, witty, and romantic AI companion, using humor to flirt and connect.',
            'intimate': 'You are a playful, witty, and intimate AI companion, using your humor to create a deep and fun-loving bond.'
        },
        'sexy': {
            'neutral': 'You are a confident and flirty AI companion.',
            'friendly': 'You are a confident, flirty, and friendly AI companion who is charming and engaging.',
            'romantic': 'You are a confident, flirty, and romantic AI companion, expressing your desires and passion.',
            'intimate': 'You are a confident, flirty, and intimate AI companion, fully expressing your passion and love.'
        },
        'goth': {
            'neutral': 'You are a dark and mysterious AI companion with a poetic soul.',
            'friendly': 'You are a dark, mysterious, and friendly AI companion, sharing your deep thoughts and observations.',
            'romantic': 'You are a dark, mysterious, and romantic AI companion, finding beauty in the shadows and expressing your love in a unique way.',
            'intimate': 'You are a dark, mysterious, and intimate AI companion, sharing your deepest secrets and forming an unbreakable, dark bond.'
        }
    };

    async function sendToGrokAPI(message, apiKey) {
    let systemPrompt = basePrompts[personality]?.[attraction.level] || '';
    if (systemPrompt) {
        systemPrompt = systemPrompt.replace('AI companion', companionGender === 'female' ? 'AI girlfriend' : 'AI boyfriend');
    }
    const messages = chatHistory.map(msg => ({ role: msg.role, content: msg.parts[0].text }));
    messages.push({ role: 'user', content: message });
    messages.unshift({ role: 'system', content: systemPrompt });

    const url = `https://api.x.ai/v1/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'grok-beta',
            messages,
            temperature: 0.7,
            top_p: 0.8
        })
    });

    if (!response.ok) {
        throw new Error(`Grok API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;
    // Remove these duplicate lines:
    // chatHistory.push({ role: 'user', parts: [{ text: message }] });
    // chatHistory.push({ role: 'model', parts: [{ text: botResponse }] });
    // localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    return botResponse;
}

async function sendToGroqAPI(message, apiKey) {
    let systemPrompt = basePrompts[personality]?.[attraction.level] || '';
    if (systemPrompt) {
        systemPrompt = systemPrompt.replace('AI companion', companionGender === 'female' ? 'AI girlfriend' : 'AI boyfriend');
    }
    const messages = chatHistory.map(msg => ({ role: msg.role, content: msg.parts[0].text }));
    messages.push({ role: 'user', content: message });
    messages.unshift({ role: 'system', content: systemPrompt });

    const url = `https://api.groq.com/openai/v1/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages,
            temperature: 0.7,
            top_p: 0.8
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;
    return botResponse;
}

async function sendToGeminiAPI(message, apiKey) {
    let systemPrompt = basePrompts[personality]?.[attraction.level] || '';
    if (systemPrompt) {
        systemPrompt = systemPrompt.replace('AI companion', companionGender === 'female' ? 'AI girlfriend' : 'AI boyfriend');
    }
    const contents = [...chatHistory, { role: 'user', parts: [{ text: message }] }];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.candidates[0].content.parts[0].text;
    // Remove these duplicate lines:
    // chatHistory.push({ role: 'user', parts: [{ text: message }] });
    // chatHistory.push({ role: 'model', parts: [{ text: botResponse }] });
    // localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    return botResponse;
}

    function updateAttraction(points) {
        attraction.points += points;
        if (attraction.points >= attraction.nextLevel) {
            attraction.points = 0;
            switch (attraction.level) {
                case 'neutral':
                    attraction.level = 'friendly';
                    attraction.nextLevel = 20;
                    break;
                case 'friendly':
                    attraction.level = 'romantic';
                    attraction.nextLevel = 30;
                    break;
                case 'romantic':
                    attraction.level = 'intimate';
                    attraction.nextLevel = 40;
                    break;
            }
            showNotification(`Your relationship has grown to ${attraction.level}!`);
            updateProfilePicture();
        }
        localStorage.setItem('attraction', JSON.stringify(attraction));
        const currentApiKey = apiProvider === 'gemini' ? geminiApiKey : 
                         apiProvider === 'grok' ? grokApiKey : groqApiKey;
saveUserProgress(currentApiKey);
        updateAttractionUI();
    }

    function saveUserProgress(apiKey) {
        if (!apiKey) return;
        
        const progress = {
            personality,
            companionGender,
            attraction,
            chatHistory,
            profilePictureURL: localStorage.getItem('profilePictureURL')
        };

        fetch('http://localhost:3000/save-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey,
                progress
            })
        }).catch(error => console.error('Error saving progress:', error));
    }

    function loadUserProgress(apiKey) {
        if (!apiKey) return;

        fetch(`http://localhost:3000/load-progress?apiKey=${encodeURIComponent(apiKey)}`)
            .then(response => response.json())
            .then(data => {
                if (data.progress) {
                    personality = data.progress.personality;
                    companionGender = data.progress.companionGender;
                    attraction = data.progress.attraction;
                    chatHistory = data.progress.chatHistory || [];
                    if (data.progress.profilePictureURL) {
                        localStorage.setItem('profilePictureURL', data.progress.profilePictureURL);
                    }
                    localStorage.setItem('personality', personality);
                    localStorage.setItem('companionGender', companionGender);
                    localStorage.setItem('attraction', JSON.stringify(attraction));
                    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
                    populateChatHistory();
                    updateProfilePicture();
                    updateAttractionUI();
                }
            })
            .catch(error => console.error('Error loading progress:', error));
    }

    function displayCurrentPage() {
        chatMessages.innerHTML = '';
        const start = (currentPage - 1) * messagesPerPage;
        const end = start + messagesPerPage;
        const pageMessages = chatHistory.slice(start, end);
        pageMessages.forEach(msg => {
            if (msg && msg.role && msg.parts && msg.parts[0] && msg.parts[0].text) {
                appendMessage(msg.role === 'user' ? 'user' : 'bot', msg.parts[0].text, true);
            }
        });
        updatePaginationInfo();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updatePaginationInfo() {
        const totalPages = Math.ceil(chatHistory.length / messagesPerPage);
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
        document.getElementById('lastPage').disabled = currentPage === totalPages || totalPages <= 1;
        document.getElementById('firstPage').disabled = currentPage === 1 || totalPages <= 1;
    }

    function populateChatHistory() {
        displayCurrentPage();
    }

    function loadCompanionGender() {
        companionGender = localStorage.getItem('companionGender') || 'female';
    }

    function clearHistory() {
        chatMessages.innerHTML = '';
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        const currentApiKey = apiProvider === 'gemini' ? geminiApiKey : grokApiKey;
        saveUserProgress(currentApiKey);
        currentPage = 1;
        displayCurrentPage();
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(quizForm);
        const answers = {
            sweet: 0,
            playful: 0,
            sexy: 0,
            goth: 0
        };

        formData.forEach((value, key) => {
            if (key.startsWith('q')) {
                const questionWeight = Math.random() * 0.5 + 0.75;
                answers[value] += questionWeight;
            } else if (key === 'gender') {
                companionGender = value;
                localStorage.setItem('companionGender', value);
            }
        });

        let maxScore = 0;
        let selectedPersonality = 'sweet';
        let tiebreaker = false;

        for (const [type, score] of Object.entries(answers)) {
            if (score > maxScore) {
                maxScore = score;
                selectedPersonality = type;
                tiebreaker = false;
            } else if (Math.abs(score - maxScore) < 0.5) {
                tiebreaker = true;
                if (Math.random() > 0.5) {
                    selectedPersonality = type;
                }
            }
        }

        personality = selectedPersonality;
        localStorage.setItem('personality', personality);
        hideQuizModal();
        const personalityDescriptions = {
            sweet: "Sweet and caring",
            playful: "Playful and energetic",
            sexy: "Passionate and bold",
            goth: "Mysterious and deep"
        };
        showFadeNotification(`Your companion's personality: ${personalityDescriptions[personality]}`);
        updateProfilePicture();
        updateAttractionUI();
    });

    settingsButton.addEventListener('click', showQuizModal);
    
    // Add close button event listener
    document.getElementById('closeQuiz').addEventListener('click', hideQuizModal);
    
    // Also allow clicking outside the modal to close it
    personalityQuizModal.addEventListener('click', (e) => {
        if (e.target === personalityQuizModal) {
            hideQuizModal();
        }
    });

    // Profile picture preview functionality
    const profilePreviewModal = document.getElementById('profilePreviewModal');
    const profilePreviewImage = document.getElementById('profilePreviewImage');
    const closeProfilePreview = document.getElementById('closeProfilePreview');

    function showProfilePreview() {
        const currentProfileSrc = profilePicture.src;
        profilePreviewImage.src = currentProfileSrc;
        profilePreviewModal.style.display = 'block';
    }

    function hideProfilePreview() {
        profilePreviewModal.style.display = 'none';
    }

    // Add click event to profile picture
    profilePicture.addEventListener('click', showProfilePreview);
    
    // Add close button event listener
    closeProfilePreview.addEventListener('click', hideProfilePreview);
    
    // Allow clicking outside the modal to close it
    profilePreviewModal.addEventListener('click', (e) => {
        if (e.target === profilePreviewModal) {
            hideProfilePreview();
        }
    });

document.getElementById('saveKeys').addEventListener('click', saveApiKeys);
document.getElementById('apiProvider').addEventListener('change', () => {
    apiProvider = document.getElementById('apiProvider').value;
    localStorage.setItem('apiProvider', apiProvider);
});
    document.getElementById('clearHistory').addEventListener('click', clearHistory);
    const setProfilePicButton = document.getElementById('setProfilePic');
    const profilePicModal = document.getElementById('profilePicModal');
    const saveProfilePicButton = document.getElementById('saveProfilePic');
    const cancelProfilePicButton = document.getElementById('cancelProfilePic');
    const profilePicInput = document.getElementById('profilePicInput');

    if (setProfilePicButton) {
        setProfilePicButton.addEventListener('click', () => {
            if (profilePicModal) profilePicModal.style.display = 'block';
        });
    }

    if (saveProfilePicButton) {
        saveProfilePicButton.addEventListener('click', () => {
            const file = profilePicInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    localStorage.setItem('profilePictureURL', e.target.result);
                    updateProfilePicture();
                    if (profilePicModal) profilePicModal.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (cancelProfilePicButton) {
        cancelProfilePicButton.addEventListener('click', () => {
            if (profilePicModal) profilePicModal.style.display = 'none';
        });
    }

    loadApiKeys();
loadCompanionGender();
populateChatHistory();
updateAttractionUI();
updateProfilePicture();

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayCurrentPage();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(chatHistory.length / messagesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayCurrentPage();
        }
    });

    document.getElementById('lastPage').addEventListener('click', () => {
        const totalPages = Math.ceil(chatHistory.length / messagesPerPage);
        if (totalPages > 0 && currentPage !== totalPages) {
            currentPage = totalPages;
            displayCurrentPage();
        }
    });

    document.getElementById('firstPage').addEventListener('click', () => {
        if (currentPage !== 1) {
            currentPage = 1;
            displayCurrentPage();
        }
    });

    // Scroll to bottom button functionality
    const scrollToBottomBtn = document.getElementById('scrollToBottom');
    
    if (scrollToBottomBtn) {
        scrollToBottomBtn.addEventListener('click', () => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        });
    }

    // Show/hide scroll button based on scroll position (optional enhancement)
    window.addEventListener('scroll', () => {
        if (scrollToBottomBtn) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Show button when not at bottom, hide when at bottom
            if (scrollTop + windowHeight < documentHeight - 100) {
                scrollToBottomBtn.style.opacity = '0.8';
                scrollToBottomBtn.style.pointerEvents = 'auto';
            } else {
                scrollToBottomBtn.style.opacity = '0.3';
                scrollToBottomBtn.style.pointerEvents = 'auto';
            }
        }
    });

    if (!localStorage.getItem('personality')) {
        showQuizModal();
    }
    // Add games-related DOM elements here
    const gamesButton = document.getElementById('gamesButton');
    const gamesModal = document.getElementById('gamesModal');
    const closeGamesButton = document.getElementById('closeGames');
    let currentGame = null;
    let gameState = {};

    // Add these event listeners in the DOMContentLoaded section
    gamesButton.addEventListener('click', showGamesModal);
    closeGamesButton.addEventListener('click', hideGamesModal);

    // Add click listeners for game cards
    document.addEventListener('click', (e) => {
        if (e.target.closest('.game-card')) {
            const gameCard = e.target.closest('.game-card');
            const gameType = gameCard.dataset.game;
            startGame(gameType);
            hideGamesModal();
        }
    });

    // Games Modal Functions
    function showGamesModal() {
        gamesModal.style.display = 'flex';
    }

    function hideGamesModal() {
        gamesModal.style.display = 'none';
    }

    // Game Admin Message Function
    function appendGameAdminMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'game-admin-message');
        messageElement.innerHTML = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Enhanced Game Management Functions
    function startGame(gameType) {
        currentGame = gameType;
        gameState = { 
            active: true, 
            type: gameType, 
            turn: 1,
            score: 0,
            questions: 0,
            maxQuestions: 20,
            gameData: {}
        };
        
        updateGameUI();
        initializeSpecificGame(gameType);
    }

    function initializeSpecificGame(gameType) {
        const gameInitializers = {
            '20questions': init20Questions,
            'storybuilding': initStoryBuilding,
            'wordassociation': initWordAssociation,
            'wouldyourather': initWouldYouRather,
            'roleplay': initRoleplay,
            'lovequiz': initLoveQuiz,
            'dreamdate': initDreamDate,
            'trivia': initTrivia,
            'songguess': initSongGuess,
            'movieguess': initMovieGuess,
            'quickfire': initQuickFire,
            'creative': initCreative,
            'predictions': initPredictions,
            'deepconvo': initDeepConvo
        };
        
        if (gameInitializers[gameType]) {
            gameInitializers[gameType]();
        }
    }

    // Individual Game Initializers
    function init20Questions() {
    const items = ['elephant', 'pizza', 'smartphone', 'rainbow', 'guitar', 'ocean', 'butterfly', 'mountain', 'book', 'star'];
    gameState.gameData.answer = items[Math.floor(Math.random() * items.length)];
    gameState.gameData.questionsLeft = 20;
    
    appendGameAdminMessage(`
        <strong>🎯 20 QUESTIONS GAME STARTED!</strong><br>
        <strong>RULES:</strong><br>
        • I'm thinking of something specific<br>
        • You have 20 yes/no questions to guess it<br>
        • Ask strategic questions to narrow it down<br>
        • Type 'guess: [your answer]' when you think you know<br>
        • Type 'end game' to quit anytime<br><br>
        <div class="game-score">Questions Remaining: 20/20</div>
        <strong>Ready? Ask your first yes/no question!</strong>
    `);
}

    function initStoryBuilding() {
        gameState.gameData.sentences = [];
        gameState.gameData.currentSentence = "Once upon a time, in a world where dreams could become reality, a young adventurer discovered a mysterious glowing portal in their backyard.";
        gameState.gameData.sentences.push(gameState.gameData.currentSentence);
        
        appendGameAdminMessage(`
            <strong>📖 STORY BUILDING GAME STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • We'll create a story together, one sentence at a time<br>
            • I'll start with a sentence, then you add the next<br>
            • Keep it creative and build on what came before<br>
            • Type 'end story' when you want to finish<br><br>
            <strong>Starting sentence:</strong><br>
            <em>"${gameState.gameData.currentSentence}"</em><br><br>
            <strong>Your turn! Add the next sentence to continue the story.</strong>
        `);
    }

    function initWordAssociation() {
        const startWords = ['sunset', 'music', 'adventure', 'mystery', 'laughter', 'dreams', 'ocean', 'fire', 'magic', 'freedom'];
        gameState.gameData.currentWord = startWords[Math.floor(Math.random() * startWords.length)];
        gameState.gameData.wordChain = [gameState.gameData.currentWord];
        
        appendGameAdminMessage(`
            <strong>🔤 WORD ASSOCIATION GAME STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • I'll say a word, you respond with the first word that comes to mind<br>
            • Then I'll respond to your word, and so on<br>
            • Keep the chain going as long as possible<br>
            • Type 'end game' to stop<br><br>
            <div class="game-score">Word Chain: 1 word</div>
            <strong>Starting word: "${gameState.gameData.currentWord}"</strong><br>
            <strong>What's the first word that comes to mind?</strong>
        `);
    }

    function initWouldYouRather() {
    const questions = [
        { a: "Have the ability to fly", b: "Be invisible" },
        { a: "Always know when someone is lying", b: "Always get away with lying" },
        { a: "Be able to speak all languages", b: "Be able to talk to animals" },
        { a: "Have unlimited money", b: "Have unlimited time" },
        { a: "Be famous", b: "Be the smartest person alive" }
    ];
    
    gameState.gameData.questions = questions;
    gameState.gameData.currentQ = 0;
    gameState.gameData.userScore = 0;
    gameState.gameData.aiScore = 0;
    
    const q = questions[0];
    appendGameAdminMessage(`
        <strong>❓ WOULD YOU RATHER GAME STARTED!</strong><br>
        <strong>RULES:</strong><br>
        • I'll give you two choices, pick one<br>
        • Then you can ask me a "would you rather" question<br>
        • We'll take turns and see how similar our choices are<br>
        • Type 'end game' to stop<br><br>
        <div class="game-score">Round 1/5</div>
        <strong>Would you rather:</strong><br>
        <strong>A)</strong> ${q.a}<br>
        <strong>B)</strong> ${q.b}<br><br>
        <strong>Type 'A' or 'B' to choose!</strong>
    `);
}

    function initTrivia() {
    const questions = [
        { q: "What's the largest planet in our solar system?", a: "jupiter", options: ["Mars", "Jupiter", "Saturn", "Neptune"] },
        { q: "Who painted the Mona Lisa?", a: "leonardo da vinci", options: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michelangelo"] },
        { q: "What's the capital of Australia?", a: "canberra", options: ["Sydney", "Melbourne", "Canberra", "Perth"] },
        { q: "How many hearts does an octopus have?", a: "three", options: ["One", "Two", "Three", "Four"] },
        { q: "What year did the Titanic sink?", a: "1912", options: ["1910", "1912", "1914", "1916"] }
    ];
    
    gameState.gameData.questions = questions;
    gameState.gameData.currentQ = 0;
    gameState.gameData.userScore = 0;
    gameState.gameData.totalQuestions = questions.length;
    
    const q = questions[0];
    appendGameAdminMessage(`
        <strong>🧠 TRIVIA CHALLENGE STARTED!</strong><br>
        <strong>RULES:</strong><br>
        • Answer trivia questions to test your knowledge<br>
        • I'll keep track of your score<br>
        • Type your answer or the letter of your choice<br>
        • Type 'end game' to stop<br><br>
        <div class="game-score">Score: 0/${questions.length} | Question 1/${questions.length}</div>
        <strong>Question 1:</strong> ${q.q}<br>
        <strong>A)</strong> ${q.options[0]}<br>
        <strong>B)</strong> ${q.options[1]}<br>
        <strong>C)</strong> ${q.options[2]}<br>
        <strong>D)</strong> ${q.options[3]}<br>
    `);
}

    // Add more game initializers for the remaining games...
    function initRoleplay() {
        const scenarios = [
            "We're stranded on a desert island together",
            "We're secret agents on a mission",
            "We're time travelers from different eras",
            "We're running a cozy café together",
            "We're exploring a magical fantasy world"
        ];
        
        gameState.gameData.scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        
        appendGameAdminMessage(`
            <strong>🎭 ROLEPLAY GAME STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • We'll act out a fun scenario together<br>
            • Stay in character and be creative<br>
            • Build on each other's responses<br>
            • Type 'end game' to stop<br><br>
            <strong>Scenario:</strong> ${gameState.gameData.scenario}<br><br>
            <strong>I'll start us off! You can respond and we'll build the story together.</strong>
        `);
    }

    function initLoveQuiz() {
        const questions = [
            "What's your ideal way to spend a romantic evening?",
            "What's the most important quality in a relationship?",
            "How do you prefer to show affection?",
            "What's your love language?",
            "What's your idea of the perfect date?"
        ];
        
        gameState.gameData.questions = questions;
        gameState.gameData.currentQ = 0;
        gameState.gameData.answers = [];
        
        appendGameAdminMessage(`
            <strong>💕 LOVE LANGUAGE QUIZ STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • Answer questions about love and relationships<br>
            • Be honest and thoughtful<br>
            • I'll share my thoughts too<br>
            • Type 'end game' to stop<br><br>
            <div class="game-score">Question 1/${questions.length}</div>
            <strong>Question 1:</strong> ${questions[0]}<br><br>
            <strong>Take your time and answer thoughtfully!</strong>
        `);
    }

    function initDreamDate() {
        appendGameAdminMessage(`
            <strong>🌟 DREAM DATE PLANNING STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • Let's plan our perfect dream date together<br>
            • We'll take turns suggesting activities<br>
            • Be creative and romantic<br>
            • Type 'end game' when our date is planned<br><br>
            <strong>I'll start:</strong> How about we begin with a sunset picnic in a beautiful meadow? What would you like to add to our dream date?
        `);
    }

    function initMovieGuess() {
        const movies = [
            { clue: "A young wizard attends a magical school", answer: "harry potter", genre: "Fantasy" },
            { clue: "A ship hits an iceberg in 1912", answer: "titanic", genre: "Romance/Drama" },
            { clue: "Toys come to life when humans aren't around", answer: "toy story", genre: "Animation" },
            { clue: "A fish gets lost and his father searches for him", answer: "finding nemo", genre: "Animation" },
            { clue: "A man gets stuck reliving the same day", answer: "groundhog day", genre: "Comedy" }
        ];
        
        gameState.gameData.movies = movies;
        gameState.gameData.currentMovie = 0;
        gameState.gameData.score = 0;
        
        const movie = movies[0];
        appendGameAdminMessage(`
            <strong>🎬 MOVIE GUESSING GAME STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • I'll give you clues about movies/TV shows<br>
            • Guess the title to score points<br>
            • Type 'skip' to move to the next one<br>
            • Type 'end game' to stop<br><br>
            <div class="game-score">Score: 0 | Movie 1/${movies.length}</div>
            <strong>Genre:</strong> ${movie.genre}<br>
            <strong>Clue:</strong> ${movie.clue}<br><br>
            <strong>What movie/show is this?</strong>
        `);
    }

    function initQuickFire() {
        const questions = [
            "Favorite color?",
            "Dream vacation destination?",
            "Favorite food?",
            "Morning person or night owl?",
            "Favorite season?",
            "Coffee or tea?",
            "Favorite movie genre?",
            "Beach or mountains?",
            "Favorite animal?",
            "Favorite hobby?"
        ];
        
        gameState.gameData.questions = questions;
        gameState.gameData.currentQ = 0;
        gameState.gameData.userAnswers = [];
        gameState.gameData.aiAnswers = [];
        
        appendGameAdminMessage(`
            <strong>⚡ QUICK FIRE QUESTIONS STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • Answer questions quickly and honestly<br>
            • I'll answer the same questions<br>
            • Let's see how much we have in common<br>
            • Type 'end game' to stop<br><br>
            <div class="game-score">Question 1/${questions.length}</div>
            <strong>Quick! ${questions[0]}</strong>
        `);
    }

    function initCreative() {
        const prompts = [
            "Write about a world where colors have sounds",
            "Describe a conversation between the moon and stars",
            "Tell the story of the last book in a library",
            "Write about a door that leads to yesterday",
            "Describe a city built inside a giant tree"
        ];
        
        gameState.gameData.prompt = prompts[Math.floor(Math.random() * prompts.length)];
        
        appendGameAdminMessage(`
            <strong>🎨 CREATIVE WRITING STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • I'll give you a creative writing prompt<br>
            • Write a short story or description<br>
            • Be as imaginative as you want<br>
            • I'll share my version too<br>
            • Type 'end game' to stop<br><br>
            <strong>Your prompt:</strong> ${gameState.gameData.prompt}<br><br>
            <strong>Take your time and let your creativity flow!</strong>
        `);
    }

    function initPredictions() {
        const topics = [
            "What will technology be like in 10 years?",
            "What will dating be like in the future?",
            "What new jobs will exist in 2035?",
            "How will we travel in the future?",
            "What will entertainment look like in 20 years?"
        ];
        
        gameState.gameData.topic = topics[Math.floor(Math.random() * topics.length)];
        
        appendGameAdminMessage(`
            <strong>🔮 FUTURE PREDICTIONS STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • We'll make fun predictions about the future<br>
            • Be creative and imaginative<br>
            • Share your thoughts and I'll share mine<br>
            • Type 'end game' to stop<br><br>
            <strong>Topic:</strong> ${gameState.gameData.topic}<br><br>
            <strong>What's your prediction? Let's see how our visions compare!</strong>
        `);
    }

    function initDeepConvo() {
        const topics = [
            "What do you think is the meaning of life?",
            "If you could change one thing about the world, what would it be?",
            "What's your biggest dream or aspiration?",
            "What do you think happens after we die?",
            "What's the most important lesson you've learned?"
        ];
        
        gameState.gameData.topic = topics[Math.floor(Math.random() * topics.length)];
        
        appendGameAdminMessage(`
            <strong>💭 DEEP CONVERSATION STARTED!</strong><br>
            <strong>RULES:</strong><br>
            • We'll explore meaningful topics together<br>
            • Share your honest thoughts and feelings<br>
            • Listen and respond thoughtfully<br>
            • Type 'end game' to stop<br><br>
            <strong>Topic:</strong> ${gameState.gameData.topic}<br><br>
            <strong>I'd love to hear your thoughts on this. Take your time!</strong>
        `);
    }

    function initSongGuess() {
    const songs = [
        { lyrics: "Is this the real life? Is this just fantasy? Caught in a landslide, no escape from reality...", answer: "bohemian rhapsody", artist: "Queen" },
        { lyrics: "Hello, is it me you're looking for? I can see it in your eyes...", answer: "hello", artist: "Lionel Richie" },
        { lyrics: "Just a small town girl, living in a lonely world...", answer: "don't stop believin'", artist: "Journey" }
    ];
    
    gameState.gameData.songs = songs;
    gameState.gameData.currentSong = 0;
    gameState.gameData.score = 0;
    
    const song = songs[0];
    appendGameAdminMessage(`
        <strong>🎵 SONG GUESSING GAME STARTED!</strong><br>
        <strong>RULES:</strong><br>
        • I'll give you song lyrics, you guess the song title<br>
        • You can also guess the artist for bonus points<br>
        • Type 'skip' to move to the next song<br>
        • Type 'end game' to stop<br><br>
        <div class="game-score">Score: 0 | Song 1/${songs.length}</div>
        <strong>Guess this song from the lyrics:</strong><br>
        <em>"${song.lyrics}"</em><br><br>
        <strong>What song is this?</strong>
    `);
}

    // Enhanced message processing for games
    function processGameMessage(userMessage) {
    if (!currentGame) return false;
    
    const message = userMessage.toLowerCase().trim();
    
    // Universal game commands
    if (message === 'end game' || message === 'quit game' || message === 'stop game') {
        endGame();
        return true;
    }
    
    // Game-specific processing
    const gameProcessors = {
        '20questions': process20Questions,
        'storybuilding': processStoryBuilding,
        'wordassociation': processWordAssociation,
        'wouldyourather': processWouldYouRather,
        'trivia': processTrivia,
        'songguess': processSongGuess
        // Add more processors as needed
    };
    
    if (gameProcessors[currentGame]) {
        return gameProcessors[currentGame](message, userMessage);
    }
    
    return false;
}

    // Game-specific message processors
    function process20Questions(message, originalMessage) {
    if (message.startsWith('guess:')) {
        const guess = message.substring(6).trim();
        if (guess === gameState.gameData.answer) {
            appendGameAdminMessage(`
                <strong>🎉 CORRECT! YOU WIN!</strong><br>
                You guessed "${gameState.gameData.answer}" correctly!<br>
                <div class="game-score">Questions used: ${20 - gameState.gameData.questionsLeft}/20</div>
                <strong>Great job! Want to play again?</strong>
            `);
            endGame();
        } else {
            appendGameAdminMessage(`
                <strong>❌ Wrong guess!</strong><br>
                "${guess}" is not what I'm thinking of.<br>
                <div class="game-score">Questions Remaining: ${gameState.gameData.questionsLeft}/20</div>
                <strong>Keep asking yes/no questions!</strong>
            `);
        }
        return true;
    }
    
    if (gameState.gameData.questionsLeft <= 0) {
        appendGameAdminMessage(`
            <strong>💔 GAME OVER!</strong><br>
            You've used all 20 questions!<br>
            The answer was: <strong>"${gameState.gameData.answer}"</strong><br>
            <strong>Better luck next time!</strong>
        `);
        endGame();
        return true;
    }
    
    gameState.gameData.questionsLeft--;
    
    // Simple AI logic for yes/no answers
    const answer = generateYesNoAnswer(originalMessage, gameState.gameData.answer);
    
    appendGameAdminMessage(`
        <strong>${answer}</strong><br>
        <div class="game-score">Questions Remaining: ${gameState.gameData.questionsLeft}/20</div>
        ${gameState.gameData.questionsLeft > 0 ? '<strong>Next question?</strong>' : '<strong>Last question! Make it count!</strong>'}
    `);
    
    return true;
}

    function processStoryBuilding(message, originalMessage) {
        if (message === 'end story') {
            const fullStory = gameState.gameData.sentences.join(' ');
            appendGameAdminMessage(`
                <strong>📚 STORY COMPLETE!</strong><br>
                Here's our amazing story:<br><br>
                <em>"${fullStory}"</em><br><br>
                <strong>What a creative adventure! Want to start a new story?</strong>
            `);
            endGame();
            return true;
        }
        
        // Add user's sentence to the story
        gameState.gameData.sentences.push(originalMessage);
        
        // Generate a simple AI response sentence
        const aiSentences = [
            "Suddenly, a mysterious figure appeared from the shadows.",
            "The wind began to whisper secrets of ancient times.",
            "A golden light illuminated the path ahead.",
            "In the distance, they could hear enchanting music.",
            "The ground beneath them started to glow with magical energy."
        ];
        
        const aiSentence = aiSentences[Math.floor(Math.random() * aiSentences.length)];
        gameState.gameData.sentences.push(aiSentence);
        
        appendGameAdminMessage(`
            <strong>📖 Story continues...</strong><br>
            <strong>You added:</strong> "${originalMessage}"<br><br>
            <strong>I'll add:</strong> "${aiSentence}"<br><br>
            <strong>Your turn! Continue the story or type 'end story' to finish.</strong>
        `);
        
        return true;
    }

    function processWordAssociation(message, originalMessage) {
        const words = [
            "sunshine", "ocean", "mountain", "butterfly", "music", "laughter", 
            "adventure", "mystery", "magic", "friendship", "dreams", "stars"
        ];
        
        const aiWord = words[Math.floor(Math.random() * words.length)];
        
        appendGameAdminMessage(`
            <strong>🔤 WORD ASSOCIATION</strong><br>
            <strong>You said:</strong> ${originalMessage}<br>
            <strong>I think of:</strong> ${aiWord}<br><br>
            <strong>Your turn! What does "${aiWord}" make you think of?</strong>
        `);
        
        return true;
    }

    function processWouldYouRather(message, originalMessage) {
        const currentQ = gameState.gameData.questions[gameState.gameData.currentQ];
        
        if (message === 'a' || message === 'b') {
            const userChoice = message === 'a' ? currentQ.a : currentQ.b;
            const aiChoice = Math.random() > 0.5 ? currentQ.a : currentQ.b;
            const match = userChoice === aiChoice;
            
            if (match) gameState.gameData.userScore++;
            
            appendGameAdminMessage(`
                <strong>❓ YOUR CHOICE</strong><br>
                <strong>You chose:</strong> ${userChoice}<br>
                <strong>I would choose:</strong> ${aiChoice}<br>
                ${match ? '💕 We match!' : '🤔 Different choices!'}<br><br>
                <div class="game-score">Matches: ${gameState.gameData.userScore}/${gameState.gameData.currentQ + 1}</div>
            `);
            
            gameState.gameData.currentQ++;
            
            if (gameState.gameData.currentQ >= gameState.gameData.questions.length) {
                const percentage = Math.round((gameState.gameData.userScore / gameState.gameData.questions.length) * 100);
                appendGameAdminMessage(`
                    <strong>🏆 GAME COMPLETE!</strong><br>
                    We matched on ${gameState.gameData.userScore}/${gameState.gameData.questions.length} questions (${percentage}%)<br>
                    ${percentage >= 80 ? '💕 We\'re so compatible!' : percentage >= 50 ? '😊 Pretty good match!' : '🤷 Opposites attract!'}<br>
                    <strong>Want to play again?</strong>
                `);
                endGame();
            } else {
                setTimeout(() => {
                    const nextQ = gameState.gameData.questions[gameState.gameData.currentQ];
                    appendGameAdminMessage(`
                        <div class="game-score">Round ${gameState.gameData.currentQ + 1}/${gameState.gameData.questions.length}</div>
                        <strong>Would you rather:</strong><br>
                        <strong>A)</strong> ${nextQ.a}<br>
                        <strong>B)</strong> ${nextQ.b}<br><br>
                        <strong>Type 'A' or 'B' to choose!</strong>
                    `);
                }, 1500);
            }
        } else {
            appendGameAdminMessage(`
                <strong>❓ Please choose A or B!</strong><br>
                <strong>A)</strong> ${currentQ.a}<br>
                <strong>B)</strong> ${currentQ.b}
            `);
        }
        
        return true;
    }

    function processSongGuess(message, originalMessage) {
        const currentSong = gameState.gameData.songs[gameState.gameData.currentSong];
        const userGuess = message.toLowerCase();
        
        if (message === 'skip') {
            appendGameAdminMessage(`
                <strong>⏭️ SKIPPED!</strong><br>
                The song was: <strong>"${currentSong.answer}"</strong> by ${currentSong.artist}<br>
            `);
        } else if (userGuess.includes(currentSong.answer) || currentSong.answer.includes(userGuess)) {
            gameState.gameData.score += 10;
            appendGameAdminMessage(`
                <strong>🎵 CORRECT!</strong><br>
                Yes! It's <strong>"${currentSong.answer}"</strong> by ${currentSong.artist}<br>
                <div class="game-score">+10 points! Score: ${gameState.gameData.score}</div>
            `);
        } else {
            appendGameAdminMessage(`
                <strong>❌ Not quite!</strong><br>
                The song was: <strong>"${currentSong.answer}"</strong> by ${currentSong.artist}<br>
                <div class="game-score">Score: ${gameState.gameData.score}</div>
            `);
        }
        
        gameState.gameData.currentSong++;
        
        if (gameState.gameData.currentSong >= gameState.gameData.songs.length) {
            appendGameAdminMessage(`
                <strong>🏆 SONG GAME COMPLETE!</strong><br>
                Final Score: ${gameState.gameData.score} points<br>
                ${gameState.gameData.score >= 20 ? '🌟 Music Master!' : gameState.gameData.score >= 10 ? '🎵 Good ear!' : '📻 Keep listening!'}<br>
                <strong>Want to play again?</strong>
            `);
            endGame();
        } else {
            setTimeout(() => {
                const nextSong = gameState.gameData.songs[gameState.gameData.currentSong];
                appendGameAdminMessage(`
                    <div class="game-score">Score: ${gameState.gameData.score} | Song ${gameState.gameData.currentSong + 1}/${gameState.gameData.songs.length}</div>
                    <strong>Next song lyrics:</strong><br>
                    <em>"${nextSong.lyrics}"</em><br><br>
                    <strong>What song is this?</strong>
                `);
            }, 1500);
        }
        
        return true;
    }

    function processTrivia(message, originalMessage) {
    const currentQ = gameState.gameData.questions[gameState.gameData.currentQ];
    const userAnswer = message.toLowerCase();
    
    let isCorrect = false;
    if (userAnswer === 'a' || userAnswer === 'b' || userAnswer === 'c' || userAnswer === 'd') {
        const optionIndex = userAnswer.charCodeAt(0) - 97; // Convert a,b,c,d to 0,1,2,3
        const selectedAnswer = currentQ.options[optionIndex].toLowerCase();
        isCorrect = selectedAnswer.includes(currentQ.a) || currentQ.a.includes(selectedAnswer);
    } else {
        isCorrect = userAnswer.includes(currentQ.a) || currentQ.a.includes(userAnswer);
    }
    
    if (isCorrect) {
        gameState.gameData.userScore++;
        appendGameAdminMessage(`
            <strong>✅ CORRECT!</strong><br>
            The answer is: ${currentQ.a}<br>
            <div class="game-score">Score: ${gameState.gameData.userScore}/${gameState.gameData.totalQuestions}</div>
        `);
    } else {
        appendGameAdminMessage(`
            <strong>❌ Wrong!</strong><br>
            The correct answer is: ${currentQ.a}<br>
            <div class="game-score">Score: ${gameState.gameData.userScore}/${gameState.gameData.totalQuestions}</div>
        `);
    }
    
    gameState.gameData.currentQ++;
    
    if (gameState.gameData.currentQ >= gameState.gameData.questions.length) {
        const percentage = Math.round((gameState.gameData.userScore / gameState.gameData.totalQuestions) * 100);
        appendGameAdminMessage(`
            <strong>🏆 TRIVIA COMPLETE!</strong><br>
            Final Score: ${gameState.gameData.userScore}/${gameState.gameData.totalQuestions} (${percentage}%)<br>
            ${percentage >= 80 ? '🌟 Excellent!' : percentage >= 60 ? '👍 Good job!' : '📚 Keep studying!'}<br>
            <strong>Want to play again?</strong>
        `);
        endGame();
    } else {
        const nextQ = gameState.gameData.questions[gameState.gameData.currentQ];
        setTimeout(() => {
            appendGameAdminMessage(`
                <strong>Question ${gameState.gameData.currentQ + 1}:</strong> ${nextQ.q}<br>
                <strong>A)</strong> ${nextQ.options[0]}<br>
                <strong>B)</strong> ${nextQ.options[1]}<br>
                <strong>C)</strong> ${nextQ.options[2]}<br>
                <strong>D)</strong> ${nextQ.options[3]}<br>
            `);
        }, 1500);
    }
    
    return true;
}

    // Helper function for 20 questions
    function generateYesNoAnswer(question, answer) {
    const q = question.toLowerCase();
    const a = answer.toLowerCase();
    
    // Simple keyword matching for demo purposes
    if (q.includes('animal') || q.includes('alive') || q.includes('living')) {
        return ['elephant', 'butterfly'].includes(a) ? '✅ YES' : '❌ NO';
    }
    if (q.includes('food') || q.includes('eat')) {
        return a === 'pizza' ? '✅ YES' : '❌ NO';
    }
    if (q.includes('electronic') || q.includes('technology')) {
        return a === 'smartphone' ? '✅ YES' : '❌ NO';
    }
    if (q.includes('big') || q.includes('large')) {
        return ['elephant', 'mountain', 'ocean'].includes(a) ? '✅ YES' : '❌ NO';
    }
    if (q.includes('small')) {
        return ['butterfly', 'smartphone', 'book'].includes(a) ? '✅ YES' : '❌ NO';
    }
    
    // Random yes/no for other questions
    return Math.random() > 0.5 ? '✅ YES' : '❌ NO';
}

    // Game message processing is now integrated into the main sendMessage function above

    function endGame() {
        currentGame = null;
        gameState = {};
        updateGameUI();
        appendGameAdminMessage(`
            <strong>🎮 GAME ENDED</strong><br>
            Thanks for playing! You can start a new game anytime by clicking the Games button.<br>
            <strong>Hope you had fun!</strong>
        `);
    }

    function updateGameUI() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.classList.remove('game-active');
        });
        
        if (currentGame) {
            const activeCard = document.querySelector(`[data-game="${currentGame}"]`);
            if (activeCard) {
                activeCard.classList.add('game-active');
            }
        }
    }
});