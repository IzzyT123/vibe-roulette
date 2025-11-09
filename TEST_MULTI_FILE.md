# 🧪 Testing Multi-File Generation

## Current Status

I've fixed the file switching issues. Here's what should now work:

### ✅ Fixed Issues:
1. **File switching** - CodeEditor now updates when you click different files
2. **Tab clicking** - Clicking tabs loads the correct file content
3. **Active tab tracking** - useEffect watches for tab changes
4. **Toolbar display** - Shows current filename
5. **Console logging** - Debug output to track file creation

---

## 🔍 Debug Steps

### Open Browser Console (F12)

When you ask AI to generate a project, you'll see console logs:

```javascript
Importing files: [
  {path: '/src/App.tsx', content: '...'},  
  {path: '/src/components/Player.tsx', content: '...'},
  {path: '/src/components/Playlist.tsx', content: '...'}
]

Refreshing file system: {
  fileCount: 3,
  files: ['/src/App.tsx', '/src/components/Player.tsx', '/src/components/Playlist.tsx']
}
```

This confirms files are being created.

---

## 🧪 Test Sequence

### Test 1: Single File (Should Work)
1. Ask AI: `create a button`
2. Check console - should show 1 file
3. Preview should show button
4. **Expected:** ✅ Works

### Test 2: File Switching
1. Ask AI: `build a spotify app` (generates multi-file)
2. **Check console** - should show 3 files imported
3. Look at **file tree** (left sidebar)
4. Click on `Player.tsx`
5. **Monaco Editor should switch** to Player code
6. Toolbar should show "Player.tsx"
7. Click back to `App.tsx`
8. Monaco should show App code
9. **Expected:** ✅ Code switches when clicking files

### Test 3: Tab Clicking
1. After files are generated
2. Look at **tabs** (top of editor)
3. Click different tabs
4. Monaco should switch between files
5. **Expected:** ✅ Tabs work

### Test 4: Preview (Current Issue)
1. After generating multi-file project
2. Switch to **Preview tab**
3. Check browser console for errors
4. **Current:** Might not work if imports aren't resolved

---

## 🐛 Known Issues to Debug

### If preview doesn't show:
- Open browser console (F12)
- Look for errors in iframe
- Check if `window.__modules` is defined
- Check if imports are being transformed

### If files don't appear in tree:
- Check console for "Refreshing file system"
- Verify file count > 0
- Check if vfs.getAllFiles() returns data

### If clicking files doesn't switch code:
- Check console when clicking
- Verify activeTab updates
- Check if currentCode updates
- Verify Monaco receives new code

---

## 🔧 What To Check

1. **Open browser console before testing**
2. Ask AI: `build a complete spotify app`
3. **Look for console logs:**
   - "Importing files: [...]"
   - "Refreshing file system: {fileCount: 3, ...}"
4. **Check file tree** - Do you see 3 files?
5. **Click Player.tsx** - Does code switch?
6. **Check Preview tab** - Does it render?

Report back what you see in console!

---

## 💡 Next Steps

Based on what we see in console:
- If files don't import → Fix VFS import
- If files don't appear in tree → Fix tree generation
- If code doesn't switch → Fix the useEffect
- If preview doesn't work → Fix the bundler

**Let's debug together!** 🔍

