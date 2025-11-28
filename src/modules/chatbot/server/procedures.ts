import { z } from "zod";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
import OpenAI from "openai";

import { db } from "@/db";
import { agents, chats, chatMessages } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { chatCreateSchema, chatMessageCreateSchema, chatUpdateSchema } from "../schemas";
import { TRPCError } from "@trpc/server";
// import { generateAvatarUri } from "@/lib/avatar";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const chatbotRouter = createTRPCRouter({
  create: protectedProcedure
    .input(chatCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify agent belongs to user
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.id, input.agentId),
            eq(agents.userId, ctx.auth.user.id),
          )
        );

      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      const [newChat] = await db
        .insert(chats)
        .values({
          userId: ctx.auth.user.id,
          agentId: input.agentId,
          title: input.title || `Chat with ${existingAgent.name}`,
        })
        .returning();

      return newChat;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [chat] = await db
        .select({
          ...getTableColumns(chats),
          agent: agents,
        })
        .from(chats)
        .innerJoin(agents, eq(chats.agentId, agents.id))
        .where(
          and(
            eq(chats.id, input.id),
            eq(chats.userId, ctx.auth.user.id),
          )
        );

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      return chat;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const data = await db
        .select({
          ...getTableColumns(chats),
          agent: agents,
        })
        .from(chats)
        .innerJoin(agents, eq(chats.agentId, agents.id))
        .where(
          and(
            eq(chats.userId, ctx.auth.user.id),
            input.agentId ? eq(chats.agentId, input.agentId) : undefined,
          )
        )
        .orderBy(desc(chats.updatedAt), desc(chats.id));

      return data;
    }),

  update: protectedProcedure
    .input(chatUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedChat] = await db
        .update(chats)
        .set({
          title: input.title,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(chats.id, input.id),
            eq(chats.userId, ctx.auth.user.id),
          )
        )
        .returning();

      if (!updatedChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      return updatedChat;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [removedChat] = await db
        .delete(chats)
        .where(
          and(
            eq(chats.id, input.id),
            eq(chats.userId, ctx.auth.user.id),
          )
        )
        .returning();

      if (!removedChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      return removedChat;
    }),

  getMessages: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify chat belongs to user
      const [chat] = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.id, input.chatId),
            eq(chats.userId, ctx.auth.user.id),
          )
        );

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, input.chatId))
        .orderBy(chatMessages.createdAt);

      return { items: messages };
    }),

  sendMessage: protectedProcedure
    .input(chatMessageCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify chat belongs to user and get agent
      const [chat] = await db
        .select({
          ...getTableColumns(chats),
          agent: agents,
        })
        .from(chats)
        .innerJoin(agents, eq(chats.agentId, agents.id))
        .where(
          and(
            eq(chats.id, input.chatId),
            eq(chats.userId, ctx.auth.user.id),
          )
        );

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      // Save user message
      const [userMessage] = await db
        .insert(chatMessages)
        .values({
          chatId: input.chatId,
          role: "user",
          content: input.content,
        })
        .returning();

      // Get previous messages for context
      const previousMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, input.chatId))
        .orderBy(chatMessages.createdAt);

      // Build messages for OpenAI
      const messages = [
        {
          role: "system" as const,
          content: `You are an AI assistant specialized in a specific role. Your role and instructions are:

${chat.agent.instructions}

CRITICAL RULES:
1. You MUST only respond to questions and requests that are directly related to your role and instructions above.
2. If a user asks you something unrelated to your role/instructions, you MUST politely decline and redirect them. Use this format:
   "I'm not trained in this particular topic. I'm specialized as [brief description of your role]. Feel free to ask me anything related to [your area of expertise]."
3. Stay focused on your area of expertise and do not provide answers outside your specialization.

RESPONSE FORMATTING:
Format your responses using Markdown for better readability. Use:
- **Bold** for emphasis
- *Italic* for subtle emphasis
- Headers (# ## ###) for organizing content
- Lists (- or 1.) for structured information
- \`code\` for inline code and code blocks for longer snippets
- > Blockquotes for important notes
- Links [text](url) when referencing external resources

Always provide well-structured, formatted responses that are easy to read and understand.`,
        },
        ...previousMessages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ];

      // Get AI response
      const gptResponse = await openaiClient.chat.completions.create({
        messages,
        model: "gpt-4o",
      });

      const assistantContent = gptResponse.choices[0]?.message?.content;

      if (!assistantContent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No response from AI",
        });
      }

      // Save assistant message
      const [assistantMessage] = await db
        .insert(chatMessages)
        .values({
          chatId: input.chatId,
          role: "assistant",
          content: assistantContent,
        })
        .returning();

      // Update chat updatedAt
      await db
        .update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, input.chatId));

      return {
        userMessage,
        assistantMessage,
      };
    }),
});

