import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ProfileGetOne = RouterOutputs["profile"]["getOne"];
export type ProfileAnalytics = RouterOutputs["profile"]["getAnalytics"];

