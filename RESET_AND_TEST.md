# 🔄 How to Reset and Test API Setup

## 🎯 To See the First-Run Setup Again

You've already dismissed the welcome screen. Here's how to see it again:

### Method 1: Clear Browser Storage (Easy)

1. **Open DevTools:** Press `F12` in your browser
2. **Go to Application tab** (top menu in DevTools)
3. **Click "Local Storage"** in left sidebar
4. **Click** `http://localhost:5173`
5. **Right-click** → "Clear"
6. **Refresh page** (`F5`)
7. 🎉 **Welcome screen appears!**

### Method 2: Delete Specific Keys

In DevTools Console, run:
```javascript
localStorage.removeItem('vibeRouletteSetupComplete');
localStorage.removeItem('vibeRouletteAPIConfig');
location.reload();
```

### Method 3: Use the Button on Landing Page

**Even easier!** I just added a **"Configure AI"** button in the top-right of the landing page!

Just click it anytime to add/change your API key!

---

## ✅ Fixed Issues

### 1. **Preview Error - FIXED!** ✅
- Changed from `contentDocument` to `srcdoc`
- Added proper sandbox permissions
- **Preview now works without CORS errors!**

### 2. **API Key Setup - NOW ACCESSIBLE!** ✅
- First-run setup shows on initial load
- **"Configure AI" button** added to landing page (top-right)
- Settings button (⚙️) in Room top nav
- **Three ways to configure your AI!**

---

## 🚀 Test the Complete Flow

### Test 1: With Mock AI (Free)

1. Clear localStorage (see above)
2. Refresh page
3. **Welcome screen appears**
4. Click **"Start with Mock AI (Free)"**
5. Spin wheel → Enter Room
6. Click **AI tab**
7. Type: `create a button`
8. **See code generate**
9. Click **Preview tab**
10. **Button works! No CORS error!** ✅

### Test 2: Configure Real AI

1. On Landing page, click **"Configure AI"** button (top-right)
2. Select **OpenAI** or **Anthropic**
3. Choose model
4. **Paste your API key**
5. Click **"Save Settings"**
6. Modal closes
7. Now spin wheel → Enter Room
8. Click AI tab
9. Type: `create a beautiful dashboard`
10. **Real AI generates sophisticated code!**
11. **Preview renders it!** ✅

### Test 3: Change AI Settings Anytime

**From Landing Page:**
- Click "Configure AI" button (top-right)

**From Room:**
- Click Settings (⚙️) button in top nav

Both open the same settings modal where you can change:
- Provider (OpenAI/Claude/Mock)
- Model
- API Key

---

## 🎮 Complete User Journey (Fixed)

```
1. User opens app
   ↓
2. First-Run Setup appears (if no config)
   ↓
3. User chooses:
   → "Start with Mock AI" (free, instant)
   OR
   → "Configure Real AI" (enters key now)
   ↓
4. Configuration saved to localStorage
   ↓
5. Landing page appears
   ↓
6. "Configure AI" button shows current status
   ↓
7. User can click button to change settings anytime
   ↓
8. Spin wheel → Room
   ↓
9. AI tab uses saved configuration
   ↓
10. AI generates code
   ↓
11. Code inserts into Monaco
   ↓
12. Preview renders (NO CORS ERROR!)
   ↓
13. Working, interactive app! ✅
```

---

## 🔧 All Access Points for API Configuration

Users can now configure AI from **THREE PLACES**:

1. **First-Run Setup** (automatic on first load)
2. **Landing Page** - "Configure AI" button (top-right)
3. **Room** - Settings (⚙️) button in top nav

**No way to miss it!** 🎯

---

## 🧪 Quick Test Commands

### Reset Everything:
```javascript
// Run in browser console (F12)
localStorage.clear();
location.reload();
```

### Check Current Config:
```javascript
// Run in browser console
console.log(JSON.parse(localStorage.getItem('vibeRouletteAPIConfig')));
```

### Manually Set Mock AI:
```javascript
// Run in browser console
localStorage.setItem('vibeRouletteAPIConfig', JSON.stringify({
  provider: 'mock',
  apiKey: '',
  model: 'mock-gpt'
}));
location.reload();
```

### Manually Set OpenAI:
```javascript
// Run in browser console
localStorage.setItem('vibeRouletteAPIConfig', JSON.stringify({
  provider: 'openai',
  apiKey: 'sk-YOUR-KEY-HERE',
  model: 'gpt-4-turbo'
}));
location.reload();
```

---

## ✅ **Both Issues Are Fixed!**

1. ✅ **Preview CORS Error** - Fixed with `srcdoc` method
2. ✅ **API Key Configuration** - Three ways to access it!

**Refresh your browser and test it!** 🎮✨

