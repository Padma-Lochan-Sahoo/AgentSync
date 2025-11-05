/**
 * Diagnostic script to verify OpenAI and Stream Video configuration
 * Run with: npx tsx scripts/diagnose.ts
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { StreamClient } from '@stream-io/node-sdk';

async function diagnose() {
  console.log('🔍 Running AgentSync Diagnostics...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_STREAM_VIDEO_API_KEY',
    'STREAM_VIDEO_SECRET_KEY',
    'DATABASE_URL',
  ];

  let missingVars = false;
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ❌ ${varName}: MISSING`);
      missingVars = true;
    }
  }

  if (missingVars) {
    console.error('\n❌ Missing required environment variables. Please check your .env file.\n');
    process.exit(1);
  }

  console.log('\n🤖 Testing OpenAI API Connection...');
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Test basic API access
    const models = await openai.models.list();
    console.log('  ✅ OpenAI API connection successful');
    
    // Check if Realtime model is available
    const realtimeModels = models.data.filter(m => 
      m.id.includes('realtime') || m.id.includes('gpt-4o')
    );
    
    if (realtimeModels.length > 0) {
      console.log('  ✅ GPT-4o models available:');
      realtimeModels.forEach(m => console.log(`     - ${m.id}`));
    } else {
      console.log('  ⚠️  GPT-4o Realtime models not found in list');
    }

    // Check account credits/usage (if available)
    try {
      const usage = await openai.usage.costs({ 
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      });
      console.log('  ℹ️  Recent usage data available');
    } catch {
      console.log('  ℹ️  Usage API not accessible (might require higher tier API key)');
    }

  } catch (error: any) {
    console.error('  ❌ OpenAI API Error:', error.message);
    
    if (error.status === 401) {
      console.error('     🔑 Invalid API key. Please check OPENAI_API_KEY in .env');
    } else if (error.status === 429) {
      console.error('     💳 Rate limit or quota exceeded. Check your OpenAI account:');
      console.error('        https://platform.openai.com/usage');
    }
    
    console.error('\n❌ OpenAI API test failed. Agent will not be able to join calls.\n');
    process.exit(1);
  }

  console.log('\n📹 Testing Stream Video SDK Connection...');
  try {
    const streamVideo = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      process.env.STREAM_VIDEO_SECRET_KEY!
    );

    // Test upsert user
    await streamVideo.upsertUsers([
      {
        id: 'test-user-diagnostic',
        name: 'Test User',
        role: 'user',
      },
    ]);
    console.log('  ✅ Stream Video SDK connection successful');
    console.log('  ✅ User upsert working');

  } catch (error: any) {
    console.error('  ❌ Stream Video SDK Error:', error.message);
    console.error('\n❌ Stream Video SDK test failed. Video calls may not work.\n');
    process.exit(1);
  }

  console.log('\n✅✅✅ All diagnostics passed!\n');
  console.log('📝 Next steps:');
  console.log('  1. Start your dev server: npm run dev');
  console.log('  2. Expose it with ngrok: npm run dev:webhook');
  console.log('  3. Configure Stream webhook in dashboard to point to your ngrok URL + /api/webhook');
  console.log('  4. Create a meeting and check the console logs for [AGENT CONNECTION] messages');
  console.log('\n💡 Tip: Watch the terminal for detailed logs when agent joins the call\n');
}

diagnose().catch(console.error);
