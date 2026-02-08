"use client";

import { CloudAtlasChatShell } from "@/components/cloudatlas/cloudatlas-chat-shell";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

/**
 * CloudAtlas chat page: AI Cloud Assistant with branding, theme toggle (light default), interactive background, and floating assistant character.
 */
export default function ChatPage() {
  const mcpServers = useMcpServers();
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const tamboUrl = process.env.NEXT_PUBLIC_TAMBO_URL;

  if (!apiKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full border border-border rounded-lg p-5">
          <div className="text-sm font-medium mb-2">Missing API key</div>
          <div className="text-sm text-muted-foreground">
            Set <code className="font-mono">NEXT_PUBLIC_TAMBO_API_KEY</code> to enable streaming chat.
          </div>
        </div>
      </div>
    );
  }

  return (
    <TamboProvider
      apiKey={apiKey}
      components={components}
      tools={tools}
      mcpServers={mcpServers}
      {...(typeof tamboUrl === "string" && tamboUrl.trim().length > 0
        ? { tamboUrl }
        : {})}
    >
      <CloudAtlasChatShell />
    </TamboProvider>
  );
}
