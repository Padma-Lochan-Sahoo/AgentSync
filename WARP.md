# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start Next.js dev server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database (Drizzle ORM)
```bash
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Webhooks (Development)
```bash
npm run dev:webhook  # Expose localhost via ngrok for webhook testing
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL via Neon with Drizzle ORM
- **Authentication**: Better Auth with Polar.sh integration for premium features
- **API**: tRPC for type-safe API routes
- **Real-time Features**: 
  - Stream Video SDK for video calls with OpenAI Realtime API integration
  - Stream Chat SDK for messaging
- **Background Jobs**: Inngest for async processing
- **AI**: OpenAI (GPT-4o) via Inngest Agent Kit for meeting summarization
- **Premium/Billing**: Polar.sh (sandbox mode)

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   ├── (dashboard)/       # Protected dashboard routes (agents, meetings, upgrade)
│   ├── call/[meetingId]/ # Video call interface
│   └── api/               # API routes (auth, trpc, webhooks, inngest)
├── components/            # Shared UI components
├── modules/               # Feature modules with domain logic
│   ├── agents/           # Agent CRUD and types
│   ├── meetings/         # Meeting management and types
│   ├── premium/          # Premium feature limits
│   └── call/             # Call-specific UI components
├── db/                    # Database layer
│   ├── schema.ts         # Drizzle schema definitions
│   └── index.ts          # Database client
├── trpc/                  # tRPC setup
│   ├── init.ts           # Context, procedures (base, protected, premium)
│   └── routers/          # API routers
├── inngest/               # Background job definitions
│   ├── client.ts         # Inngest client
│   └── functions.ts      # Job handlers (meeting processing)
├── lib/                   # Utility libraries
│   ├── auth.ts           # Better Auth config
│   ├── polar.ts          # Polar.sh client
│   ├── stream-video.ts   # Stream Video client
│   └── stream-chat.ts    # Stream Chat client
└── hooks/                 # React hooks
```

### Domain Model

**Core Entities:**
- `user` - Authentication and user data
- `agents` - AI agents with custom instructions (users can create multiple)
- `meetings` - Video calls between users and agents
  - Status flow: upcoming → active → processing → completed
  - Includes transcript and AI-generated summary

**Premium System:**
- Free tier limits: 100 agents, 100 meetings per user
- Enforced via `premiumProcedure` tRPC middleware
- Polar.sh integration for subscription management

### Key Architectural Patterns

#### tRPC Procedures
Three procedure types in `src/trpc/init.ts`:
1. `baseProcedure` - Public, no auth
2. `protectedProcedure` - Requires authentication
3. `premiumProcedure(entity)` - Checks premium limits for "agents" or "meetings"

#### Module Structure
Features are organized in `src/modules/[feature]/`:
- `schemas.ts` - Zod validation schemas
- `types.ts` - TypeScript types (often inferred from tRPC)
- `params.ts` - URL/route params
- `server/procedures.ts` - tRPC routes
- `ui/` - Feature-specific UI components

#### Real-time Video + AI Integration
The webhook handler (`src/app/api/webhook/route.ts`) orchestrates:
1. Stream Video webhooks trigger on call lifecycle events
2. `call.session_started` → Connects OpenAI Realtime API agent to call
3. `call.transcription_ready` → Triggers Inngest job for summarization
4. OpenAI agent receives custom instructions from agent record

#### Background Processing
Inngest function `meetings/processing`:
1. Fetches transcript from Stream API
2. Parses JSONL transcript format
3. Enriches with speaker names (users + agents)
4. Uses Inngest Agent Kit to summarize with GPT-4o
5. Updates meeting record with summary and "completed" status

### Environment Variables

Required environment variables (see actual `.env` for values):

**Database:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)

**Authentication (Better Auth):**
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth

**Stream SDKs:**
- `NEXT_PUBLIC_STREAM_VIDEO_API_KEY`, `STREAM_VIDEO_SECRET_KEY`
- `NEXT_PUBLIC_STREAM_CHAT_API_KEY`, `STREAM_CHAT_SECRET_KEY`

**AI:**
- `OPENAI_API_KEY` - For Realtime API and summarization

**Billing:**
- `POLAR_ACCESS_TOKEN` - Polar.sh API (sandbox mode)

**Webhooks:**
- Configure Stream webhooks to point to `/api/webhook` endpoint

### Path Aliases
- `@/*` maps to `src/*` (configured in tsconfig.json)

### Database Workflow
1. Modify `src/db/schema.ts`
2. Run `npm run db:push` to apply changes
3. Use `npm run db:studio` to inspect data

### Testing Webhooks Locally
1. Start dev server: `npm run dev`
2. Run ngrok: `npm run dev:webhook`
3. Configure Stream webhook URL to ngrok URL + `/api/webhook`
4. Webhook verification uses Stream SDK's signature validation
