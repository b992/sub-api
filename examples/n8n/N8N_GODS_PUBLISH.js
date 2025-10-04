/**
 * n8n Code Node: Publish to The Gods & Monsters
 * 
 * This publishes posts to the correct section automatically
 * based on AI-generated content and section assignment.
 */

const { SubstackClient } = require('@b992/substack-api');

// Get input from previous node (AI-generated content)
const inputData = $input.first().json;

// ===== SECTION MAPPING =====
const GODS_SECTIONS = {
  "Journey to the East": 176210,
  "Myths of the Ancients": 176211,
  "Curious Histories": 176365,
  "Medieval Tales": 176624,
  "The Monster Manual": 176629,
  "Viking Myths and Legends": 179896,
  "Beyond the Grave": 179897,  // NOTE: Verify this ID
  "Weird Jobs of History": 191903
};

// ===== AUTOMATIC CATEGORIZATION =====
function categorizeContent(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  const sectionKeywords = {
    "Journey to the East": ["asian", "chinese", "japanese", "korean", "hindu", "dragon", "yokai", "buddha", "confucius"],
    "Myths of the Ancients": ["greek", "roman", "zeus", "apollo", "athena", "olympus", "titan", "ancient greece", "ancient rome"],
    "Curious Histories": ["strange", "unusual", "curious", "weird history", "bizarre", "historical fact"],
    "Medieval Tales": ["medieval", "middle ages", "knight", "castle", "feudal", "crusade", "plague", "monastery"],
    "The Monster Manual": ["monster", "creature", "beast", "vampire", "werewolf", "dragon", "demon", "chimera"],
    "Viking Myths and Legends": ["viking", "norse", "odin", "thor", "loki", "valhalla", "ragnarok", "norse mythology"],
    "Beyond the Grave": ["death", "afterlife", "grave", "funeral", "burial", "ghost", "spirit", "underworld"],
    "Weird Jobs of History": ["job", "occupation", "profession", "work", "trade", "gong farmer", "rat catcher"]
  };
  
  let bestSection = "Curious Histories"; // Default
  let highestScore = 0;
  
  for (const [section, keywords] of Object.entries(sectionKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score++;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestSection = section;
    }
  }
  
  return bestSection;
}

// ===== MAIN LOGIC =====
try {
  // Determine section (from AI or auto-categorize)
  let sectionName = inputData.sectionName;
  
  if (!sectionName) {
    // Auto-categorize based on content
    sectionName = categorizeContent(inputData.title, inputData.content);
    console.log(`Auto-categorized to: ${sectionName}`);
  }
  
  // Get section ID
  const sectionId = GODS_SECTIONS[sectionName];
  
  if (!sectionId) {
    throw new Error(`Unknown section: ${sectionName}`);
  }
  
  // Initialize client for The Gods & Monsters
  const client = new SubstackClient({
    apiKey: process.env.GODS_API_KEY,
    hostname: 'thegodsandmonsters.substack.com',
    defaultSectionId: sectionId
  });
  
  // Get authenticated profile
  const profile = await client.ownProfile();
  
  // Build and publish post
  const post = await profile.newPost()
    .setTitle(inputData.title)
    .setSubtitle(inputData.subtitle || '')
    .setBodyHtml(inputData.content)
    .setCoverImage(inputData.coverImage || '')
    .setTags(inputData.tags || [])
    .setDescription(inputData.description || '')
    .setSocialTitle(inputData.socialTitle || inputData.title)
    .setSection(sectionId)  // Ensure correct section
    .publish();
  
  // Return success
  return [{
    json: {
      success: true,
      post: {
        id: post.id,
        title: post.title,
        url: post.canonical_url || `https://thegodsandmonsters.substack.com/p/${post.slug}`,
        section: sectionName,
        sectionId: sectionId
      },
      metadata: {
        publishedAt: new Date().toISOString(),
        autoCategorized: !inputData.sectionName
      }
    }
  }];
  
} catch (error) {
  // Return error
  return [{
    json: {
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      },
      input: {
        title: inputData.title,
        requestedSection: inputData.sectionName
      }
    }
  }];
}

