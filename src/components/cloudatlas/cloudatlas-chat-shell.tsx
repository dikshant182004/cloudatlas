"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { DemoPromptsPanel } from "./demo-prompts-panel";
import { cn } from "@/lib/utils";
import { Moon, Sun, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import * as React from "react";

const THEME_KEY = "cloudatlas-theme";

export interface CloudAtlasChatShellProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * CloudAtlas chat shell: branding, theme toggle (dark default), interactive background, floating assistant.
 * Wraps chat content with header and theme-aware layout.
 */
export function CloudAtlasChatShell({
  children,
  className,
}: CloudAtlasChatShellProps) {
  // Default to dark theme; override from localStorage if user chose light
  const [dark, setDark] = React.useState(true);
  const [promptsPanelVisible, setPromptsPanelVisible] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light") setDark(false);
    else if (stored === "dark") setDark(true);
    else setDark(true); // default to dark theme
  }, []);

  const toggleTheme = React.useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <div
      className={cn(
        "cloudatlas-chat-shell flex flex-col h-screen w-full bg-background text-foreground overflow-hidden",
        dark && "dark",
        className
      )}
    >
      {/* Interactive chat background - behind content */}
      <div
        className="fixed inset-0 -z-10 cloudatlas-chat-bg"
        style={{ zIndex: -1 }}
        aria-hidden
      />

      {/* Header: CloudAtlas branding (theme-aware) + theme toggle */}
      <header
        className={cn(
          "shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border transition-colors duration-300",
          dark
            ? "bg-[#0d1117]/98 backdrop-blur-md"
            : "bg-background/90 backdrop-blur-sm"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "text-xl font-bold tracking-tight transition-colors",
                dark ? "text-[#58a6ff]" : "text-primary"
              )}
            >
              CloudAtlas
            </span>
            <span
              className={cn(
                "hidden sm:inline text-sm font-normal transition-colors",
                dark ? "text-[#8b949e]" : "text-muted-foreground"
              )}
            >
              AI Cloud Assistant
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            "rounded-lg p-2.5 border transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            dark
              ? "border-[#30363d] text-[#8b949e] hover:text-[#58a6ff] hover:border-[#58a6ff]/40 hover:bg-[#161B22]"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Main chat area: elevated surface in dark so messages pop */}
      <div className="flex-1 flex min-h-0 relative">
        {children ?? (
          <div
            className={cn(
              "cloudatlas-chat-main flex-1 min-w-0 flex transition-colors duration-300",
              dark &&
                "bg-[#161b22]/55 border-t border-[#30363d]/60 min-h-0"
            )}
          >
            {/* Chat Area with Prompts Panel */}
            <div className="flex-1 flex min-h-0">
              {/* Main Chat Content */}
              <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                <MessageThreadFull className="h-full max-w-6xl mx-auto w-full px-6" />
              </div>
              
              {/* Demo Prompts Panel */}
              {promptsPanelVisible && (
                <div className="w-80 flex-shrink-0 border-l border-border">
                  <DemoPromptsPanel />
                </div>
              )}
            </div>

            {/* Prompts Panel Toggle Button */}
            <button
              onClick={() => setPromptsPanelVisible(!promptsPanelVisible)}
              className={cn(
                "absolute top-4 right-4 z-10 p-2 rounded-lg border transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                dark
                  ? "bg-[#161b22]/90 border-[#30363d] text-[#58a6ff] hover:bg-[#21262d] hover:border-[#58a6ff]/50"
                  : "bg-background/90 border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
              aria-label={promptsPanelVisible ? "Hide prompts panel" : "Show prompts panel"}
              title={promptsPanelVisible ? "Hide Demo Prompts" : "Show Demo Prompts"}
            >
              {promptsPanelVisible ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
