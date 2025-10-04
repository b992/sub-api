/**
 * Comprehensive Example: Publishing a Post with Share Note
 * 
 * This example demonstrates the complete workflow discovered from the Share Center:
 * 1. Create a fully-featured article with all metadata
 * 2. Publish it
 * 3. Automatically share it as a note (like the "Share as a note" feature in Share Center)
 * 
 * Tested: Oct 4, 2025
 * Status: ✅ WORKING (Post publishing and note creation both functional)
 */

import { SubstackClient } from './src'

async function main() {
  console.log('═'.repeat(70))
  console.log('  PUBLISH POST WITH SHARE NOTE - Complete Workflow')
  console.log('═'.repeat(70) + '\n')

  // Initialize client
  const client = new SubstackClient({
    email: process.env.SUBSTACK_EMAIL!,
    password: process.env.SUBSTACK_PASSWORD!,
    hostname: process.env.SUBSTACK_HOSTNAME || 'substack.com',
    defaultSectionId: parseInt(process.env.SUBSTACK_SECTION_ID || '0')
  })

  try {
    // Get authenticated profile
    const profile = await client.ownProfile()
    console.log(`✅ Authenticated as: ${profile.name} (@${profile.slug})\n`)

    // ========================================================================
    // METHOD 1: Using the new publishWithNote() convenience method
    // ========================================================================
    console.log('📝 Method 1: Using publishWithNote() convenience method\n')
    
    const { post, note } = await profile.publishWithNote(
      profile.newPost()
        // Basic Content
        .setTitle('Mastering AI-Powered Content Creation')
        .setSubtitle('A practical guide for writers, creators, and marketers')
        
        // Rich HTML Content
        .setBodyHtml(`
          <h2>🎯 Introduction</h2>
          <p>The landscape of content creation has been transformed by AI tools. In this comprehensive guide, we'll explore practical strategies that work in 2025.</p>
          
          <h2>💡 Key Insights</h2>
          <ul>
            <li><strong>Efficiency:</strong> AI can reduce content creation time by 60-80%</li>
            <li><strong>Quality:</strong> Human oversight remains crucial for authenticity</li>
            <li><strong>Creativity:</strong> AI excels at brainstorming and overcoming blocks</li>
            <li><strong>Research:</strong> Quick synthesis of information across sources</li>
          </ul>
          
          <h2>🚀 Practical Strategies</h2>
          <p>Here are the techniques that top creators are using:</p>
          
          <ol>
            <li><strong>Outline First:</strong> Use AI to generate comprehensive outlines</li>
            <li><strong>Edit Aggressively:</strong> Never publish AI text without thorough editing</li>
            <li><strong>Maintain Voice:</strong> Infuse your unique perspective and style</li>
            <li><strong>Fact Check Everything:</strong> Verify all claims and citations</li>
            <li><strong>Add Personal Stories:</strong> AI can't replace human experience</li>
          </ol>
          
          <blockquote>
            <p>"AI is a powerful tool, but it's the human touch that creates connection with readers." - Content Creator's Manifesto 2025</p>
          </blockquote>
          
          <h2>🎓 Best Practices</h2>
          <p>Follow these guidelines for optimal results:</p>
          
          <ul>
            <li>Start with clear prompts and specific objectives</li>
            <li>Use AI for first drafts, not final copy</li>
            <li>Blend AI-generated content with original insights</li>
            <li>Keep experimenting with different AI tools</li>
            <li>Stay authentic to your brand voice</li>
          </ul>
          
          <h2>🔮 Looking Ahead</h2>
          <p>As AI tools continue to evolve, the creators who thrive will be those who use technology as an amplifier of their unique human creativity, not a replacement for it.</p>
          
          <p><em>Want to learn more? Follow for more insights on modern content creation!</em></p>
        `)
        
        // Metadata
        .setDescription('Learn practical AI-powered content creation strategies that work in 2025. A comprehensive guide with actionable tips for writers and creators.')
        
        // Cover Image (using a sample image URL)
        .setCoverImage('https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200')
        
        // Tags for discoverability
        .setTags(['AI', 'Content Creation', 'Writing', 'Productivity', 'Marketing', 'Strategy'])
        
        // SEO Optimization
        .setSearchEngineTitle('Mastering AI-Powered Content Creation | Complete Guide 2025')
        .setSearchEngineDescription('Discover proven strategies for using AI in content creation. Learn how top creators leverage AI tools while maintaining authenticity and quality.')
        
        // Social Media Optimization
        .setSocialTitle('🤖 Master AI-Powered Content Creation in 2025')
        
        // Post Settings
        .setAudience('everyone')
        .setType('newsletter')
        .setCommentPermissions('everyone')
        .setCommentSort('best_first'),
      
      // Share note text (optional)
      '🎉 Just published a comprehensive guide on AI-powered content creation! Learn the strategies that top creators are using in 2025. Check it out! 👇'
    )

    console.log('\n✅ POST PUBLISHED SUCCESSFULLY!')
    console.log('   Post ID:', post.id)
    console.log('   Title:', post.title)
    console.log('   URL:', post.canonical_url)
    console.log('   Published:', post.is_published)
    
    if (note) {
      console.log('\n✅ SHARE NOTE PUBLISHED!')
      console.log('   Note ID:', note.id)
      console.log('   The note will appear in your followers\' feeds')
    } else {
      console.log('\n⚠️  Share note was not created (optional feature)')
    }

    console.log('\n' + '═'.repeat(70))

    // ========================================================================
    // METHOD 2: Manual workflow (more control)
    // ========================================================================
    console.log('\n📝 Method 2: Manual workflow with full control\n')
    
    // Step 1: Build and publish the post
    const manualPost = await profile.newPost()
      .setTitle('Quick Tips: 5 AI Productivity Hacks')
      .setSubtitle('Boost your workflow in minutes')
      .setBodyHtml(`
        <p>Here are 5 quick AI productivity hacks I use every day:</p>
        
        <h3>1. 📧 Email Templates</h3>
        <p>Use AI to generate professional email templates for common scenarios.</p>
        
        <h3>2. 🗂️ Content Repurposing</h3>
        <p>Transform blog posts into social media threads automatically.</p>
        
        <h3>3. 📊 Data Analysis</h3>
        <p>Get instant insights from spreadsheets and reports.</p>
        
        <h3>4. 🎨 Image Generation</h3>
        <p>Create custom graphics for posts in seconds.</p>
        
        <h3>5. 📝 Meeting Notes</h3>
        <p>Auto-summarize meetings and extract action items.</p>
        
        <p><strong>Try these out and let me know which one works best for you!</strong></p>
      `)
      .setDescription('5 practical AI productivity hacks you can implement today')
      .addTag('AI')
      .addTag('Productivity')
      .publish()
    
    console.log('✅ Manual post published:', manualPost.canonical_url)
    
    // Step 2: Create a custom share note
    const manualNote = await profile.newNoteWithLink(manualPost.canonical_url)
      .paragraph()
      .text('💡 New post alert!')
      .paragraph()
      .text('Just shared my top 5 AI productivity hacks. These are the tools and techniques I use daily to save hours of work.')
      .paragraph()
      .text('Which hack would help you most? Let me know in the comments! 👇')
      .publish()
    
    console.log('✅ Custom share note published:', manualNote.id)

    console.log('\n' + '═'.repeat(70))
    console.log('✨ All examples completed successfully!')
    console.log('═'.repeat(70))

    return { post, note, manualPost, manualNote }

  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  }
}

// Export for use in other scripts
export { main as publishWithShareNoteExample }

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
}

