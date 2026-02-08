"use client";

import {
  MessageInput,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

export interface CloudAtlasLayoutProps {
  children: React.ReactNode;
  /** Canvas area: assistant-generated content (graphs, tables, cards) */
  canvas?: React.ReactNode;
  /** Chat panel width when open */
  chatWidth?: string;
  /** Initial chat open state */
  defaultChatOpen?: boolean;
  className?: string;
}

/**
 * CloudAtlas workspace layout: full-height dark canvas + docked chat panel + floating assistant.
 * Canvas is primary (left/center); chat is right or bottom. No rigid grid.
 */
export function CloudAtlasLayout({
  children,
  canvas,
  chatWidth = "380px",
  defaultChatOpen = true,
  className,
}: CloudAtlasLayoutProps) {
  const [isChatOpen, setIsChatOpen] = React.useState(defaultChatOpen);

  return (
    <div
      className={cn(
        "cloudatlas flex h-screen w-full bg-background text-foreground",
        "dark",
        className
      )}
    >
      {/* Primary canvas: graph, tables, generated cards */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden",
          "cloudatlas-canvas"
        )}
      >
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {canvas ?? children}
        </div>
      </div>

      {/* Chat panel docked right */}
      <div
        className="relative shrink-0 border-l border-border transition-all duration-300"
        style={
          isChatOpen
            ? { width: chatWidth, minWidth: chatWidth }
            : { width: 32, minWidth: 32 }
        }
      >
        <div
          className={cn(
            "flex flex-col h-full bg-card/50 transition-all duration-300 overflow-hidden",
            isChatOpen ? "" : "w-0 border-l-0 opacity-0"
          )}
          style={isChatOpen ? { width: "100%" } : undefined}
        >
          {isChatOpen && (
            <>
              <div className="p-4 border-b border-border shrink-0">
                <h2 className="text-base font-semibold text-foreground">
                  CloudAtlas Assistant
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ask about your cloud resources, graphs, or risks.
                </p>
              </div>
              <ScrollableMessageContainer className="flex-1 p-4 min-h-0">
                <ThreadContent variant="default">
                  <ThreadContentMessages />
                </ThreadContent>
              </ScrollableMessageContainer>
              <div className="p-4 border-t border-border shrink-0">
                <MessageInput variant="bordered">
                  <MessageInputTextarea placeholder="Ask about resources, show a graph, or list risks..." />
                  <MessageInputToolbar>
                    <MessageInputSubmitButton />
                  </MessageInputToolbar>
                </MessageInput>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-30 rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 shadow-sm",
            isChatOpen ? "-left-3" : "left-1"
          )}
          style={{ width: 28, height: 28 }}
          aria-label={isChatOpen ? "Close chat" : "Open chat"}
        >
          {isChatOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
