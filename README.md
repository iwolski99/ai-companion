# AI Girlfriend Chatbot

An interactive AI companion application with personality customization, games, and persistent conversations.

## Features

- 🤖 AI-powered conversations using Gemini or Grok APIs
- 🎮 Interactive games (20 Questions, Trivia, Story Building, etc.)
- 💝 Relationship progression system
- 🎨 Personality customization
- 💾 Persistent chat history and user progress
- 🔐 Secure API key management

## Setup Instructions

### Prerequisites
- Python 3.7+
- Web browser
- API key from Google (Gemini) or xAI (Grok)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd chatbot-gf
   ```

2. Install Python dependencies:
   ```bash
   pip install cryptography
   ```

3. Start the backend server:
   ```bash
   python server.py
   ```

4. Start the web server:
   ```bash
   python -m http.server 8000
   ```

5. Open your browser and navigate to `http://localhost:8000`

### Configuration

1. Enter your API keys in the application interface
2. Choose your preferred AI provider (Gemini or Grok)
3. Complete the personality quiz to customize your AI companion

## File Structure

```
chatbot-gf/
├── app.js              # Main application logic
├── index.html          # User interface
├── styles.css          # Styling
├── server.py           # Backend server for data persistence
├── chatbot.py          # Alternative Python GUI version
├── data/               # User progress storage (auto-created)
├── ENHANCEMENT_BLUEPRINT.md  # Future feature plans
├── IMPLEMENTATION_GUIDE.md   # Development guide
└── README.md           # This file
```

## API Keys

### Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Enter the key in the application

### Grok API
1. Visit [xAI Console](https://console.x.ai/)
2. Generate an API key
3. Enter the key in the application

## Games Available

- **20 Questions**: AI tries to guess what you're thinking
- **Trivia**: Test your knowledge with AI-generated questions
- **Story Building**: Collaborate on creative stories
- **Word Association**: Chain-building word game
- **Would You Rather**: Discuss hypothetical scenarios
- **Song Guess**: Guess songs from AI-provided clues
- **Roleplay**: Interactive roleplay scenarios
- **Love Quiz**: Relationship compatibility questions
- **Dream Date**: Plan your ideal date together
- **Movie Guess**: Guess movies from descriptions
- **Quick Fire**: Rapid-fire question rounds
- **Creative**: Creative writing and art challenges
- **Predictions**: Make predictions about various topics
- **Deep Convo**: Deep philosophical discussions

## Development

### Planned Features
See `ENHANCEMENT_BLUEPRINT.md` for upcoming features including:
- Enhanced API key management with visibility toggles
- Game state persistence across sessions
- Deeper AI-game integration
- Encrypted server-side storage

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security Notes

- API keys are stored locally in browser localStorage
- No personal data is transmitted to external services except AI APIs
- User progress is stored locally on your machine
- Sensitive files are excluded via .gitignore

## Troubleshooting

### Common Issues

1. **Messages not sending**: 
   - Check that both servers are running (ports 8000 and 3000)
   - Verify API keys are entered correctly
   - Check browser console for JavaScript errors

2. **Games not working**:
   - Ensure all game initializer functions are defined
   - Check for JavaScript errors in browser console
   - Verify game state is being saved properly

3. **API errors**:
   - Verify API keys have sufficient quota
   - Check network connectivity
   - Ensure API endpoints are accessible

### Server Commands

```bash
# Start backend server (port 3000)
python server.py

# Start web server (port 8000)
python -m http.server 8000

# Both servers must be running simultaneously
```

## License

This project is for educational and personal use.

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Verify both servers are running
3. Ensure API keys are valid and have sufficient quota
4. Review the troubleshooting section above