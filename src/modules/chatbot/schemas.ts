import { z } from "zod";

export const chatCreateSchema = z.object({
    agentId: z.string().min(1, { message: "Agent ID is required" }),
    title: z.string().optional(),
});

export const chatMessageCreateSchema = z.object({
    chatId: z.string().min(1, { message: "Chat ID is required" }),
    content: z.string().min(1, { message: "Message content is required" }),
});

export const chatUpdateSchema = z.object({
    id: z.string().min(1, { message: "ID is required" }),
    title: z.string().optional(),
});

