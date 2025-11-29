"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { ProfileAnalytics } from "@/modules/profile/types";
import { Clock, MessageSquare, Video, CheckCircle2 } from "lucide-react";

interface AnalyticsSectionProps {
  analytics: ProfileAnalytics;
}

const chartConfig = {
  meetings: {
    label: "Meetings",
    color: "hsl(var(--chart-1))",
  },
  chats: {
    label: "Chats",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const AnalyticsSection = ({ analytics }: AnalyticsSectionProps) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const totalMessages = analytics.chatAnalytics.messagesPerAgent.reduce(
    (sum, agent) => sum + agent.messageCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.meetingStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.meetingStats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.meetingStats.completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.meetingStats.completed} of {analytics.meetingStats.total} meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(analytics.meetingStats.avgDurationSeconds)}
            </div>
            <p className="text-xs text-muted-foreground">Per meeting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends (Last 30 Days)</CardTitle>
          <CardDescription>
            Stacked area chart showing daily meeting and chat activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={analytics.usageTrends}>
                <defs>
                  <linearGradient id="meetingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="chatsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="meetings"
                  stackId="1"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#meetingsGradient)"
                  name="Meetings"
                />
                <Area
                  type="monotone"
                  dataKey="chats"
                  stackId="1"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#chatsGradient)"
                  name="Chats"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Response time and message count by agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.agentPerformance.length > 0 ? (
              analytics.agentPerformance.map((agent) => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{agent.agentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.totalMessages} messages
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatResponseTime(agent.avgResponseTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg response time</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No agent performance data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages per Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Messages per Agent</CardTitle>
          <CardDescription>Total messages by agent</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.chatAnalytics.messagesPerAgent.length > 0 ? (
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analytics.chatAnalytics.messagesPerAgent}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="agentName"
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="messageCount"
                    fill="hsl(var(--chart-1))"
                    name="Messages"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No chat data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Popular Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Chat Topics</CardTitle>
          <CardDescription>Sample topics from your conversations</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.chatAnalytics.popularTopics.length > 0 ? (
            <div className="space-y-2">
              {analytics.chatAnalytics.popularTopics.slice(0, 5).map((topic, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium">{topic.agentName}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {topic.sampleContent}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No chat topics available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

