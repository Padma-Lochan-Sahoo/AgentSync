import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";

import { auth } from "@/lib/auth";
import { ChatbotView } from "@/modules/chatbot/ui/views/chatbot-view";
import { LoadingState } from "@/components/loading-state";

const ChatbotViewError = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center text-destructive">
      <p className="text-lg font-medium">Failed to load chatbot</p>
      <p className="text-sm mt-2">Please try refreshing the page</p>
    </div>
  </div>
);

const ChatbotViewLoading = () => (
  <LoadingState title="Loading chatbot..." description="This may take a few seconds" />
);

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="h-full">
      <Suspense fallback={<ChatbotViewLoading />}>
        <ErrorBoundary fallback={<ChatbotViewError />}>
          <ChatbotView />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
};

export default Page;

