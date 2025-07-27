# Implementation Guide for Chatbot GF Enhancements

## Quick Start Implementation Order

### 1. API Key Visibility Toggle (30 minutes)

#### Step 1.1: Update HTML Structure
Add to `index.html` in the API key section:
```html
<div class="api-input-container">
    <input type="password" id="geminiApiKey" placeholder="Gemini API Key" class="api-input">
    <button type="button" class="toggle-visibility" data-target="geminiApiKey">
        <span class="eye-icon">👁️</span>
    </button>
</div>
<div class="api-input-container">
    <input type="password" id="grokApiKey" placeholder="Grok API Key" class="api-input">
    <button type="button" class="toggle-visibility" data-target="grokApiKey">
        <span class="eye-icon">👁️</span>
    </button>
</div>
```

#### Step 1.2: Add CSS Styles
Add to `styles.css`:
```css
.api-input-container {
    position: relative;
    display: inline-block;
}

.toggle-visibility {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
}

.toggle-visibility:hover {
    opacity: 0.7;
}
```

#### Step 1.3: Add JavaScript Functionality
Add to `app.js` in the DOMContentLoaded section:
```javascript
// API Key Visibility Toggle
document.querySelectorAll('.toggle-visibility').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const eyeIcon = this.querySelector('.eye-icon');
        
        if (input.type === 'password') {
            input.type = 'text';
            eyeIcon.textContent = '🙈';
        } else {
            input.type = 'password';
            eyeIcon.textContent = '👁️';
        }
    });
});

// Show last 4 digits when hidden
function maskApiKey(key) {
    if (!key || key.length < 4) return key;
    return '•'.repeat(key.length - 4) + key.slice(-4);
}
```

### 2. Enhanced API Key Storage (45 minutes)

#### Step 2.1: Extend Server.py
Add to `server.py`:
```python
import hashlib
from cryptography.fernet import Fernet
import base64

class APIKeyManager:
    def __init__(self):
        self.key = self._get_or_create_key()
        self.cipher = Fernet(self.key)
    
    def _get_or_create_key(self):
        key_file = 'encryption.key'
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
    
    def encrypt_key(self, api_key):
        return self.cipher.encrypt(api_key.encode()).decode()
    
    def decrypt_key(self, encrypted_key):
        return self.cipher.decrypt(encrypted_key.encode()).decode()

# Add to ProgressHandler class
def do_POST(self):
    if self.path == '/save-api-keys':
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        user_id = data.get('userId')
        api_keys = data.get('apiKeys')
        
        if user_id and api_keys:
            key_manager = APIKeyManager()
            encrypted_keys = {}
            for provider, key in api_keys.items():
                if key:
                    encrypted_keys[provider] = key_manager.encrypt_key(key)
            
            keys_file = f'data/keys_{user_id}.json'
            with open(keys_file, 'w') as f:
                json.dump(encrypted_keys, f)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode())
            return
```

#### Step 2.2: Update Frontend API Key Management
Modify `saveApiKeys()` function in `app.js`:
```javascript
function saveApiKeys() {
    const geminiKey = document.getElementById('geminiApiKey').value.trim();
    const grokKey = document.getElementById('grokApiKey').value.trim();
    const provider = document.getElementById('apiProvider').value;
    
    if (geminiKey || grokKey) {
        // Save to localStorage (immediate)
        if (geminiKey) localStorage.setItem('geminiApiKey', geminiKey);
        if (grokKey) localStorage.setItem('grokApiKey', grokKey);
        localStorage.setItem('apiProvider', provider);
        
        // Save to server (persistent)
        const userId = generateUserId(); // Create unique user ID
        fetch('http://localhost:3000/save-api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                apiKeys: {
                    gemini: geminiKey,
                    grok: grokKey
                }
            })
        }).catch(error => console.error('Error saving API keys:', error));
        
        geminiApiKey = geminiKey;
        grokApiKey = grokKey;
        apiProvider = provider;
        
        const currentApiKey = provider === 'gemini' ? geminiKey : grokKey;
        loadUserProgress(currentApiKey);
        apiKeyModal.style.display = 'none';
    } else {
        alert('Please enter at least one valid API key.');
    }
}

function generateUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}
```

### 3. Game State Persistence (60 minutes)

#### Step 3.1: Extend Game State Structure
Add to `app.js` after game variables:
```javascript
// Enhanced game state management
let gameState = {
    currentGame: null,
    gameData: {},
    gameHistory: [],
    isActive: false,
    lastSaved: null
};

// Save game state
function saveGameState() {
    if (gameState.isActive) {
        gameState.lastSaved = Date.now();
        localStorage.setItem('gameState', JSON.stringify(gameState));
        
        // Also save to server with user progress
        const currentApiKey = apiProvider === 'gemini' ? geminiApiKey : grokApiKey;
        if (currentApiKey) {
            const progress = {
                personality,
                companionGender,
                attraction,
                chatHistory,
                gameState, // Add game state to progress
                profilePictureURL: localStorage.getItem('profilePictureURL')
            };
            
            fetch('http://localhost:3000/save-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: currentApiKey, progress })
            }).catch(error => console.error('Error saving progress:', error));
        }
    }
}

// Load game state
function loadGameState() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            if (gameState.isActive && gameState.currentGame) {
                // Resume the game
                resumeGame(gameState.currentGame);
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            gameState = { currentGame: null, gameData: {}, gameHistory: [], isActive: false, lastSaved: null };
        }
    }
}

// Resume game function
function resumeGame(gameName) {
    currentGame = gameName;
    updateGameUI();
    appendGameAdminMessage(`Resuming ${gameName}...`);
    
    // Game-specific resume logic
    if (gameState.gameData[gameName]) {
        const data = gameState.gameData[gameName];
        switch (gameName) {
            case '20questions':
                if (data.currentQuestion) {
                    appendGameAdminMessage(`Current question: ${data.currentQuestion}`);
                }
                break;
            case 'trivia':
                if (data.score !== undefined) {
                    appendGameAdminMessage(`Your current score: ${data.score}`);
                }
                break;
            // Add other games...
        }
    }
}
```

#### Step 3.2: Modify Game Processors
Update each game processor to save state. Example for `process20Questions`:
```javascript
function process20Questions(message) {
    if (!gameState.gameData['20questions']) {
        gameState.gameData['20questions'] = {
            questionsAsked: 0,
            currentQuestion: null,
            gameStarted: false
        };
    }
    
    const data = gameState.gameData['20questions'];
    
    if (message.toLowerCase().includes('start') && !data.gameStarted) {
        data.gameStarted = true;
        data.questionsAsked = 0;
        appendGameAdminMessage("Great! Think of something and I'll try to guess it in 20 questions. Ready?");
        saveGameState(); // Save after state change
        return;
    }
    
    if (data.gameStarted && data.questionsAsked < 20) {
        data.questionsAsked++;
        const questions = [
            "Is it alive?",
            "Is it bigger than a breadbox?",
            "Can you hold it in your hand?",
            "Is it made by humans?",
            "Do you use it daily?"
        ];
        
        if (data.questionsAsked <= questions.length) {
            data.currentQuestion = questions[data.questionsAsked - 1];
            appendGameAdminMessage(`Question ${data.questionsAsked}: ${data.currentQuestion}`);
        } else {
            appendGameAdminMessage(`Question ${data.questionsAsked}: Is it something you'd find in a house?`);
        }
        
        saveGameState(); // Save after each question
    }
    
    if (data.questionsAsked >= 20) {
        appendGameAdminMessage("I give up! What were you thinking of?");
        endGame();
    }
}
```

### 4. AI Game Context Integration (90 minutes)

#### Step 4.1: Create Game Context System
Add to `app.js`:
```javascript
// Game context for AI
function getGameContext() {
    if (!gameState.isActive || !gameState.currentGame) {
        return '';
    }
    
    const gameName = gameState.currentGame;
    const data = gameState.gameData[gameName] || {};
    
    let context = `\n\n[GAME CONTEXT]\n`;
    context += `Currently playing: ${gameName}\n`;
    context += `Game rules: ${getGameRules(gameName)}\n`;
    context += `Game state: ${JSON.stringify(data)}\n`;
    context += `You should respond as the AI girlfriend while actively participating in this game.\n`;
    context += `[END GAME CONTEXT]\n\n`;
    
    return context;
}

function getGameRules(gameName) {
    const rules = {
        '20questions': 'The AI asks yes/no questions to guess what the user is thinking of. Maximum 20 questions.',
        'trivia': 'The AI asks trivia questions and keeps score. User answers and AI provides feedback.',
        'storybuilding': 'AI and user take turns adding sentences to build a collaborative story.',
        'wordassociation': 'Players say words that relate to the previous word. Keep the chain going.',
        'wouldyourather': 'AI presents "would you rather" scenarios and discusses the user\'s choices.',
        'songguess': 'AI gives clues about songs and the user tries to guess the title and artist.'
    };
    return rules[gameName] || 'Unknown game rules.';
}
```

#### Step 4.2: Modify API Functions
Update `sendToGeminiAPI` and `sendToGrokAPI` to include game context:
```javascript
async function sendToGeminiAPI(message, apiKey) {
    let systemPrompt = basePrompts[personality]?.[attraction.level] || '';
    if (systemPrompt) {
        systemPrompt = systemPrompt.replace('AI companion', companionGender === 'female' ? 'AI girlfriend' : 'AI boyfriend');
    }
    
    // Add game context to system prompt
    const gameContext = getGameContext();
    if (gameContext) {
        systemPrompt += gameContext;
    }
    
    const contents = [...chatHistory, { role: 'user', parts: [{ text: message }] }];
    
    // Rest of the function remains the same...
}

async function sendToGrokAPI(message, apiKey) {
    let systemPrompt = basePrompts[personality]?.[attraction.level] || '';
    if (systemPrompt) {
        systemPrompt = systemPrompt.replace('AI companion', companionGender === 'female' ? 'AI girlfriend' : 'AI boyfriend');
    }
    
    // Add game context to system prompt
    const gameContext = getGameContext();
    if (gameContext) {
        systemPrompt += gameContext;
    }
    
    // Rest of the function remains the same...
}
```

### 5. Integration Steps

#### Step 5.1: Update Initialization
Modify the DOMContentLoaded event listener:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization...
    
    // Load game state
    loadGameState();
    
    // Add API key visibility toggles
    setupApiKeyToggles();
    
    // Auto-save game state every 30 seconds
    setInterval(saveGameState, 30000);
});
```

#### Step 5.2: Update Game Start/End Functions
```javascript
function startGame(gameName) {
    currentGame = gameName;
    gameState.currentGame = gameName;
    gameState.isActive = true;
    gameState.gameData[gameName] = gameState.gameData[gameName] || {};
    
    hideGamesModal();
    updateGameUI();
    
    if (gameInitializers[gameName]) {
        gameInitializers[gameName]();
    }
    
    saveGameState(); // Save when starting
}

function endGame() {
    if (currentGame) {
        appendGameAdminMessage(`Thanks for playing ${currentGame}! 🎮`);
        
        // Archive the game
        if (!gameState.gameHistory) gameState.gameHistory = [];
        gameState.gameHistory.push({
            game: currentGame,
            data: gameState.gameData[currentGame],
            endTime: Date.now()
        });
        
        currentGame = null;
        gameState.currentGame = null;
        gameState.isActive = false;
        
        updateGameUI();
        saveGameState(); // Save when ending
    }
}
```

## Testing Checklist

### API Key Management
- [ ] Toggle visibility works for both API key fields
- [ ] Keys are saved to localStorage immediately
- [ ] Keys are encrypted and saved to server
- [ ] Keys auto-populate on page reload
- [ ] Last 4 digits show when masked

### Game State Persistence
- [ ] Game state saves automatically during gameplay
- [ ] Games resume correctly after page refresh
- [ ] Game history is preserved
- [ ] Multiple games can be saved/resumed

### AI Integration
- [ ] AI receives game context in prompts
- [ ] AI responds appropriately to game situations
- [ ] Game rules are understood by AI
- [ ] AI participates actively in games

## Deployment Notes

1. Install required Python packages:
   ```bash
   pip install cryptography
   ```

2. Restart both servers after implementing changes

3. Test in incognito mode to verify fresh user experience

4. Monitor console for any JavaScript errors

5. Check server logs for API key encryption/decryption issues

This implementation guide provides step-by-step instructions to implement all requested features systematically.