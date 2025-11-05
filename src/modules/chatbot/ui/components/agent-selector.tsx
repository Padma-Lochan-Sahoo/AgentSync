"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BotIcon, Plus, MessageSquarePlus, Loader2 } from "lucide-react";
import { generateAvatarUri } from "@/lib/avatar";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";

interface AgentSelectorProps {
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
  onNewChat: () => void;
  isCreatingChat?: boolean;
}

export const AgentSelector = ({
  selectedAgentId,
  onAgentSelect,
  onNewChat,
  isCreatingChat = false,
}: AgentSelectorProps) => {
  const trpc = useTRPC();
  const { data: agents } = useQuery(trpc.agents.getMany.queryOptions({}));
  const [newAgentDialogOpen, setNewAgentDialogOpen] = useState(false);

  const selectedAgent = agents?.items.find((a) => a.id === selectedAgentId);

  return (
    <>
      <NewAgentDialog
        open={newAgentDialogOpen}
        onOpenChange={setNewAgentDialogOpen}
      />
      <div className="flex items-center gap-2 p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start gap-2">
              {selectedAgent ? (
                <>
                  <Image
                    src={generateAvatarUri({
                      seed: selectedAgent.name,
                      variant: "botttsNeutral",
                    })}
                    alt={selectedAgent.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span>{selectedAgent.name}</span>
                </>
              ) : (
                <>
                  <BotIcon className="h-4 w-4" />
                  <span>Select an agent</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {agents?.items.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => onAgentSelect(agent.id)}
                className="flex items-center gap-2"
              >
                <Image
                  src={generateAvatarUri({
                    seed: agent.name,
                    variant: "botttsNeutral",
                  })}
                  alt={agent.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span>{agent.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          onClick={onNewChat} 
          variant="outline" 
          size="icon" 
          title="New Chat"
          disabled={isCreatingChat || !selectedAgentId}
        >
          {isCreatingChat ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-4 w-4" />
          )}
        </Button>
        <Button
          onClick={() => setNewAgentDialogOpen(true)}
          variant="outline"
          size="icon"
          title="New Agent"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

