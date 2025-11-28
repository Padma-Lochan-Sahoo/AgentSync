"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { AgentSelector } from "../components/agent-selector";
import { ChatMessages } from "../components/chat-messages";
import { ChatInput } from "../components/chat-input";
import { ChatHistory } from "../components/chat-history";
import { authClient } from "@/lib/auth-client";
import { LoadingState } from "@/components/loading-state";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";

export const ChatbotView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  // Get agents
  const { data: agents } = useQuery(trpc.agents.getMany.queryOptions({}));

  // Get chats for selected agent
  const { data: chats } = useQuery({
    ...trpc.chatbot.getMany.queryOptions({ agentId: selectedAgentId! }),
    enabled: !!selectedAgentId,
  });

  // Get current chat
  const { data: currentChat, isLoading: isLoadingChat } = useQuery({
    ...trpc.chatbot.getOne.queryOptions({ id: currentChatId! }),
    enabled: !!currentChatId,
  });

  // Get messages
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    ...trpc.chatbot.getMessages.queryOptions({ chatId: currentChatId! }),
    enabled: !!currentChatId,
  });

  // Create chat mutation
  const { mutateAsync: createChat, isPending: isCreatingChat } = useMutation(
    trpc.chatbot.create.mutationOptions()
  );

  // Send message mutation
  const { mutateAsync: sendMessage, isPending: isSendingMessage } = useMutation(
    trpc.chatbot.sendMessage.mutationOptions()
  );

  // Delete chat mutation
  const { mutateAsync: deleteChat } = useMutation(
    trpc.chatbot.remove.mutationOptions()
  );

  // Confirmation dialog for deleting chat
  const [DeleteConfirmation, confirmDelete] = useConfirm(
    "Delete Chat",
    "Are you sure you want to delete this chat? This action cannot be undone."
  );

  // Auto-select first agent if available
  useEffect(() => {
    if (agents?.items && agents.items.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents.items[0].id);
    }
  }, [agents, selectedAgentId]);

  // Load most recent chat when agent changes
  useEffect(() => {
    if (chats && chats.length > 0 && selectedAgentId) {
      // If current chat doesn't belong to selected agent, load most recent chat
      const currentChatBelongsToAgent = currentChat?.agentId === selectedAgentId;
      if (!currentChatBelongsToAgent) {
        const mostRecentChat = chats[0];
        setCurrentChatId(mostRecentChat.id);
      }
    } else if (chats && chats.length === 0) {
      // No chats for this agent, reset current chat
      setCurrentChatId(null);
    }
  }, [selectedAgentId, chats, currentChat?.agentId]);

  const handleNewChat = async () => {
    if (!selectedAgentId) return;

    try {
      const newChat = await createChat({ agentId: selectedAgentId });
      
      // Set the new chat as current immediately - this will trigger the UI to show the new chat
      setCurrentChatId(newChat.id);
      
      // Invalidate all message queries to clear any cached messages from previous chats
      queryClient.invalidateQueries({
        queryKey: [["chatbot", "getMessages"]],
      });
      
      // Invalidate and refetch chats list to ensure the new chat appears
      await queryClient.invalidateQueries({
        queryKey: [["chatbot", "getMany"]],
      });
      
      // Refetch chats to ensure the new chat appears in the list immediately
      await queryClient.refetchQueries({
        queryKey: [["chatbot", "getMany"]],
      });
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentChatId) {
      // Create a new chat if none exists
      if (!selectedAgentId) return;
      try {
        const newChat = await createChat({ agentId: selectedAgentId });
        setCurrentChatId(newChat.id);
        // Send message after chat is created
        await sendMessage({ chatId: newChat.id, content });
        queryClient.invalidateQueries({
          queryKey: [["chatbot", "getMessages"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["chatbot", "getMany"]],
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    } else {
      try {
        await sendMessage({ chatId: currentChatId, content });
        queryClient.invalidateQueries({
          queryKey: [["chatbot", "getMessages"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["chatbot", "getMany"]],
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;

    setDeletingChatId(chatId);

    try {
      await deleteChat({ id: chatId });
      
      // If deleted chat was current, switch to another or null
      if (chatId === currentChatId) {
        const remainingChats = chats?.filter((c) => c.id !== chatId);
        if (remainingChats && remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
        } else {
          setCurrentChatId(null);
        }
      }

      await queryClient.invalidateQueries({
        queryKey: [["chatbot", "getMany"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["chatbot", "getMessages"]],
      });
      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error(`Failed to delete chat, ${error}`);
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  if (!agents || agents.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No agents available</p>
          <p className="text-sm mt-2">Create an agent first to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DeleteConfirmation />
      <div className="flex flex-col h-full bg-background">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onAgentSelect={(agentId) => {
            setSelectedAgentId(agentId);
          }}
          onNewChat={handleNewChat}
          isCreatingChat={isCreatingChat}
        />
        <div className="flex-1 flex min-h-0">
          <ChatHistory
            agentId={selectedAgentId}
            selectedChatId={currentChatId}
            onChatSelect={handleChatSelect}
            onDeleteChat={handleDeleteChat}
            deletingChatId={deletingChatId}
          />
          <div className="flex-1 flex flex-col min-h-0">
            {isLoadingChat || isLoadingMessages ? (
              <LoadingState title="Loading chat..." description="It take some time"/>
            ) : (
              <ChatMessages
                messages={messagesData?.items || []}
                agentName={currentChat?.agent.name}
                userName={session?.user.name}
                userImage={session?.user.image || undefined}
              />
            )}
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isSendingMessage || isCreatingChat}
              disabled={!selectedAgentId}
            />
          </div>
        </div>
      </div>
    </>
  );
};

