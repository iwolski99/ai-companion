# Git Repository Setup Guide for AI GF Chatbot

## Prerequisites
- Git installed on your system
- GitHub account (or other Git hosting service)
- Command line access

## Step 1: Create .gitignore File

First, create a `.gitignore` file to exclude sensitive and unnecessary files:

```gitignore
# API Keys and Sensitive Data
api_key.json
.env
encryption.key

# User Data
data/
chat_history.json

# Python Cache
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Node.js (if using npm)
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json

# IDE Files
.vscode/
.idea/
*.swp
*.swo
*~

# OS Files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
*.log
error_log.txt

# Temporary Files
*.tmp
*.temp

# Media Files (optional - include if you want to track them)
# *.mp3
# *.wav
# *.png
# *.jpg
# *.jpeg
```

## Step 2: Initialize Git Repository

Open terminal/command prompt in the Chatbot GF directory:

```bash
cd "i:\Trae AI Games\Chatbot GF"
git init
```

## Step 3: Create README.md

Create a comprehensive README file:

```markdown
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

## Development

### Planned Features
See `ENHANCEMENT_BLUEPRINT.md` for upcoming features including:
- Enhanced API key management
- Game state persistence
- Deeper AI-game integration

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security Notes

- API keys are stored locally and encrypted on the server
- No personal data is transmitted to external services except AI APIs
- User progress is stored locally on your machine

## License

This project is for educational and personal use.

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Verify both servers are running
3. Ensure API keys are valid and have sufficient quota
```

## Step 4: Add Files to Git

```bash
# Add the .gitignore first
git add .gitignore

# Add all other files
git add .

# Check what will be committed
git status
```

## Step 5: Make Initial Commit

```bash
git commit -m "Initial commit: AI Girlfriend Chatbot with games and personality system"
```

## Step 6: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name it (e.g., "ai-girlfriend-chatbot")
4. Choose public or private
5. **Don't** initialize with README (you already have one)
6. Click "Create repository"

## Step 7: Connect Local Repository to GitHub

```bash
# Add remote origin (replace with your actual repository URL)
git remote add origin https://github.com/yourusername/ai-girlfriend-chatbot.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 8: Verify Upload

1. Refresh your GitHub repository page
2. Verify all files are present
3. Check that sensitive files (API keys, user data) are NOT uploaded

## Important Security Reminders

### ⚠️ NEVER COMMIT THESE FILES:
- `api_key.json`
- `.env` files
- `data/` folder contents
- `encryption.key`
- Any files containing API keys or user data

### Before Pushing:
1. Double-check `.gitignore` is working
2. Run `git status` to see what will be committed
3. Remove any accidentally added sensitive files:
   ```bash
   git rm --cached filename
   ```

## Future Updates

To push updates:
```bash
git add .
git commit -m "Description of changes"
git push
```

## Collaboration

If working with others:
1. Create feature branches for new features
2. Use pull requests for code review
3. Keep the main branch stable
4. Document changes in commit messages

## Backup Strategy

1. Repository serves as code backup
2. User data (`data/` folder) should be backed up separately
3. API keys should be stored securely (password manager)

This guide ensures your AI GF chatbot is properly version-controlled while maintaining security and privacy.