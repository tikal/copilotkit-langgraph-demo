"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";
import { AGENT_ID } from "../../lib/constants";

interface PatternChatPageProps {
  name: string;
  description: string;
  headerColor: string;
}

export function PatternChatPage({
  name,
  description,
  headerColor,
}: PatternChatPageProps) {
  const { agent } = useAgent({ agentId: AGENT_ID });

  return (
    <div className="h-full flex flex-col">
      <header className={`p-4 border-b ${headerColor}`}>
        <h1 className="text-xl font-bold">{name}</h1>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-sm text-gray-500 mt-1">
          Status:{" "}
          {String((agent.state as Record<string, unknown>)?.status ?? "idle")} |
          Running: {agent.isRunning ? "Yes" : "No"}
        </p>
      </header>
      <main className="flex-1 min-h-0">
        <CopilotChat agentId={AGENT_ID} />
      </main>
    </div>
  );
}
