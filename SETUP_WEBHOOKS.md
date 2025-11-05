# Stream Webhooks Setup Guide

## Why Webhooks Are Needed

Your AI agent joins the meeting via a **webhook**. When a user starts a call, Stream Video sends a `call.session_started` event to your webhook endpoint, which triggers the agent to join.

## Local Development Setup

### Step 1: Start Your Dev Server

```bash
npm run dev
```

Your app will run on `http://localhost:3000`

### Step 2: Expose via ngrok

In a **separate terminal**, run:

```bash
npm run dev:webhook
```

This runs: `ngrok http --url=unhit-yee-unmonopolized.ngrok-free.app 3000`

You should see output like:
```
Forwarding: https://unhit-yee-unmonopolized.ngrok-free.app -> http://localhost:3000
```

**Your webhook URL is:** `https://unhit-yee-unmonopolized.ngrok-free.app/api/webhook`

### Step 3: Configure Stream Dashboard

1. Go to: **https://dashboard.getstream.io/**
2. Select your app
3. Navigate to: **Video & Audio** → **Webhooks**
4. Click **"Add webhook"**
5. Fill in:
   - **URL:** `https://unhit-yee-unmonopolized.ngrok-free.app/api/webhook`
   - **Events to subscribe:** Check `call.session_started`
   - You may also want to enable:
     - `call.session_ended`
     - `call.transcription_ready`
     - `call.recording_ready`
6. Click **Save**

### Step 4: Test It!

1. Create an agent in your app (e.g., "Career Advisor")
2. Create a meeting with that agent
3. Join the meeting
4. **Watch your terminal** for these logs:

```
🤖 [AGENT CONNECTION] Starting OpenAI Realtime Agent: Career Advisor
📞 [AGENT CONNECTION] Call ID: xyz, Agent ID: abc
✅ [AGENT CONNECTION] Call state retrieved successfully
🔌 [AGENT CONNECTION] Connecting OpenAI Realtime API...
⏳ [AGENT CONNECTION] Waiting for OpenAI session to be created...
✅ [AGENT CONNECTION] OpenAI session created successfully!
✅ [AGENT CONNECTION] Session configured successfully with instructions and voice!
✅✅✅ [AGENT CONNECTION] SUCCESS! Agent is in the call and ready!
```

5. The agent should appear in the call within 5-10 seconds
6. **Speak to test** - the agent should respond with voice!

## Production Setup

For production (e.g., Vercel):

1. Deploy your app to Vercel/production
2. Get your production URL (e.g., `https://agentsync.vercel.app`)
3. Update Stream webhook to: `https://agentsync.vercel.app/api/webhook`
4. No ngrok needed in production!

## Troubleshooting

### Webhook Not Triggering

**Check:**
1. Is ngrok running? (`npm run dev:webhook`)
2. Is the webhook URL correct in Stream dashboard?
3. Did you enable `call.session_started` event?
4. Check Stream dashboard logs for webhook delivery attempts

### Agent Joins But No Voice

**Check:**
1. OpenAI API key is valid
2. You have credits in your OpenAI account ($5 minimum recommended)
3. Check console logs for OpenAI errors

### "Invalid signature" Error

**Check:**
1. Your `STREAM_VIDEO_SECRET_KEY` matches your Stream app
2. The webhook is coming from Stream (not a manual test)

## Webhook Events

Your app handles these webhook events:

| Event | What It Does |
|-------|-------------|
| `call.session_started` | Connects AI agent to the call |
| `call.session_ended` | Marks meeting as completed |
| `call.transcription_ready` | Triggers AI summarization |
| `call.recording_ready` | Saves recording URL |
| `message.new` | Handles post-meeting Q&A chat |

## Security

The webhook endpoint:
- ✅ Verifies Stream signature (`x-signature` header)
- ✅ Validates API key (`x-api-key` header)
- ✅ Only processes valid events
- ✅ Returns 401 for invalid signatures

## Need Help?

1. Run diagnostics: `npx tsx scripts/diagnose.ts`
2. Check: `TROUBLESHOOTING.md`
3. Watch terminal logs when starting a meeting
4. Look for `[AGENT CONNECTION]` messages
