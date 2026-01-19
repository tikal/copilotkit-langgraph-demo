"use client";

/**
 * Pattern 3: LangGraph + State Streaming
 *
 * This pattern demonstrates direct connection to a Python/LangGraph backend
 * with real-time state synchronization via useSingleEndpoint.
 *
 * USE CASE: Real-time progress UI, bidirectional state sync, or when you
 * need to show intermediate agent state (like a thinking indicator).
 *
 * ============================================================================
 * HOW IT WORKS
 * ============================================================================
 *
 * 1. CopilotKitProvider connects directly to Python backend via useSingleEndpoint
 * 2. Backend emits state updates via copilotkit_emit_state
 * 3. Frontend receives updates through useAgent().agent.state
 * 4. UI re-renders to show current status (Thinking indicator)
 */

import {
  CopilotKitProvider,
  useAgent,
} from "@copilotkit/react-core/v2";
import { ReactNode } from "react";
import { PatternPage } from "../components/PatternPage";
import { BACKEND_URL, AGENT_ID, AgentState } from "../lib/constants";

/**
 * Thinking Indicator Component
 *
 * Demonstrates useAgent hook for real-time state visualization.
 * The backend emits state via copilotkit_emit_state, which is
 * received here through the agent.state property.
 */
function ThinkingIndicator() {
  const { agent } = useAgent({ agentId: AGENT_ID });
  const status = (agent.state as AgentState | undefined)?.status;

  if (status !== "thinking") return null;

  return (
    <div className="absolute top-20 right-4 p-3 bg-white rounded-lg border shadow-lg">
      Thinking...
    </div>
  );
}

function Provider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl={BACKEND_URL}
      useSingleEndpoint
      onError={(error) => console.error("[CopilotKit Error]", error)}
    >
      <ThinkingIndicator />
      {children}
    </CopilotKitProvider>
  );
}

export default function Pattern3Page() {
  return (
    <PatternPage
      config={{
        name: "Pattern 3: LangGraph + State Streaming",
        description: "useAgent + copilotkit_emit_state for real-time state",
        headerColor: "bg-purple-50",
        storageKey: "cpk-p3-thread",
      }}
      renderProvider={(props) => <Provider {...props} />}
    />
  );
}
