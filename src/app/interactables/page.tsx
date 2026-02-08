"use client";

import { CloudAtlasLayout } from "@/components/cloudatlas/cloudatlas-layout";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

/**
 * CloudAtlas workspace: graph-first, assistant-driven cloud infrastructure explorer.
 * Canvas (left) shows assistant-generated content: CloudGraph, ResourceTable, RiskCard.
 * Chat is docked right; floating assistant character in bottom-right.
 */
export default function InteractablesPage() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full border border-border rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Missing API key</div>
          <div className="text-sm text-muted-foreground">
            Set <code className="font-mono">NEXT_PUBLIC_TAMBO_API_KEY</code> to enable the assistant.
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
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <CloudAtlasLayout
        defaultChatOpen
        chatWidth="380px"
      >
        {/* Canvas: empty by default; assistant renders CloudGraph, ResourceTable, RiskCard here via thread messages */}
        <div className="flex flex-col gap-4 max-w-4xl">
          <p className="text-muted-foreground text-sm">
            Ask the assistant to explore your cloud: e.g. &quot;Show me a graph of my resources&quot;, &quot;List my EC2 instances&quot;, or &quot;Summarize risks.&quot;
          </p>
        </div>
      </CloudAtlasLayout>
    </TamboProvider>
  );
}
