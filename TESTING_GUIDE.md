# 🧪 Testing Guide - Prove the App Actually Works!

## ✅ Complete Functional Test

Follow these steps to verify **everything actually works**:

---

## 🎯 Test 1: AI Code Generation + Live Preview

### Steps:
1. Open http://localhost:5173
2. Click "Start with Mock AI" 
3. Spin the wheel
4. Wait for the Room to load

### In the Room:
1. **Click the "AI" tab** in the right sidebar (next to Preview)
2. Type in the chat: **"Create a button component"**
3. Press Enter

### ✅ Expected Result:
- AI responds in ~1 second
- You see explanation + code block in the chat
- **"AI code inserted!" notification appears** (green banner)
- **Monaco Editor updates** with new code (you'll see it change)
- **Switch to "Preview" tab**
- **You'll see a working button with gradient!**
- **Click the button in preview** - counter increases!

**This proves:** AI → Editor → Preview chain works! ✅

---

## 🎯 Test 2: Monaco Editor (VS Code Features)

### Steps:
1. In Monaco Editor, start typing: `use`
2. **IntelliSense popup appears** with suggestions
3. Select `useState` from the list (or press Tab)
4. **Auto-completion works!** ✅

### Try Multi-Cursor:
1. Select the word `count` in the code
2. Press `Ctrl+D` twice
3. **Multiple cursors appear** on all instances
4. Start typing - all instances change at once!
5. **Multi-cursor works!** ✅

### Try Line Moving:
1. Place cursor on a line
2. Press `Alt+↑` 
3. **Line moves up!** ✅

---

## 🎯 Test 3: Real-Time Preview Updates

### Steps:
1. In Monaco Editor, find the line with `#FF6A00` (orange color)
2. Change it to `#00FF00` (green)
3. **Preview immediately updates** to green button!

### Try More:
1. Change the text: `Clicked {count} times!` → `Clicks: {count}`
2. **Preview updates instantly!**
3. Change `fontSize: '1rem'` → `fontSize: '2rem'`
4. **Button gets bigger in preview!**

**This proves:** Live preview works! ✅

---

## 🎯 Test 4: Different AI Prompts

Try these one by one:

### A. Card Gallery
**Prompt:** `Create a card gallery`

**Expected:**
- 3 cards appear in grid
- Hover over cards → they lift up
- Fully styled with gradients
- **Interactive in preview!** ✅

### B. Todo List  
**Prompt:** `Create a todo list`

**Expected:**
- Input field and todos appear
- Type in input field in preview
- Click "Add" button
- **New todo appears!**
- Click todos to check them off
- **Fully functional!** ✅

### C. Gradient Switcher
**Prompt:** `Add gradient backgrounds`

**Expected:**
- 4 gradient style buttons appear
- Click different style buttons
- **Background changes!**
- Smooth transitions
- **Interactive!** ✅

---

## 🎯 Test 5: Code Editing in Monaco

### Steps:
1. After AI generates code, edit it:
2. Change a color value
3. Change text content
4. Add a new element
5. **IntelliSense helps you** with suggestions
6. **Preview updates in real-time**

**This proves:** Monaco + Preview integration works! ✅

---

## 🎯 Test 6: Real AI (Optional)

### If you want to test with real AI:

1. Click **Settings** (⚙️) in top nav
2. Select **OpenAI**
3. Choose **gpt-3.5-turbo** (cheapest for testing)
4. Paste your API key
5. Click **Save Settings**

### Now try:
**Prompt:** `Create a beautiful landing page with hero section`

**Expected:**
- Real AI generates **much more sophisticated code**
- Better context awareness
- More creative solutions
- **Still auto-inserts and previews!** ✅

---

## 📊 Verification Checklist

Test each item:

- [ ] AI chat responds to prompts
- [ ] Code appears in Monaco Editor
- [ ] "AI code inserted!" notification shows
- [ ] Preview panel shows the rendered app
- [ ] You can interact with the app in preview (click buttons, etc.)
- [ ] Monaco IntelliSense works (type `use` and see suggestions)
- [ ] Multi-cursor works (`Ctrl+D`)
- [ ] Editing code updates preview in real-time
- [ ] Different AI prompts generate different apps
- [ ] Settings modal opens and saves configuration
- [ ] Header stays visible when switching tabs ✅

---

## 🚨 Common Issues & Fixes

### "Code isn't appearing in editor"
- **Solution:** Make sure you clicked the AI tab (not Preview)
- After AI responds, switch to Preview to see the result

### "Preview is blank"
- **Solution:** Code might have syntax error
- Check browser console (F12) for errors
- Try: "Create a button component" (known working prompt)

### "IntelliSense not showing"
- **Solution:** Wait 2-3 seconds after typing
- Or manually trigger with `Ctrl+Space`

### "AI generates code but preview doesn't update"
- **Solution:** The code auto-inserts into editor
- Switch to **Preview tab** to see the result
- Preview updates automatically when you switch

---

## 🎮 Success Criteria

If you can do ALL of these, the app is fully functional:

1. ✅ Ask AI to create a button → see working button in preview → click it
2. ✅ Ask AI for a card → see animated cards → hover over them  
3. ✅ Edit code in Monaco → see preview update
4. ✅ Use IntelliSense → get code suggestions
5. ✅ Use multi-cursor → edit multiple locations at once
6. ✅ Switch AI ↔ Preview tabs → header stays visible

**All 6 work?** → **App is 100% functional!** 🚀

---

## 💡 Pro Tip

The best way to build:
1. Ask AI for the initial structure
2. Edit in Monaco with IntelliSense
3. See changes in real-time preview
4. Iterate with AI: "Add X feature"
5. Rinse and repeat!

**You're now building real apps with AI assistance!** ✨

