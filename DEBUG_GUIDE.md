# 🔍 Debug Guide - Multi-File Generation

## What I See in Your Screenshots

1. ✅ File tree shows `src/components/App.tsx`
2. ✅ Code shows a Button component
3. ❌ Preview is blank/gray

**Diagnosis:** You likely typed `"create a button"` which generates a single file, not `"build a complete spotify app"` which would generate multiple files.

---

## 🧪 **Let's Test Multi-File Generation**

### Step 1: Open Console
Press **F12** → Click **Console** tab

### Step 2: Clear Console
Click the 🚫 icon to clear old logs

### Step 3: Type Exact Prompt
In AI chat, type **exactly:**
```
build a complete spotify app
```

### Step 4: Watch Console Logs
You should see:
```
Generating multi-file Spotify project
Parsed multi-file response: Array(3) [{path: '/src/App.tsx', ...}, ...]
Importing files: Array(3)
Refreshing file system: {fileCount: 3, files: Array(3)}
LivePreview rendering with: {codeLength: xxx, fileCount: 3, files: Array(3)}
```

### Step 5: Check Results
- **File Tree:** Should show App.tsx, Player.tsx, Playlist.tsx
- **Click Player.tsx:** Code should switch to Player component
- **Preview:** Should show music player UI

---

## 🐛 Debugging Checklist

### If Console Shows:
**"Generating multi-file Spotify project"** ✅
- Multi-file template is being used

**"Parsed multi-file response: null"** ❌
- Parser isn't detecting file markers
- Need to fix regex pattern

**"Parsed multi-file response: Array(1)"** ❌
- Only finding one file
- Need to check file markers format

**"Parsed multi-file response: Array(3)"** ✅
- Parser found all files!

**"Importing files: Array(3)"** ✅
- Files are being imported to VFS

**"Refreshing file system: {fileCount: 3}"** ✅
- VFS has the files

**"LivePreview rendering with: {fileCount: 3}"** ✅
- Preview has all files

---

## 🎯 Test Prompts

Try these specific prompts and tell me what console shows:

### Test 1:
**Prompt:** `build a complete spotify app`
**Expected:** 3 files (App, Player, Playlist)

### Test 2:
**Prompt:** `create a full dashboard application`
**Expected:** Multiple files with components

### Test 3:
**Prompt:** `build an entire landing page`
**Expected:** Multiple sections as separate files

### Test 4:
**Prompt:** `create a button`
**Expected:** Single file only (correct behavior)

---

## 📊 What Each Log Means

| Log Message | Meaning | Good/Bad |
|-------------|---------|----------|
| "Generating multi-file..." | Mock AI triggered multi-file template | ✅ Good |
| "Parsed multi-file: Array(3)" | Parser found 3 files | ✅ Good |
| "Parsed multi-file: null" | Parser found no file markers | ❌ Need to fix |
| "Importing files: Array(3)" | VFS importing 3 files | ✅ Good |
| "fileCount: 3" | VFS has 3 files stored | ✅ Good |
| "LivePreview rendering: {fileCount: 3}" | Preview has all files | ✅ Good |

---

## 🔧 Next Steps

**Please try this NOW:**

1. **Refresh browser**
2. **Open console (F12)**
3. **Enter room**
4. **Click AI tab**
5. **Type:** `build a complete spotify app`
6. **Press Enter**
7. **Copy all console logs** and send them to me

I'll use the logs to see exactly what's happening and fix any remaining issues!

---

## 💡 Quick Fixes

### If files don't appear:
- Check console logs
- Verify "Importing files" appears
- Check fileCount in logs

### If preview is blank:
- Check console for preview errors
- Look for "LivePreview rendering" log
- Check if HTML is being generated

### If code doesn't switch:
- Verify file is in VFS
- Check activeTab value
- Verify currentCode updates

**Send me the console logs and I'll fix it!** 🔍

