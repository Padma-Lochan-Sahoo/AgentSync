import { createTRPCRouter } from '../init';

import { agentsRouter } from '@/modules/agents/server/procedures';
import { meetingsRouter } from '@/modules/meetings/server/procedure';
import { premiumRouter } from '@/modules/premium/server/procedures';
import { chatbotRouter } from '@/modules/chatbot/server/procedures';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  meetings: meetingsRouter,
  premium: premiumRouter,
  chatbot: chatbotRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;