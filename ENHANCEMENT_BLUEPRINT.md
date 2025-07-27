# Chatbot GF Enhancement Blueprint

## Overview
This document outlines planned enhancements to improve user experience, API key management, and game integration with the AI companion.

## 1. API Key Management Improvements

### 1.1 Visibility Toggle
- **Feature**: Add eye icon button next to API key input fields
- **Functionality**: Toggle between password (hidden) and text (visible) input types
- **Implementation**: 
  - Add toggle buttons in `index.html` next to each API key input
  - JavaScript function to switch input type between 'password' and 'text'
  - Show last 4 digits when hidden (e.g., "••••••••1234")

### 1.2 Persistent API Key Storage
- **Current**: Keys stored in localStorage (browser-specific)
- **Enhancement**: Server-side encrypted storage
- **Implementation**:
  - Extend `server.py` to handle encrypted API key storage
  - Use user-specific identifiers (hashed) for key retrieval
  - Add encryption/decryption functions for security
  - Auto-populate fields on page load if keys exist

## 2. Interactive AI-Integrated Games

### 2.1 AI Context Integration
- **Feature**: Feed game rules and state to AI companion
- **Implementation**:
  - Modify `basePrompts` to include current game context
  - Add game-specific system prompts for each game type
  - Update `sendToGeminiAPI` and `sendToGrokAPI` to include game state in context

### 2.2 Enhanced Game Interaction
- **Current**: Basic game processors with limited AI interaction
- **Enhancement**: Full AI participation in games
- **Implementation**:
  - Modify each game processor to send game state to AI
  - AI responds with game-appropriate reactions and moves
  - Add AI decision-making for games like 20 Questions, Trivia, etc.

### 2.3 Game State Context System
```javascript
// Example structure for game context
const gameContext = {
  activeGame: 'trivia',
  gameRules: 'The AI asks trivia questions...',
  currentState: {
    question: 'What is the capital of France?',
    score: 5,
    round: 3
  },
  gameHistory: [...]
};
```

## 3. Game State Persistence

### 3.1 Save Game State with Chat History
- **Feature**: Games resume exactly where left off after refresh
- **Implementation**:
  - Extend `saveUserProgress` to include `gameState` and `currentGame`
  - Modify `loadUserProgress` to restore game state
  - Add game state to localStorage backup

### 3.2 Game History Integration
- **Feature**: Game interactions saved as part of chat history
- **Implementation**:
  - Modify `appendGameAdminMessage` to save to chatHistory
  - Add game message type identifier
  - Ensure game messages display correctly on page reload

## 4. Implementation Plan

### Phase 1: API Key Management (Priority: High)
1. Add visibility toggle buttons to `index.html`
2. Implement toggle functionality in `app.js`
3. Add server-side encrypted storage to `server.py`
4. Update key loading/saving functions

### Phase 2: Game State Persistence (Priority: High)
1. Extend progress saving to include game state
2. Modify game initialization to check for existing state
3. Update all game processors to save state changes
4. Test game continuity across refreshes

### Phase 3: AI Game Integration (Priority: Medium)
1. Create game-specific AI prompts
2. Modify API functions to include game context
3. Update game processors for AI interaction
4. Add AI decision-making logic for each game

### Phase 4: Enhanced Game Features (Priority: Low)
1. Add more interactive game types
2. Implement multiplayer-style games with AI
3. Add game statistics and achievements
4. Create game replay functionality

## 5. Technical Considerations

### 5.1 Security
- API keys must be encrypted before server storage
- Use secure key derivation for encryption keys
- Implement proper session management

### 5.2 Performance
- Game state should be lightweight for frequent saves
- Implement debounced saving to avoid excessive API calls
- Consider compression for large game histories

### 5.3 User Experience
- Smooth transitions between game and chat modes
- Clear visual indicators for game state
- Intuitive game controls and feedback

## 6. File Modifications Required

### Frontend (`app.js`)
- Add API key visibility toggle functions
- Extend game state management
- Modify API functions for game context
- Update progress saving/loading

### Backend (`server.py`)
- Add encrypted API key storage endpoints
- Extend progress data structure
- Add game state persistence

### UI (`index.html`, `styles.css`)
- Add toggle buttons for API keys
- Enhance game UI elements
- Add game state indicators

## 7. Testing Strategy

### 7.1 API Key Management
- Test visibility toggle functionality
- Verify encrypted storage and retrieval
- Test auto-population on page load

### 7.2 Game Persistence
- Test game state saving across refreshes
- Verify game history integration
- Test multiple concurrent games

### 7.3 AI Integration
- Test AI responses to game context
- Verify game rule understanding
- Test AI decision-making in games

## 8. Future Enhancements

- Voice integration for games
- Visual game elements (cards, boards)
- Social features (sharing game results)
- Advanced AI personalities for different game types
- Mobile-responsive game interfaces

This blueprint provides a comprehensive roadmap for enhancing the chatbot application with improved API management, persistent gaming, and deeper AI integration.