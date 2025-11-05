# AgentSync Troubleshooting Guide

## AI Agent Not Joining Meeting

If your AI agent isn't joining the video call, follow these steps:

### 1. Run Diagnostics

First, run the diagnostic script to verify your setup:

```bash
npx tsx scripts/diagnose.ts
```

This will check:
- ✅ All required environment variables are set
- ✅ OpenAI API key is valid and has credits
- ✅ Stream Video SDK connection works

### 2. Check OpenAI API Credits

**Most Common Issue:** Insufficient OpenAI credits

1. Visit: https://platform.openai.com/usage
2. Check your current balance
3. The **GPT-4o Realtime API** requires credits (not free tier)
4. Add at least $5-10 credits for testing

**Error messages to look for:**
- `insufficient_quota`
- `You exceeded your current quota`
- Status code 429

### 3. Verify Stream Webhooks Configuration

The agent joins via webhook when the call starts. You need:

1. **Development Setup (Local):**
   ```bash
   # Terminal 1: Start dev server
   npm run dev

   # Terminal 2: Start ngrok
   npm run dev:webhook
   ```

2. **Configure Stream Webhook:**
   - Go to: https://dashboard.getstream.io/
   - Navigate to your app's Webhooks settings
   - Add webhook URL: `https://your-ngrok-url.ngrok-free.app/api/webhook`
   - Enable event: `call.session_started`

3. **Production Setup:**
   - Update webhook URL to your production domain + `/api/webhook`
   - Example: `https://agentsync.vercel.app/api/webhook`

### 4. Check Environment Variables

Ensure your `.env` file has all required variables:

```bash
# OpenAI (CRITICAL for agent voice)
OPENAI_API_KEY=sk-proj-...

# Stream Video (for video calls)
NEXT_PUBLIC_STREAM_VIDEO_API_KEY=...
STREAM_VIDEO_SECRET_KEY=...

# Stream Chat (for meeting Q&A)
NEXT_PUBLIC_STREAM_CHAT_API_KEY=...
STREAM_CHAT_SECRET_KEY=...

# Database
DATABASE_URL=postgresql://...

# Auth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Polar (for premium features)
POLAR_ACCESS_TOKEN=...
```

### 5. Check Console Logs

When you start a meeting, watch for these log messages:

**✅ Success indicators:**
```
🤖 [AGENT CONNECTION] Starting OpenAI Realtime Agent: [agent name]
✅ [AGENT CONNECTION] Call state retrieved successfully
🔌 [AGENT CONNECTION] Connecting OpenAI Realtime API...
✅ [AGENT CONNECTION] Realtime client created
⏳ [AGENT CONNECTION] Waiting for OpenAI session to be created...
✅ [AGENT CONNECTION] OpenAI session created successfully!
✅ [AGENT CONNECTION] Session configured successfully with instructions and voice!
✅✅✅ [AGENT CONNECTION] SUCCESS! Agent is in the call and ready!
```

**❌ Error indicators:**
```
❌ [AGENT CONNECTION] CRITICAL ERROR - Session creation failed
🚨 [AGENT CONNECTION] This means the agent did NOT join the call
💳 [AGENT CONNECTION] OpenAI API quota/credits issue detected!
🔑 [AGENT CONNECTION] OpenAI API key issue detected!
```

### 6. Common Issues & Solutions

#### Issue: "OpenAI API key not configured"
**Solution:** Set `OPENAI_API_KEY` in your `.env` file

#### Issue: "insufficient_quota" or "quota exceeded"
**Solution:** Add credits to your OpenAI account at https://platform.openai.com/billing

#### Issue: "Invalid API key"
**Solution:** 
- Verify your API key starts with `sk-proj-` or `sk-`
- Generate a new key at https://platform.openai.com/api-keys
- Make sure it has access to GPT-4o models

#### Issue: Agent joins but has no voice
**Solution:**
- Check that `voice: "alloy"` is in the session config
- Verify `modalities: ["text", "audio"]` includes audio
- Ensure OpenAI Realtime API is enabled for your account

#### Issue: Webhook not triggered
**Solution:**
1. Verify ngrok is running: `npm run dev:webhook`
2. Check Stream dashboard webhook configuration
3. Test webhook manually: `curl -X POST https://your-ngrok-url/api/webhook`
4. Check webhook signature verification

#### Issue: "Session creation timeout after 30s"
**Solution:**
- OpenAI API might be slow or down
- Check status at https://status.openai.com/
- Verify your internet connection
- Try again in a few minutes

### 7. Testing the Fix

After applying fixes:

1. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Create a new meeting:**
   - Go to your app
   - Create an agent with instructions
   - Start a new meeting
   - The agent should join within 5-10 seconds

3. **Watch the logs:**
   - Look for `[AGENT CONNECTION]` messages
   - Verify you see the success message
   - Try speaking - the agent should respond

### 8. Still Not Working?

If the agent still won't join:

1. **Check the full error message** in your terminal
2. **Verify OpenAI model name**: `gpt-4o-realtime-preview-2024-12-17`
3. **Check Stream SDK version** in package.json
4. **Try with a simple instruction** first (e.g., "You are a helpful assistant")
5. **Test in production** (sometimes local webhook issues don't affect production)

### 9. Get More Verbose Logs

To see even more details, add this to your webhook handler:

```typescript
// In src/app/api/webhook/route.ts, at the top of the POST function
console.log('📨 Webhook received:', eventType);
console.log('📋 Full payload:', JSON.stringify(payload, null, 2));
```

## Additional Resources

- **OpenAI Realtime API Docs**: https://platform.openai.com/docs/guides/realtime
- **Stream Video SDK Docs**: https://getstream.io/video/docs/
- **Stream Webhooks Guide**: https://getstream.io/video/docs/api/webhooks/
- **OpenAI Usage Dashboard**: https://platform.openai.com/usage

## Need Help?

1. Check the logs for specific error messages
2. Run the diagnostic script: `npx tsx scripts/diagnose.ts`
3. Review this troubleshooting guide
4. Check OpenAI and Stream status pages
