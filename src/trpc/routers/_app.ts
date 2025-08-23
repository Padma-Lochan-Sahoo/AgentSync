import { agentsRouter } from '@/modules/agents/server/procedures';
import { authRouter } from '@/modules/auth/server/procedures';

import { createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  agents: agentsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;