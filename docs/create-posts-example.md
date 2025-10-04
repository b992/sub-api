# Creating Posts with Substack API

This example demonstrates how to use the new post creation APIs to create, edit, and publish posts on Substack.

## Basic Post Creation

```typescript
import { SubstackClient } from '@b992/substack-api';

const client = new SubstackClient({
  apiKey: 'your-connect-sid-cookie-value',
  hostname: 'your-publication.substack.com'
});

async function createSimplePost() {
  const myProfile = await client.ownProfile();
  
  // Create a draft post
  const draft = await myProfile.createPost({
    title: 'My First API Post',
    subtitle: 'Created using the Substack API',
    body_html: '<p>This is the content of my post created via the API.</p><p>It supports <strong>HTML formatting</strong>!</p>',
    type: 'newsletter',
    audience: 'everyone',
    is_published: false, // Create as draft
    description: 'A short description for SEO',
    postTags: ['api', 'automation', 'substack']
  });

  console.log(`Draft created: ${draft.title} (ID: ${draft.id})`);
  console.log(`Edit at: ${draft.canonicalUrl}/edit`);

  return draft;
}
```

## Using the Post Builder Pattern

```typescript
async function createPostWithBuilder() {
  const myProfile = await client.ownProfile();
  
  // Use the builder pattern for more complex posts
  const post = await myProfile.newPost()
    .setTitle('Building with the Substack API')
    .setSubtitle('A comprehensive guide to automation')
    .setBodyHtml(`
      <h2>Introduction</h2>
      <p>The Substack API enables powerful automation capabilities...</p>
      
      <h2>Key Features</h2>
      <ul>
        <li>Post creation and management</li>
        <li>Draft workflow support</li>
        <li>Rich HTML content</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>To begin using the API...</p>
    `)
    .setType('newsletter')
    .setAudience('everyone')
    .addTag('api')
    .addTag('automation')
    .addTag('guide')
    .setDescription('Learn how to use the Substack API for content automation')
    .createDraft(); // Creates as draft

  console.log(`Post created: ${post.title}`);
  return post;
}
```

## Publishing and Scheduling

```typescript
async function publishPost() {
  const myProfile = await client.ownProfile();
  
  // Get a draft post
  for await (const draft of myProfile.drafts({ limit: 1 })) {
    console.log(`Publishing draft: ${draft.title}`);
    
    // Publish immediately
    const published = await draft.publish({
      send_email: true,
      email_subject: 'New post: ' + draft.title
    });
    
    console.log(`Published at: ${published.canonicalUrl}`);
    break;
  }
}

async function schedulePost() {
  const myProfile = await client.ownProfile();
  
  // Create and schedule a post for later
  const scheduledTime = new Date();
  scheduledTime.setHours(scheduledTime.getHours() + 2); // 2 hours from now
  
  for await (const draft of myProfile.drafts({ limit: 1 })) {
    const scheduled = await draft.publish({
      send_email: true,
      trigger_at: scheduledTime.toISOString()
    });
    
    console.log(`Scheduled for: ${scheduledTime}`);
    break;
  }
}
```

## Managing Drafts

```typescript
async function manageDrafts() {
  const myProfile = await client.ownProfile();
  
  console.log('Your draft posts:');
  
  // List all drafts (most recently updated first)
  for await (const draft of myProfile.drafts({ 
    order_by: 'draft_updated_at',
    order_direction: 'desc'
  })) {
    console.log(`- ${draft.title} (last updated: ${new Date(draft.publishedAt)})`);
    console.log(`  Word count: ~${draft.htmlBody.length / 5} words`);
    console.log(`  Edit: ${draft.canonicalUrl}/edit`);
    console.log('');
  }
}
```

## Editing and Updating Posts

```typescript
async function editPost() {
  const myProfile = await client.ownProfile();
  
  // Get the first draft
  for await (const draft of myProfile.drafts({ limit: 1 })) {
    // Update the post content
    const updated = await draft.update({
      title: draft.title + ' (Updated)',
      body_html: draft.htmlBody + '<p><em>This post has been updated via the API.</em></p>',
      postTags: [...(draft.postTags || []), 'updated']
    });
    
    console.log(`Updated post: ${updated.title}`);
    break;
  }
}
```

## Working with Different Post Types

```typescript
async function createPodcastPost() {
  const myProfile = await client.ownProfile();
  
  const podcastPost = await myProfile.createPost({
    title: 'Episode 5: API Automation',
    subtitle: 'Deep dive into Substack API capabilities',
    body_html: `
      <p>In this episode, we explore...</p>
      <p><strong>Listen to the full episode above.</strong></p>
    `,
    type: 'podcast', // Different post type
    audience: 'paid', // Restrict to paid subscribers
    description: 'Learn about Substack API automation in this podcast episode'
  });

  console.log(`Podcast post created: ${podcastPost.canonicalUrl}`);
}

async function createThreadPost() {
  const myProfile = await client.ownProfile();
  
  const thread = await myProfile.createPost({
    title: 'Quick thoughts on API design',
    body_html: '<p>A short-form post with some quick thoughts...</p>',
    type: 'thread', // Short-form content
    audience: 'everyone'
  });

  console.log(`Thread created: ${thread.canonicalUrl}`);
}
```

## Error Handling

```typescript
async function createPostWithErrorHandling() {
  try {
    const myProfile = await client.ownProfile();
    
    const post = await myProfile.createPost({
      title: 'My New Post',
      body_html: '<p>Post content here...</p>'
    });
    
    console.log('Post created successfully!');
    return post;
    
  } catch (error) {
    if (error.message.includes('authentication')) {
      console.error('Authentication failed - check your API key');
    } else if (error.message.includes('permission')) {
      console.error('You do not have permission to create posts for this publication');
    } else {
      console.error('Post creation failed:', error.message);
    }
    throw error;
  }
}
```

## Complete Example: Content Automation

```typescript
async function automatedContentWorkflow() {
  const myProfile = await client.ownProfile();
  
  console.log('Starting automated content workflow...');
  
  // 1. Create a post from a template
  const post = await myProfile.newPost()
    .setTitle(`Weekly Update - ${new Date().toLocaleDateString()}`)
    .setSubtitle('Your weekly dose of insights')
    .setBodyHtml(`
      <h2>This Week's Highlights</h2>
      <p>Here's what happened this week...</p>
      
      <h2>Key Insights</h2>
      <ul>
        <li>Insight 1</li>
        <li>Insight 2</li>
        <li>Insight 3</li>
      </ul>
      
      <h2>Looking Ahead</h2>
      <p>Next week we'll be focusing on...</p>
    `)
    .addTag('weekly-update')
    .addTag('insights')
    .setAudience('everyone')
    .createDraft();
  
  console.log(`✅ Draft created: ${post.title}`);
  
  // 2. Review and edit if needed
  const reviewed = await post.update({
    body_html: post.htmlBody.replace('Insight 1', 'API automation is powerful'),
    description: 'Weekly insights and updates from our team'
  });
  
  console.log('✅ Post reviewed and updated');
  
  // 3. Schedule for optimal time (e.g., Tuesday 9 AM)
  const scheduleTime = new Date();
  scheduleTime.setDate(scheduleTime.getDate() + 1); // Tomorrow
  scheduleTime.setHours(9, 0, 0, 0); // 9 AM
  
  await reviewed.publish({
    send_email: true,
    email_subject: reviewed.title,
    trigger_at: scheduleTime.toISOString()
  });
  
  console.log(`✅ Post scheduled for ${scheduleTime}`);
  console.log(`📝 Preview: ${reviewed.canonicalUrl}`);
}

// Run the automation
automatedContentWorkflow().catch(console.error);
```

## API Reference Summary

### OwnProfile Methods
- `createPost(data)` - Create a new post draft
- `newPost()` - Get a PostBuilder for fluent post creation
- `drafts(options)` - Iterate through draft posts

### FullPost Methods
- `update(data)` - Update post content
- `publish(options)` - Publish or schedule the post
- `delete()` - Delete the post

### PostBuilder Methods
- `setTitle(title)` - Set post title
- `setSubtitle(subtitle)` - Set post subtitle
- `setBodyHtml(html)` - Set post content (HTML)
- `setType(type)` - Set post type ('newsletter', 'podcast', 'thread')
- `setAudience(audience)` - Set audience ('everyone', 'paid', 'founding')
- `addTag(tag)` - Add a tag
- `setDescription(desc)` - Set SEO description
- `createDraft()` - Create as draft
- `publish()` - Create and publish immediately

This comprehensive post creation API enables powerful content automation workflows while maintaining the flexibility to handle different post types and publishing strategies.
