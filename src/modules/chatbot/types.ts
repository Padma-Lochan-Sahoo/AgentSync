import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type ChatGetMany = inferRouterOutputs<AppRouter>["chatbot"]["getMany"]["items"][0];
export type ChatGetOne = inferRouterOutputs<AppRouter>["chatbot"]["getOne"];
export type ChatMessage = inferRouterOutputs<AppRouter>["chatbot"]["getMessages"]["items"][0];

