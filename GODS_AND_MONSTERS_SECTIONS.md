# The Gods & Monsters - Section Discovery Guide

## 🔍 Sections Found

From your publication at [thegodsandmonsters.substack.com](https://thegodsandmonsters.substack.com/), I discovered these sections:

1. **Weird Jobs of History** 🤢
2. **Journey to the East** 🐉
3. **Myths of the Ancients** ⚡️
4. **Medieval Tales** 🏰
5. **The Monster Manual** 🐺
6. **Viking Myths & Legends** ❄️
7. **Curious Histories** 🔎
8. **Beyond the Grave** 💀

## 📋 How to Get Section IDs

### Method 1: Manual Discovery (Most Reliable)

1. **Go to Settings**:
   - Navigate to https://thegodsandmonsters.substack.com/publish/settings

2. **Click on "Sections" in the left sidebar**

3. **Click on each section**:
   - Click "Weird Jobs of History 🤢"
   - Look at the URL: It will show `/settings/sections/{ID}`
   - Example: `/settings/sections/123456`
   - Write down: `123456`

4. **Repeat for all sections**

5. **Fill in the template below**

### Method 2: From Draft Post

1. Create a new draft post
2. In the post settings, look for "Section" dropdown
3. Click on each section
4. Open Chrome DevTools → Network tab
5. Look for API calls that include `section_id`

## 📝 Section Mapping Template

Once you have the IDs, fill this in:

```json
{
  "sections": {
    "Weird Jobs of History": {
      "id": null,
      "emoji": "🤢",
      "description": "Strange and unusual occupations throughout history"
    },
    "Journey to the East": {
      "id": null,
      "emoji": "🐉",
      "description": "Asian mythology and legends"
    },
    "Myths of the Ancients": {
      "id": null,
      "emoji": "⚡️",
      "description": "Greek, Roman, and ancient mythologies"
    },
    "Medieval Tales": {
      "id": null,
      "emoji": "🏰",
      "description": "Stories from the Middle Ages"
    },
    "The Monster Manual": {
      "id": null,
      "emoji": "🐺",
      "description": "Creatures and monsters from various mythologies"
    },
    "Viking Myths & Legends": {
      "id": null,
      "emoji": "❄️",
      "description": "Norse mythology and Viking tales"
    },
    "Curious Histories": {
      "id": null,
      "emoji": "🔎",
      "description": "Unusual and fascinating historical events"
    },
    "Beyond the Grave": {
      "id": null,
      "emoji": "💀",
      "description": "Death rituals, afterlife beliefs, and related topics"
    }
  }
}
```

## 🤖 AI Integration Guide

Once you have the section IDs, your AI can use this mapping:

### For n8n Workflow

```javascript
const { SubstackClient } = require('@b992/substack-api');

// Section mapping for The Gods & Monsters
const sections = {
  "Weird Jobs of History": 123456,  // Replace with actual ID
  "Journey to the East": 123457,     // Replace with actual ID
  "Myths of the Ancients": 123458,   // Replace with actual ID
  "Medieval Tales": 123459,          // Replace with actual ID
  "The Monster Manual": 123460,      // Replace with actual ID
  "Viking Myths & Legends": 123461,  // Replace with actual ID
  "Curious Histories": 123462,       // Replace with actual ID
  "Beyond the Grave": 123463         // Replace with actual ID
};

// Get input from AI
const inputData = $input.first().json;

// AI should provide section name or we can match by content
const sectionName = inputData.sectionName || categorizeBContent(inputData.title, inputData.content);

// Get section ID
const sectionId = sections[sectionName];

if (!sectionId) {
  throw new Error(`Unknown section: ${sectionName}`);
}

// Publish post
const client = new SubstackClient({
  apiKey: process.env.GODS_API_KEY,
  hostname: 'thegodsandmonsters.substack.com',
  defaultSectionId: sectionId  // Use the mapped ID
});

const profile = await client.ownProfile();
const post = await profile.newPost()
  .setTitle(inputData.title)
  .setBodyHtml(inputData.content)
  .setSection(sectionId)  // Override if needed
  .publish();

return [{ json: { success: true, post, section: sectionName } }];
```

### AI Prompt for Section Selection

Add this to your AI prompt:

```
SECTION ASSIGNMENT RULES:

Analyze the content and assign to ONE of these sections:

1. "Weird Jobs of History" 🤢 - Unusual historical occupations
   Example: Gong farmers, rat catchers, leech collectors

2. "Journey to the East" 🐉 - Asian mythology
   Example: Chinese dragons, Japanese yokai, Hindu gods

3. "Myths of the Ancients" ⚡️ - Greek/Roman/Ancient myths
   Example: Zeus, Apollo, Egyptian gods

4. "Medieval Tales" 🏰 - Middle Ages stories
   Example: Knights, castles, medieval life

5. "The Monster Manual" 🐺 - Creatures and monsters
   Example: Werewolves, vampires, dragons

6. "Viking Myths & Legends" ❄️ - Norse mythology
   Example: Thor, Odin, Valhalla

7. "Curious Histories" 🔎 - Unusual historical facts
   Example: Strange events, weird historical moments

8. "Beyond the Grave" 💀 - Death and afterlife
   Example: Funeral rites, ghost stories, afterlife beliefs

OUTPUT FORMAT:
{
  "title": "...",
  "content": "...",
  "sectionName": "Myths of the Ancients",
  "tags": ["Zeus", "Greek Mythology"]
}
```

## 🎯 Content Categorization Logic

### Automatic Section Assignment

```javascript
function categorizeBContent(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  // Define keywords for each section
  const sectionKeywords = {
    "Weird Jobs of History": [
      'job', 'occupation', 'profession', 'work', 'trade',
      'gong farmer', 'rat catcher', 'leech'
    ],
    "Journey to the East": [
      'asian', 'chinese', 'japanese', 'korean', 'hindu',
      'dragon', 'yokai', 'buddha', 'confucius'
    ],
    "Myths of the Ancients": [
      'greek', 'roman', 'zeus', 'apollo', 'athena',
      'olympus', 'titan', 'ancient greece', 'ancient rome'
    ],
    "Medieval Tales": [
      'medieval', 'middle ages', 'knight', 'castle', 'feudal',
      'crusade', 'plague', 'monastery'
    ],
    "The Monster Manual": [
      'monster', 'creature', 'beast', 'vampire', 'werewolf',
      'dragon', 'demon', 'chimera', 'hydra'
    ],
    "Viking Myths & Legends": [
      'viking', 'norse', 'odin', 'thor', 'loki',
      'valhalla', 'ragnarok', 'norse mythology'
    ],
    "Curious Histories": [
      'strange', 'unusual', 'curious', 'weird history',
      'historical fact', 'bizarre'
    ],
    "Beyond the Grave": [
      'death', 'afterlife', 'grave', 'funeral', 'burial',
      'ghost', 'spirit', 'underworld', 'resurrection'
    ]
  };
  
  // Score each section
  const scores = {};
  for (const [section, keywords] of Object.entries(sectionKeywords)) {
    scores[section] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[section]++;
      }
    }
  }
  
  // Return section with highest score
  const sortedSections = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);
  
  return sortedSections[0][1] > 0 
    ? sortedSections[0][0] 
    : "Curious Histories"; // Default fallback
}
```

## 📊 Example Usage

### Full AI Workflow

```javascript
// Input from AI (ChatGPT, Claude, etc.)
const aiGeneratedContent = {
  title: "Thor: The Thunder God of Norse Mythology",
  content: "<h2>Introduction</h2><p>Thor, son of Odin...</p>",
  tags: ["Norse", "Thor", "Vikings"]
};

// Automatic section assignment
const sectionName = categorizeBContent(
  aiGeneratedContent.title,
  aiGeneratedContent.content
);
// Returns: "Viking Myths & Legends"

// Get section ID
const sectionId = sections[sectionName];
// Returns: 123461 (your actual ID)

// Publish
const post = await profile.newPost()
  .setTitle(aiGeneratedContent.title)
  .setBodyHtml(aiGeneratedContent.content)
  .setTags(aiGeneratedContent.tags)
  .setSection(sectionId)
  .publish();

console.log(`Published to section: ${sectionName}`);
```

## 📝 Next Steps

1. **Get Your Section IDs**:
   - Go to settings manually
   - Write down each ID
   - Fill in the mapping template

2. **Update Your AI Workflow**:
   - Add section mapping object
   - Include categorization logic
   - Update AI prompt with section rules

3. **Test the Integration**:
   - Generate test content
   - Verify automatic categorization
   - Publish to correct sections

## 🚀 Quick Start

After you have the IDs, create this file:

**`sections.json`**:
```json
{
  "Weird Jobs of History": 123456,
  "Journey to the East": 123457,
  "Myths of the Ancients": 123458,
  "Medieval Tales": 123459,
  "The Monster Manual": 123460,
  "Viking Myths & Legends": 123461,
  "Curious Histories": 123462,
  "Beyond the Grave": 123463
}
```

Then in your n8n workflow:
```javascript
const sections = require('./sections.json');
const sectionId = sections[aiSectionName];
```

## 💡 Tips

- **Default Section**: Set "Curious Histories" as default for uncertain content
- **Multi-Category**: If content fits multiple sections, prioritize based on primary subject
- **Emoji in AI**: Your AI can also output the emoji for verification
- **Validation**: Always check that section ID exists before publishing

## 📞 Need Help?

If you're stuck getting the IDs, let me know and I can:
1. Walk you through the manual process step-by-step
2. Help set up the Chrome DevTools method
3. Create a browser automation script

---

**Ready to make your AI-powered mythology publication even smarter!** 🤖⚡️

