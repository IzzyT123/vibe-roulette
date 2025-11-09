# Room.tsx Layout Fix - Header Visibility Issue

## Problem Statement

The original implementation had a critical bug where clicking the AI tab in the right sidebar caused the entire top navigation bar (with Help, Anonymous toggle, Deploy buttons, etc.) to disappear.

## Root Cause

The issue was caused by improper z-index stacking and layout hierarchy. When `AnimatePresence` components animated the sidebar panels, they created new stacking contexts that could cover elements with lower or equal z-index values.

## The Fix

### 1. Proper Layout Hierarchy

```typescript
<div className="h-screen flex flex-col">
  {/* Top Bar - ALWAYS VISIBLE */}
  <motion.div style={{ zIndex: 50, position: 'relative' }}>
    {/* Navigation buttons */}
  </motion.div>
  
  {/* Main Content - Takes remaining space */}
  <div className="flex-1 flex overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
    {/* Three-panel layout */}
  </div>
</div>
```

### 2. Critical Changes

#### Top Bar (Lines 125-197 in Room.tsx)
- **`zIndex: 50`** - High z-index ensures it stays above all other content
- **`position: 'relative'`** - Establishes a stacking context independent of child animations
- **`background: 'rgba(15, 10, 31, 0.95)'`** - Slightly transparent with backdrop-filter for depth
- **`backdropFilter: 'blur(10px)'`** - Adds glass effect and ensures visibility

#### Main Content Area (Lines 199-440)
- **`flex-1`** - Takes all remaining vertical space
- **`overflow-hidden`** - Prevents content from pushing header off screen
- **`position: 'relative', zIndex: 1`** - Lower z-index than header, proper stacking

#### Sidebar Panels
- **AnimatePresence** - Animations don't create stacking contexts that interfere with header
- **Contained within main content area** - Can't overflow and cover the header

## Why This Works

1. **Flex Column Layout**: The outer container uses `flex-col` to stack header and content vertically
2. **Z-Index Hierarchy**: Header (z-50) > Main Content (z-1)
3. **Overflow Control**: `overflow-hidden` on main content prevents layout shifts
4. **Independent Stacking Contexts**: Header establishes its own context, isolated from child animations

## Testing the Fix

To verify the fix works:

1. Navigate to the Room page
2. Click between "Preview" and "AI" tabs in the right sidebar
3. Verify the top navigation bar (Help, Anonymous, Deploy) stays visible at all times
4. Test with left sidebar toggle
5. Test with maximizing/minimizing the preview panel

All UI elements should remain visible and properly positioned regardless of sidebar state.

## Key Takeaways

- Always use proper z-index hierarchy for sticky/fixed headers
- Be careful with `AnimatePresence` and motion components creating new stacking contexts
- Use `flex-col` and `flex-1` for proper vertical layout distribution
- Add `overflow-hidden` to prevent content from escaping containers
- Test all interactive states to ensure layout stability

