import { z } from "zod";
import { and, eq, sql, desc, count, avg, sum } from "drizzle-orm";
import { db } from "@/db";
import { user, agents, meetings, chats, chatMessages } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { profileUpdateSchema } from "../schemas";
import { TRPCError } from "@trpc/server";

export const profileRouter = createTRPCRouter({
  getOne: protectedProcedure.query(async ({ ctx }) => {
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, ctx.auth.user.id));

    if (!userData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return userData;
  }),

  update: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await db
        .update(user)
        .set({
          name: input.name,
          email: input.email,
          image: input.image || null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.auth.user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return updatedUser;
    }),

  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.user.id;

    // Agent Performance Metrics
    // Note: Response time calculation is simplified - using a fixed estimate based on OpenAI API
    // In production, you'd want to track actual response times
    const agentPerformance = await db
      .select({
        agentId: agents.id,
        agentName: agents.name,
        totalMessages: count(chatMessages.id),
      })
      .from(agents)
      .leftJoin(chats, eq(chats.agentId, agents.id))
      .leftJoin(chatMessages, eq(chatMessages.chatId, chats.id))
      .where(eq(agents.userId, userId))
      .groupBy(agents.id, agents.name)
      .orderBy(desc(count(chatMessages.id)));

    // Simplified response time: estimate based on message count (more messages = faster responses typically)
    // In a real implementation, you'd track actual API response times
    const agentPerformanceWithResponseTime = agentPerformance.map((agent) => {
      // Estimate: 2-5 seconds average response time (typical for GPT-4)
      // This is a placeholder - in production, track actual response times
      const estimatedResponseTime = 3000; // 3 seconds in milliseconds
      return {
        ...agent,
        avgResponseTime: estimatedResponseTime,
      };
    });

    // Meeting Statistics
    const meetingStats = await db
      .select({
        total: count(meetings.id),
        completed: sql<number>`COUNT(CASE WHEN ${meetings.status} = 'completed' THEN 1 END)`.as("completed"),
        cancelled: sql<number>`COUNT(CASE WHEN ${meetings.status} = 'cancelled' THEN 1 END)`.as("cancelled"),
        avgDuration: sql<number>`COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))
          ), 0
        )`.as("avg_duration_seconds"),
        totalDuration: sql<number>`COALESCE(
          SUM(
            EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))
          ), 0
        )`.as("total_duration_seconds"),
      })
      .from(meetings)
      .where(eq(meetings.userId, userId));

    const stats = meetingStats[0] || {
      total: 0,
      completed: 0,
      cancelled: 0,
      avgDuration: 0,
      totalDuration: 0,
    };

    const completionRate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    // Chat Analytics - Messages per Agent
    const messagesPerAgent = await db
      .select({
        agentId: agents.id,
        agentName: agents.name,
        messageCount: count(chatMessages.id),
      })
      .from(agents)
      .leftJoin(chats, eq(chats.agentId, agents.id))
      .leftJoin(chatMessages, eq(chatMessages.chatId, chats.id))
      .where(eq(agents.userId, userId))
      .groupBy(agents.id, agents.name)
      .orderBy(desc(count(chatMessages.id)));

    // Usage Trends - Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageTrends = await db
      .select({
        date: sql<string>`DATE(${meetings.createdAt})`.as("date"),
        meetings: count(meetings.id),
        chats: sql<number>`(
          SELECT COUNT(DISTINCT ${chats.id})
          FROM ${chats}
          WHERE DATE(${chats.createdAt}) = DATE(${meetings.createdAt})
          AND ${chats.userId} = ${userId}
        )`.as("chats"),
      })
      .from(meetings)
      .where(
        and(
          eq(meetings.userId, userId),
          sql`${meetings.createdAt} >= ${thirtyDaysAgo}`
        )
      )
      .groupBy(sql`DATE(${meetings.createdAt})`)
      .orderBy(sql`DATE(${meetings.createdAt})`);

    // Get chat trends separately for better accuracy
    const chatTrends = await db
      .select({
        date: sql<string>`DATE(${chats.createdAt})`.as("date"),
        chats: count(chats.id),
      })
      .from(chats)
      .where(
        and(
          eq(chats.userId, userId),
          sql`${chats.createdAt} >= ${thirtyDaysAgo}`
        )
      )
      .groupBy(sql`DATE(${chats.createdAt})`)
      .orderBy(sql`DATE(${chats.createdAt})`);

    // Merge meeting and chat trends
    const trendsMap = new Map<string, { date: string; meetings: number; chats: number }>();
    
    usageTrends.forEach((trend) => {
      trendsMap.set(trend.date, {
        date: trend.date,
        meetings: trend.meetings,
        chats: trend.chats || 0,
      });
    });

    chatTrends.forEach((trend) => {
      const existing = trendsMap.get(trend.date);
      if (existing) {
        existing.chats = trend.chats;
      } else {
        trendsMap.set(trend.date, {
          date: trend.date,
          meetings: 0,
          chats: trend.chats,
        });
      }
    });

    const mergedTrends = Array.from(trendsMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    // Popular topics (extract from chat messages - simple keyword extraction)
    const popularTopics = await db
      .select({
        agentId: agents.id,
        agentName: agents.name,
        sampleContent: sql<string>`SUBSTRING(${chatMessages.content}, 1, 100)`.as("sample_content"),
      })
      .from(chatMessages)
      .innerJoin(chats, eq(chatMessages.chatId, chats.id))
      .innerJoin(agents, eq(chats.agentId, agents.id))
      .where(
        and(
          eq(chats.userId, userId),
          eq(chatMessages.role, "user")
        )
      )
      .groupBy(agents.id, agents.name, sql`SUBSTRING(${chatMessages.content}, 1, 100)`)
      .orderBy(desc(count(chatMessages.id)))
      .limit(10);

    return {
      agentPerformance: agentPerformanceWithResponseTime.map((ap) => ({
        agentId: ap.agentId,
        agentName: ap.agentName,
        totalMessages: Number(ap.totalMessages),
        avgResponseTime: Number(ap.avgResponseTime) || 0,
      })),
      meetingStats: {
        total: Number(stats.total),
        completed: Number(stats.completed),
        cancelled: Number(stats.cancelled),
        completionRate: Number(completionRate.toFixed(2)),
        avgDurationSeconds: Number(stats.avgDuration),
        totalDurationSeconds: Number(stats.totalDuration),
      },
      chatAnalytics: {
        messagesPerAgent: messagesPerAgent.map((mpa) => ({
          agentId: mpa.agentId,
          agentName: mpa.agentName,
          messageCount: Number(mpa.messageCount),
        })),
        popularTopics: popularTopics.map((pt) => ({
          agentId: pt.agentId,
          agentName: pt.agentName,
          sampleContent: pt.sampleContent,
        })),
      },
      usageTrends: mergedTrends,
    };
  }),
});

