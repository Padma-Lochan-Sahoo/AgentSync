"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "../../types";
import { generateAvatarUri } from "@/lib/avatar";
import Image from "next/image";
import { BotIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { isValidUrl } from "@/lib/url-utils";

interface ChatMessagesProps {
  messages: ChatMessage[];
  agentName?: string;
  userName?: string;
  userImage?: string;
}

export const ChatMessages = ({
  messages,
  agentName = "Assistant",
  userName = "You",
  userImage,
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <BotIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm mt-2">Select an agent and send a message to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {!isUser && (
              <div className="flex-shrink-0">
                <Image
                  src={generateAvatarUri({
                    seed: agentName,
                    variant: "botttsNeutral",
                  })}
                  alt={agentName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              ) : (
                <div className="text-sm max-w-none">
                  <Markdown
                    components={{
                      p: (props) => (
                        <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
                      ),
                      h1: (props) => (
                        <h1 className="text-lg font-semibold mb-2 mt-3 first:mt-0" {...props} />
                      ),
                      h2: (props) => (
                        <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0" {...props} />
                      ),
                      h3: (props) => (
                        <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0" {...props} />
                      ),
                      ul: (props) => (
                        <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                      ),
                      ol: (props) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
                      ),
                      li: (props) => (
                        <li className="ml-2" {...props} />
                      ),
                      strong: (props) => (
                        <strong className="font-semibold" {...props} />
                      ),
                      em: (props) => (
                        <em className="italic" {...props} />
                      ),
                      code: (props) => {
                        const { className, children, ...rest } = props;
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs font-mono"
                            {...rest}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className="block bg-muted-foreground/20 p-2 rounded text-xs font-mono overflow-x-auto mb-2"
                            {...rest}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: (props) => (
                        <pre className="bg-muted-foreground/20 p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />
                      ),
                      blockquote: (props) => (
                        <blockquote className="border-l-4 border-muted-foreground/30 pl-3 italic my-2" {...props} />
                      ),
                      a: (props) => (
                        <a
                          className="text-primary underline hover:text-primary/80"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      hr: (props) => (
                        <hr className="my-3 border-muted-foreground/30" {...props} />
                      ),
                    }}
                  >
                    {message.content}
                  </Markdown>
                </div>
              )}
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {isUser && (
              <div className="flex-shrink-0">
                {userImage && isValidUrl(userImage) ? (
                  <Image
                    src={userImage}
                    alt={userName || "User"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

