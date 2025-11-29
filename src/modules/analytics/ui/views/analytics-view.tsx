"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { AnalyticsSection } from "../components/analytics-section";

export const AnalyticsView = () => {
  const trpc = useTRPC();
  const { data: analytics } = useSuspenseQuery(
    trpc.profile.getAnalytics.queryOptions()
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-6">
      <div className="pt-8 pb-4">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor agent performance, meeting outcomes, and chat usage over time.
        </p>
      </div>

      <AnalyticsSection analytics={analytics} />
    </div>
  );
};

export const AnalyticsViewLoading = () => (
  <div className="flex-1 pb-4 px-4 md:px-8">
    <LoadingState title="Loading analytics..." description="Please wait" />
  </div>
);

export const AnalyticsViewError = () => (
  <div className="flex-1 pb-4 px-4 md:px-8">
    <ErrorState
      title="Failed to load analytics"
      description="Please try again later"
    />
  </div>
);

