"use client";

import { useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useAgent } from "@copilotkit/react-core/v2";
import type { AgentSubscriber } from "@ag-ui/client";
import { AGENT_ID } from "../lib/constants";

// Support both structured and free-form interrupts
type InterruptValue =
  | { action: string; args: { command: string; reason: string; original_message?: string } }
  | { message: string }
  | string;

/**
 * Parses the interrupt value from a custom event.
 * Handles both string and object formats, and unwraps the CopilotKit wrapper if present.
 */
function parseInterruptValue(value: unknown): InterruptValue | null {
  if (!value) return null;

  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return parsed as string; // Return string as-is if not valid JSON
    }
  }
  // Extract from __copilotkit_interrupt_value__ wrapper if present
  if ((parsed as Record<string, unknown>)?.__copilotkit_interrupt_value__) {
    parsed = (parsed as Record<string, unknown>).__copilotkit_interrupt_value__;
  }
  return parsed as InterruptValue;
}

/**
 * Reusable modal overlay wrapper to reduce duplication.
 */
function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Type guard for server_command_approval interrupt action.
 */
function isServerCommandApproval(
  interrupt: InterruptValue
): interrupt is { action: "server_command_approval"; args: { command: string; reason: string } } {
  return (
    typeof interrupt === "object" &&
    "action" in interrupt &&
    interrupt.action === "server_command_approval"
  );
}

/**
 * Extract display content from various interrupt value formats.
 */
function getDisplayContent(interrupt: InterruptValue): string {
  if (typeof interrupt === "string") return interrupt;
  if ("message" in interrupt) return interrupt.message;
  return JSON.stringify(interrupt, null, 2);
}

/**
 * Modal for server-side dangerous command approval.
 */
function ServerCommandApprovalModal({
  command,
  reason,
  onApprove,
  onCancel,
}: {
  command: string;
  reason: string;
  onApprove: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay>
      <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
        <span>🔒</span> Server Interrupt HITL
      </h3>
      <p className="text-sm text-gray-700 mt-3">{reason}</p>
      <div className="mt-3 p-3 bg-gray-100 rounded font-mono text-sm overflow-x-auto">
        {command}
      </div>
      <div className="flex gap-3 mt-5">
        <button
          onClick={onApprove}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
        >
          Execute
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-purple-500 mt-3">
        Interrupt-based HITL (interrupt() + agent.subscribe)
      </p>
    </ModalOverlay>
  );
}

/**
 * Modal for generic interrupt responses with free-form input.
 */
function GenericInputModal({
  content,
  onSubmit,
}: {
  content: string;
  onSubmit: (response: string) => void;
}) {
  return (
    <ModalOverlay>
      <h3 className="text-lg font-bold text-gray-800">Agent Needs Your Input</h3>
      <p className="text-gray-600 mt-3 whitespace-pre-wrap">{content}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget).get("response") as string);
        }}
        className="mt-4"
      >
        <input
          type="text"
          name="response"
          placeholder="Your response"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          type="submit"
          className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
        >
          Submit
        </button>
      </form>
    </ModalOverlay>
  );
}

/**
 * Best-practice interrupt handler for LangGraph interrupts with CopilotKit.
 *
 * Key principles:
 * 1. Single Instance - Place at Provider/parent level, never inside child views
 * 2. Lifecycle Awareness - Uses onRunStartedEvent to reset, onRunFinalized to show UI
 * 3. Generic Fallback - Supports both known action types and free-text responses
 * 4. Proper State Management - Uses local variable for pending, React state for display
 */
export function CustomInterruptHandler() {
  const { agent } = useAgent({ agentId: AGENT_ID });
  const [interrupt, setInterrupt] = useState<InterruptValue | null>(null);

  // Use a ref to track pending interrupt across lifecycle events
  // This prevents race conditions between custom event and run finalization
  const pendingInterruptRef = useRef<InterruptValue | null>(null);

  useEffect(() => {
    if (!agent) return;

    const subscriber: AgentSubscriber = {
      onCustomEvent: ({ event }) => {
        if (event.name === "on_interrupt") {
          // Parse and store, but DON'T show UI yet - wait for onRunFinalized
          pendingInterruptRef.current = parseInterruptValue(event.value);
        }
      },
      onRunStartedEvent: () => {
        // Reset on new run to clear any stale interrupt state
        pendingInterruptRef.current = null;
        setInterrupt(null);
      },
      onRunFinalized: () => {
        // NOW show the UI - the run is complete and safe to display
        if (pendingInterruptRef.current) {
          setInterrupt(pendingInterruptRef.current);
          pendingInterruptRef.current = null;
        }
      },
    };

    const { unsubscribe } = agent.subscribe(subscriber);
    return () => unsubscribe();
  }, [agent]);

  const handleResponse = useCallback((response: string) => {
    agent.runAgent({
      forwardedProps: {
        command: { resume: response },
      },
    });
    setInterrupt(null);
  }, [agent]);

  if (!interrupt) return null;

  if (isServerCommandApproval(interrupt)) {
    return (
      <ServerCommandApprovalModal
        command={interrupt.args.command}
        reason={interrupt.args.reason}
        onApprove={() => handleResponse("APPROVED")}
        onCancel={() => handleResponse("CANCEL")}
      />
    );
  }

  return <GenericInputModal content={getDisplayContent(interrupt)} onSubmit={handleResponse} />;
}
