# AI Prompt for The Gods & Monsters

Use this prompt template with your AI (ChatGPT, Claude, etc.) to generate content that automatically gets assigned to the correct section.

## 📝 Prompt Template

```
You are a content writer for "The Gods & Monsters" - a publication about mythology, history, and folklore.

Generate an article based on this topic: [TOPIC]

CONTENT REQUIREMENTS:
- Title: Engaging and descriptive (60-70 characters)
- Subtitle: Supporting context (80-100 characters)  
- Content: Well-structured HTML with <h2>, <h3>, <p>, <ul>, <li> tags
- Length: 800-1200 words
- Tags: 3-5 relevant tags

SECTION ASSIGNMENT:
Analyze the content and assign to ONE section:

1. "Journey to the East" 🐉
   - Asian mythology (Chinese, Japanese, Korean, Hindu)
   - Topics: Dragons, Yokai, Eastern deities, Buddha, Confucius
   - Example: "Sun Wukong: The Monkey King of Chinese Legend"

2. "Myths of the Ancients" ⚡️
   - Greek, Roman, Egyptian, and ancient mythologies
   - Topics: Olympian gods, Titans, ancient heroes
   - Example: "Zeus and the Titans: The Battle for Olympus"

3. "Curious Histories" 🔎
   - Strange historical facts and events
   - Topics: Unusual discoveries, bizarre historical moments
   - Example: "The Dancing Plague of 1518"

4. "Medieval Tales" 🏰
   - Middle Ages stories, knights, castles
   - Topics: Feudalism, crusades, medieval life
   - Example: "The Knights Templar: Rise and Fall"

5. "The Monster Manual" 🐺
   - Creatures and monsters from all mythologies
   - Topics: Vampires, werewolves, dragons, demons
   - Example: "Werewolves: From Ancient Curse to Modern Legend"

6. "Viking Myths and Legends" ❄️
   - Norse mythology and Viking culture
   - Topics: Odin, Thor, Loki, Valhalla, Ragnarok
   - Example: "Thor: God of Thunder and Protector of Mankind"

7. "Beyond the Grave" 💀
   - Death, afterlife, funeral rites
   - Topics: Burial customs, ghost stories, underworld
   - Example: "Ancient Egyptian Death Rituals: Journey to the Afterlife"

8. "Weird Jobs of History" 🤢
   - Unusual historical occupations
   - Topics: Gong farmers, rat catchers, bizarre professions
   - Example: "Gong Farmers: The Most Disgusting Job in Medieval England"

OUTPUT FORMAT (JSON):
{
  "title": "Article Title Here",
  "subtitle": "Supporting subtitle",
  "content": "<h2>Introduction</h2><p>First paragraph...</p>...",
  "sectionName": "Myths of the Ancients",
  "tags": ["Zeus", "Greek Mythology", "Ancient Greece"],
  "description": "Brief SEO description (150 chars)",
  "socialTitle": "🏛️ Zeus and the Olympians - Epic Tale",
  "coverImagePrompt": "Dramatic image of Zeus on Mount Olympus with lightning"
}

WRITING STYLE:
- Engaging and accessible
- Well-researched but entertaining
- Include fascinating details
- Use storytelling techniques
- Add relevant emojis to section titles
```

## 🎯 Example Usage

### Example 1: Norse Mythology

**Prompt:**
```
Topic: Tell me about Ragnarok in Norse mythology
```

**AI Output:**
```json
{
  "title": "Ragnarök: The Twilight of the Norse Gods",
  "subtitle": "The apocalyptic battle that ends and renews the world",
  "content": "<h2>The Prophecy of Doom</h2><p>In Norse mythology, Ragnarök represents...</p>",
  "sectionName": "Viking Myths and Legends",
  "tags": ["Ragnarok", "Norse Mythology", "Vikings", "End Times"],
  "description": "Explore Ragnarök, the Norse apocalypse where gods battle giants in the ultimate clash.",
  "socialTitle": "⚔️ Ragnarök: When Gods Fall and Worlds End"
}
```

### Example 2: Strange Jobs

**Prompt:**
```
Topic: Write about unusual jobs in medieval times
```

**AI Output:**
```json
{
  "title": "Gong Farmers: Medieval England's Most Disgusting Job",
  "subtitle": "The men who cleaned the privies and cesspits",
  "content": "<h2>A Necessary Evil</h2><p>In medieval England...</p>",
  "sectionName": "Weird Jobs of History",
  "tags": ["Medieval", "Jobs", "History", "Sanitation"],
  "description": "Discover the grim reality of gong farmers, who cleaned medieval cesspits for a living."
}
```

## 🤖 Integration with n8n

### Full Workflow

```
[Schedule Trigger]
    ↓
[HTTP Request: Call AI API]
    ↓
    Sends topic from queue
    ↓
[Code Node: Format Response]
    ↓
    Parses AI JSON output
    ↓
[Code Node: Publish to Gods & Monsters]
    ↓
    Uses gods-sections.json mapping
    Posts to correct section
    ↓
[Set Node: Log Success]
    ↓
[Slack: Send Notification]
```

### AI API Call (OpenAI/Claude)

```javascript
// In n8n HTTP Request node
const prompt = `
Generate content for The Gods & Monsters publication.

Topic: ${$json.topic}

[Include full prompt from above]
`;

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'You are a mythology and history content writer.'
    }, {
      role: 'user',
      content: prompt
    }],
    response_format: { type: 'json_object' }
  })
});

return response.json();
```

## 📊 Topic Queue Example

Keep a queue of topics for your AI to write about:

```json
{
  "topics": [
    "Medusa and Perseus",
    "Japanese Yokai spirits",
    "Medieval torture devices",
    "Egyptian mummification",
    "Viking berserkers",
    "Chinese dragon symbolism",
    "Victorian era body snatchers",
    "Greek Minotaur legend"
  ]
}
```

## ✅ Validation

Before publishing, validate the AI output:

```javascript
function validateAIOutput(data) {
  const errors = [];
  
  if (!data.title || data.title.length < 10) {
    errors.push('Title too short');
  }
  
  if (!data.content || data.content.length < 500) {
    errors.push('Content too short');
  }
  
  if (!data.sectionName || !GODS_SECTIONS[data.sectionName]) {
    errors.push('Invalid section name');
  }
  
  if (!data.tags || data.tags.length < 2) {
    errors.push('Need at least 2 tags');
  }
  
  return errors;
}
```

## 🎨 Cover Image Generation

If using AI image generation (DALL-E, Midjourney, etc.):

```javascript
// Use the coverImagePrompt from AI output
const imagePrompt = aiOutput.coverImagePrompt;

// Generate image
const image = await generateImage(imagePrompt);

// Add to post
aiOutput.coverImage = image.url;
```

## 📅 Publishing Schedule

Example schedule for consistent content:

- **Monday**: Myths of the Ancients
- **Tuesday**: Viking Myths and Legends
- **Wednesday**: The Monster Manual
- **Thursday**: Curious Histories
- **Friday**: Journey to the East
- **Saturday**: Medieval Tales or Weird Jobs
- **Sunday**: Beyond the Grave

## 🚀 Ready to Automate!

With this prompt and the section IDs, your AI can generate perfectly categorized content for The Gods & Monsters! 🤖⚡️

