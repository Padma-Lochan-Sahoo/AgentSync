"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
  agentId: string | null;
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  deletingChatId: string | null;
}

export const ChatHistory = ({
  agentId,
  selectedChatId,
  onChatSelect,
  onDeleteChat,
  deletingChatId,
}: ChatHistoryProps) => {
  const trpc = useTRPC();
  const { data: chats, isLoading } = useQuery({
    ...trpc.chatbot.getMany.queryOptions({ agentId: agentId! }),
    enabled: !!agentId,
  });

  if (!agentId) {
    return (
      <div className="w-64 border-r p-4">
        <p className="text-sm text-muted-foreground">Select an agent to view chats</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-64 border-r p-4">
        <p className="text-sm text-muted-foreground">Loading chats...</p>
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="w-64 border-r p-4">
        <p className="text-sm text-muted-foreground">No chats yet</p>
      </div>
    );
  }

  return (
    <div className="w-64 border-r flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">Chat History</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group relative flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer",
                selectedChatId === chat.id && "bg-accent"
              )}
              onClick={() => onChatSelect(chat.id)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {chat.title || `Chat with ${chat.agent.name}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 transition-opacity",
                  deletingChatId === chat.id 
                    ? "opacity-100" 
                    : "opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                disabled={deletingChatId === chat.id}
              >
                {deletingChatId === chat.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

