# Quick Section ID Finder Guide

## 🎯 Fastest Method to Find Section IDs

### Step-by-Step Instructions

1. **Open Chrome DevTools**:
   - Press `F12` or right-click → Inspect
   - Go to the **Network** tab

2. **Navigate to Settings**:
   - Go to: https://thegodsandmonsters.substack.com/publish/settings
   - Wait for the page to load

3. **Open a Section**:
   - In the left sidebar, click on "Sections"
   - Click on any section (e.g., "Viking Myths & Legends ❄️")

4. **Check the URL**:
   - Look at the browser address bar
   - You'll see: `/settings/sections/123456`
   - The number `123456` is your section ID!

5. **Repeat for All Sections**:
   - Click each section
   - Note down each ID

### Alternative: Use Chrome DevTools Network Tab

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Filter** by "Fetch/XHR"
4. **Navigate** to any section in settings
5. **Look for** API calls like `/api/v1/publication/sections`
6. **Click** on the call
7. **View Response** - you'll see all sections with IDs!

## 📋 Section ID Template

Fill this in as you discover IDs:

```javascript
// The Gods & Monsters - Section IDs
export const SECTIONS = {
  WEIRD_JOBS: 0,        // Weird Jobs of History 🤢
  JOURNEY_EAST: 0,      // Journey to the East 🐉
  ANCIENT_MYTHS: 0,     // Myths of the Ancients ⚡️
  MEDIEVAL: 0,          // Medieval Tales 🏰
  MONSTERS: 0,          // The Monster Manual 🐺
  VIKING: 0,            // Viking Myths & Legends ❄️
  CURIOUS: 0,           // Curious Histories 🔎
  BEYOND_GRAVE: 0       // Beyond the Grave 💀
};

// Reverse mapping for AI
export const SECTION_NAMES = {
  [SECTIONS.WEIRD_JOBS]: "Weird Jobs of History",
  [SECTIONS.JOURNEY_EAST]: "Journey to the East",
  [SECTIONS.ANCIENT_MYTHS]: "Myths of the Ancients",
  [SECTIONS.MEDIEVAL]: "Medieval Tales",
  [SECTIONS.MONSTERS]: "The Monster Manual",
  [SECTIONS.VIKING]: "Viking Myths & Legends",
  [SECTIONS.CURIOUS]: "Curious Histories",
  [SECTIONS.BEYOND_GRAVE]: "Beyond the Grave"
};
```

## 🔍 Visual Guide

```
Browser URL Bar:
┌─────────────────────────────────────────────────────────────┐
│ thegodsandmonsters.substack.com/publish/settings/sections/  │
│ 123456  ← THIS IS YOUR SECTION ID!                          │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Checklist

Once you have all IDs, check them off:

- [ ] Weird Jobs of History 🤢 - ID: _______
- [ ] Journey to the East 🐉 - ID: _______
- [ ] Myths of the Ancients ⚡️ - ID: _______
- [ ] Medieval Tales 🏰 - ID: _______
- [ ] The Monster Manual 🐺 - ID: _______
- [ ] Viking Myths & Legends ❄️ - ID: _______
- [ ] Curious Histories 🔎 - ID: _______
- [ ] Beyond the Grave 💀 - ID: _______

## 🚀 Once You Have the IDs

Update your n8n workflow with:

```javascript
const GODS_SECTIONS = {
  "Weird Jobs of History": 123456,  // Your actual IDs
  "Journey to the East": 123457,
  "Myths of the Ancients": 123458,
  "Medieval Tales": 123459,
  "The Monster Manual": 123460,
  "Viking Myths & Legends": 123461,
  "Curious Histories": 123462,
  "Beyond the Grave": 123463
};

// Use in your workflow
const sectionId = GODS_SECTIONS[inputData.sectionName];
```

Easy! 🎉

