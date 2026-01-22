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
import { useHumanInTheLoop } from "@copilotkit/react-core";
import { ReactNode, useState } from "react";
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

/**
 * Frontend-Triggered HITL (Amber UI)
 *
 * Agent-driven approval - the LLM decides when to call this tool.
 * Can theoretically be bypassed if LLM chooses not to call it.
 */
function ApprovalTool() {
  useHumanInTheLoop({
    name: "requestApproval",
    description: "Request human approval before performing a sensitive action",
    parameters: [
      {
        name: "action",
        type: "string",
        description: "The action requiring approval",
        required: true,
      },
      {
        name: "reason",
        type: "string",
        description: "Why this action needs approval",
        required: false,
      },
    ],
    render: ({ args, respond, status }) => {
      if (status === "complete" || !respond) return null;

      return (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg my-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600 text-lg">⚠️</span>
            <p className="font-bold text-amber-800">Frontend HITL - Agent Request</p>
          </div>
          <p className="text-sm text-amber-700 mt-1">{args.action}</p>
          {args.reason && (
            <p className="text-xs text-amber-600 mt-1 italic">{args.reason}</p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => respond("APPROVED")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Approve
            </button>
            <button
              onClick={() => respond("DENIED")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
            >
              Deny
            </button>
          </div>
          <p className="text-xs text-amber-500 mt-2">
            Agent-triggered (LLM chose to request approval)
          </p>
        </div>
      );
    },
  });

  return null;
}

function HITLHint() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="absolute top-20 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm z-10">
      <div className="flex justify-between items-start gap-2 mb-3">
        <p className="text-sm font-bold text-gray-800">Two HITL Patterns</p>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <div className="p-2 bg-amber-50 border border-amber-200 rounded">
          <p className="text-xs font-semibold text-amber-800">Frontend HITL (Amber)</p>
          <p className="text-xs text-amber-700 mt-1">
            Try: "Delete all my files"
          </p>
          <p className="text-xs text-amber-600 italic">
            useHumanInTheLoop - LLM-triggered
          </p>
        </div>

        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
          <p className="text-xs font-semibold text-purple-800">Server Interrupt HITL (Purple)</p>
          <p className="text-xs text-purple-700 mt-1">
            Try: "How to use rm -rf?"
          </p>
          <p className="text-xs text-purple-600 italic">
            interrupt() + agent.subscribe - Server-enforced
          </p>
        </div>
      </div>
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
      <HITLHint />
      <ApprovalTool />
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
