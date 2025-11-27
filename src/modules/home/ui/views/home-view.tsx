"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Video, 
  Bot, 
  MessageSquare, 
  ArrowRight,
  Zap,
  Loader2
} from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { MeetingStatus } from '@/modules/meetings/types';

const features = [
  {
    icon: Video,
    title: "Meetings",
    description: "Schedule and manage meetings with AI agents. Connect with participants and let your agents join.",
    href: "/meetings",
    color: "blue",
  },
  {
    icon: Bot,
    title: "Agents",
    description: "Create and manage AI agents that can join your meetings with custom instructions.",
    href: "/agents",
    color: "purple",
  },
  {
    icon: MessageSquare,
    title: "Chatbot",
    description: "Chat directly with your AI agents and get intelligent responses instantly.",
    href: "/chatbot",
    color: "green",
  },
];

// Stats will be calculated from fetched data

const steps = [
  { title: "Create Agent", desc: "Set up your first AI agent with custom personality" },
  { title: "Schedule Meeting", desc: "Invite your agent to join a meeting" },
  { title: "Start Chatting", desc: "Get instant intelligent responses" },
];

const colorClasses = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", btn: "bg-blue-600 hover:bg-blue-700" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20", btn: "bg-purple-600 hover:bg-purple-700" },
  green: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-500/20", btn: "bg-green-600 hover:bg-green-700" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", btn: "bg-orange-600 hover:bg-orange-700" },
};

export const HomeView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  // Fetch data for statistics
  const { data: agentsData, isLoading: isLoadingAgents } = useQuery(
    trpc.agents.getMany.queryOptions({ page: 1, pageSize: 1 })
  );
  
  const { data: upcomingMeetingsData, isLoading: isLoadingUpcoming } = useQuery(
    trpc.meetings.getMany.queryOptions({ 
      page: 1, 
      pageSize: 1,
      status: MeetingStatus.Upcoming 
    })
  );
  
  const { data: completedMeetingsData, isLoading: isLoadingCompleted } = useQuery(
    trpc.meetings.getMany.queryOptions({ 
      page: 1, 
      pageSize: 1,
      status: MeetingStatus.Completed 
    })
  );

  // Calculate statistics
  const totalAgents = agentsData?.total ?? 0;
  const upcomingMeetings = upcomingMeetingsData?.total ?? 0;
  const completedMeetings = completedMeetingsData?.total ?? 0;

  const stats = [
    { label: "Total Agents", value: totalAgents.toString(), color: "blue" as const, isLoading: isLoadingAgents },
    { label: "Upcoming Meetings", value: upcomingMeetings.toString(), color: "purple" as const, isLoading: isLoadingUpcoming },
    { label: "Completed Meetings", value: completedMeetings.toString(), color: "green" as const, isLoading: isLoadingCompleted },
  ];

  const handleNavigation = (href: string) => {
    setLoadingHref(href);
    router.push(href);
  };

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-8">
      {/* Hero Section */}
      <div className="pt-8 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Welcome to AgentSync
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          Manage your AI agents, schedule meetings, and chat with intelligent assistants all in one place.
        </p>
        <button 
          onClick={() => handleNavigation("/agents")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const colors = colorClasses[stat.color as keyof typeof colorClasses];
          return (
            <div
              key={idx}
              className={`p-6 rounded-lg border ${colors.border} ${colors.bg} bg-card transition-all hover:shadow-md`}
            >
              <p className={`text-sm font-medium ${colors.text}`}>{stat.label}</p>
              {stat.isLoading ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold mt-2 text-foreground">{stat.value}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Cards */}
      <div>
        <h3 className="text-2xl md:text-3xl font-bold mb-8 text-foreground">Features</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            const isLoading = loadingHref === feature.href;
            return (
              <div
                key={idx}
                className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleNavigation(feature.href)}
              >
                <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <h4 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h4>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation(feature.href);
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      Loading...
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Go to {feature.title}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Getting Started Section */}
      <div>
        <h3 className="text-2xl md:text-3xl font-bold mb-8 text-foreground">Getting Started</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (idx === 0) handleNavigation("/agents");
                else if (idx === 1) handleNavigation("/meetings");
                else if (idx === 2) handleNavigation("/chatbot");
              }}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground mb-4">
                {idx + 1}
              </div>
              <h4 className="text-lg font-bold mb-2 text-foreground">{step.title}</h4>
              <p className="text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card p-8 md:p-12 rounded-lg border border-border text-center">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h3>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Start managing AI agents and scheduling intelligent meetings today.
        </p>
        <button 
          onClick={() => handleNavigation("/agents")}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Start Now
        </button>
      </div>
    </div>
  );
};