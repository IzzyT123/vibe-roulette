# Vibe Roulette - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## First Time Setup

When you first launch Vibe Roulette, you'll see a welcome screen with two options:

### Option 1: Mock AI (Recommended for Testing)
- **Free** - No API key required
- Uses simulated AI responses
- Perfect for testing the interface
- Click "Start with Mock AI"

### Option 2: Real AI (OpenAI or Claude)
- Requires your own API key
- You pay for API usage directly to OpenAI or Anthropic
- Click "Configure Real AI" to set up

## Configuring Real AI

### OpenAI Setup

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. In Vibe Roulette, click the **Settings** button (⚙️) in the top navigation
4. Select "OpenAI" as your provider
5. Choose your model (gpt-4, gpt-4-turbo, or gpt-3.5-turbo)
6. Paste your API key
7. Click "Save Settings"

**Pricing:** https://openai.com/pricing
- GPT-4 Turbo: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- GPT-3.5 Turbo: ~$0.0005 per 1K input tokens, ~$0.0015 per 1K output tokens

### Anthropic (Claude) Setup

1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. In Vibe Roulette, click the **Settings** button (⚙️)
4. Select "Anthropic (Claude)" as your provider
5. Choose your model (Claude 3.5 Sonnet, Claude 3 Opus, or Claude 3 Sonnet)
6. Paste your API key
7. Click "Save Settings"

**Pricing:** https://www.anthropic.com/pricing
- Claude 3.5 Sonnet: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- Claude 3 Opus: ~$0.015 per 1K input tokens, ~$0.075 per 1K output tokens

## How API Keys Work

### Security & Privacy

- ✅ **Your API key is stored locally** in your browser's localStorage
- ✅ **Never sent to our servers** - all API calls go directly from your browser to OpenAI/Anthropic
- ✅ **You control the costs** - you're only charged for what you use
- ✅ **Change anytime** - switch between providers or update keys in Settings

### Where to Access Settings

The Settings button (⚙️) is located in:
- **Top navigation bar** when you're in a coding room
- You can change your AI provider and API key at any time

## Testing Your Setup

1. Start a session by clicking the Spin Wheel
2. Wait for matchmaking
3. Once in the room, click the **AI** tab in the right sidebar
4. Try a prompt like: "Create a button component"
5. If using Real AI, verify the response quality matches your provider

## Troubleshooting

### "Invalid API key" error

- Double-check your API key is correct
- Ensure you've enabled billing in your OpenAI/Anthropic account
- Try pasting the key again (no extra spaces)

### AI not responding

- Check your browser console (F12) for errors
- Verify your API key has available credits
- Try switching to Mock AI to test if it's a configuration issue

### CORS errors

- This shouldn't happen as we make direct API calls
- If you see CORS errors, ensure you're using https:// URLs
- Check your browser allows fetch requests to the AI provider

## Costs Estimation

### Typical Session Costs (Real AI)

A 30-minute coding session with moderate AI usage:
- **With GPT-3.5 Turbo:** $0.05 - $0.20
- **With GPT-4 Turbo:** $0.20 - $1.00
- **With Claude 3.5 Sonnet:** $0.10 - $0.50

Costs vary based on:
- How often you use the AI assistant
- Length of code context
- Model chosen

## Switching Between Providers

You can change your AI provider at any time:

1. Click Settings (⚙️) in the top nav
2. Select a different provider
3. Enter the new API key if required
4. Save settings

The change takes effect immediately for your next AI request.

## Development vs Production

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Need Help?

- Click the **Help** button (?) in the top navigation for in-app tips
- Check the console (F12) for error messages
- Review this guide for API setup instructions

---

**Ready to code?** Pull the Spin Lever and get matched with a partner! 🎮✨

