"use client";

import React, {
  ReactNode,
  ReactElement,
  useState,
  cloneElement,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatAssistantMessageProps,
  useAgent,
  useCopilotKit,
  Message,
} from "@copilotkit/react-core/v2";
import { AGENT_ID, AgentState } from "../lib/constants";
import { useThreadManager } from "../hooks/useThreadManager";

/**
 * Context to provide regenerate function from a stable parent.
 * This prevents the regenerate callback from being interrupted when
 * the message component unmounts during message list updates.
 */
const RegenerateContext = createContext<{
  regenerate: (messageId: string) => void;
} | null>(null);

/**
 * Calculates which messages to keep when regenerating an assistant message.
 * Returns messages up to and including the user message that triggered the assistant response.
 */
function getMessagesBeforeRegeneration(
  messages: Message[],
  targetMessageIndex: number
): Message[] {
  // Edge case: regenerating the first assistant message
  if (targetMessageIndex === 0) {
    return messages.length > 1 ? messages.slice(0, 2) : messages.slice(0, 1);
  }

  // Find the last user message before the target assistant message
  const lastUserMessage = messages
    .slice(0, targetMessageIndex)
    .reverse()
    .find((msg) => msg.role === "user");

  if (!lastUserMessage) {
    // Fallback: keep only the first message (typically system message)
    return [messages[0]];
  }

  // Find index and slice up to (and including) that user message
  const userMessageIndex = messages.findIndex((msg) => msg.id === lastUserMessage.id);
  return messages.slice(0, userMessageIndex + 1);
}

/**
 * Provider that implements the regenerate logic at a stable parent level.
 * The hook refs ensure the latest agent/copilotkit are used even if they change.
 */
function RegenerateProvider({ children }: { children: ReactNode }) {
  const { agent } = useAgent({ agentId: AGENT_ID });
  const { copilotkit } = useCopilotKit();

  // Store refs to always have the latest values
  const agentRef = useRef(agent);
  const copilotkitRef = useRef(copilotkit);
  agentRef.current = agent;
  copilotkitRef.current = copilotkit;

  /**
   * Regenerates an assistant message by:
   * 1. Finding the user message that triggered it
   * 2. Truncating history to include only messages up to (and including) that user message
   * 3. Re-running the agent, which the backend detects as regeneration
   *    (checkpoint has more messages than frontend sent)
   */
  const regenerate = useCallback((messageId: string) => {
    const currentAgent = agentRef.current;
    const currentCopilotkit = copilotkitRef.current;

    if (!currentAgent) return;

    const messages = currentAgent.messages ?? [];
    if (messages.length === 0) return;

    const reloadMessageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (reloadMessageIndex === -1) return;
    if (messages[reloadMessageIndex].role !== "assistant") return;

    // Calculate which messages to keep
    const historyCutoff = getMessagesBeforeRegeneration(messages, reloadMessageIndex);

    currentAgent.setMessages(historyCutoff);
    currentCopilotkit.runAgent({ agent: currentAgent });
  }, []);

  return (
    <RegenerateContext.Provider value={{ regenerate }}>
      {children}
    </RegenerateContext.Provider>
  );
}

/**
 * Custom AssistantMessage component that wires up the regenerate callback.
 * It delegates to the parent RegenerateProvider context to avoid unmount issues.
 */
function AssistantMessageWithRegenerate(props: CopilotChatAssistantMessageProps) {
  const ctx = useContext(RegenerateContext);

  const handleRegenerate = useCallback(() => {
    if (!props.message?.id || !ctx) return;
    ctx.regenerate(props.message.id);
  }, [props.message?.id, ctx]);

  return (
    <CopilotChatAssistantMessage
      {...props}
      onRegenerate={handleRegenerate}
    />
  );
}

export interface PatternConfig {
  name: string;
  description: string;
  headerColor: string;
  storageKey: string;
}

export interface PatternPageProps {
  config: PatternConfig;
  renderProvider: (props: {
    children: ReactNode;
    threadId?: string;
  }) => ReactElement;
}

type Tab = "chat" | "state" | "threads";

export function PatternPage({ config, renderProvider }: PatternPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const { threadId, isHydrated, onNewThread, onLoadThread } = useThreadManager(
    config.storageKey,
  );

  if (!isHydrated) return null;

  return cloneElement(
    renderProvider({
      threadId: activeTab === "threads" ? threadId : undefined,
      children: (
        <div className="h-[calc(100vh-60px)] flex flex-col">
          <header className={`p-4 border-b ${config.headerColor}`}>
            <h1 className="text-xl font-bold">{config.name}</h1>
            <p className="text-sm text-gray-600">{config.description}</p>
            <AgentStatus />
          </header>
          <div className="flex border-b bg-gray-50">
            {(["chat", "state", "threads"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600 bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <main className="flex-1 min-h-0 flex">
            {activeTab === "chat" && <ChatView threadId={threadId} />}
            {activeTab === "state" && <StateView threadId={threadId} />}
            {activeTab === "threads" && (
              <ThreadsView
                threadId={threadId}
                storageKey={config.storageKey}
                onNewThread={onNewThread}
                onLoadThread={onLoadThread}
              />
            )}
          </main>
        </div>
      ),
    }),
    { key: activeTab === "threads" ? threadId : "default" },
  );
}

function AgentStatus() {
  const { agent } = useAgent({ agentId: AGENT_ID });
  return (
    <p className="text-sm text-gray-500 mt-1">
      Status: {(agent.state as AgentState)?.status ?? "idle"} | Running:{" "}
      {agent.isRunning ? "Yes" : "No"}
    </p>
  );
}

function ChatView({ threadId }: { threadId: string }) {
  return (
    <RegenerateProvider>
      <div className="flex-1 min-h-0">
        <CopilotChat
          agentId={AGENT_ID}
          threadId={threadId}
          messageView={{ assistantMessage: AssistantMessageWithRegenerate }}
        />
      </div>
    </RegenerateProvider>
  );
}

function StateView({ threadId }: { threadId: string }) {
  const { agent } = useAgent({ agentId: AGENT_ID });
  const state = agent.state as AgentState | undefined;

  return (
    <>
      <div className="w-80 border-r p-4 bg-purple-50 flex flex-col gap-4">
        <h2 className="text-lg font-bold">Bidirectional State</h2>
        <p className="text-sm text-gray-600">
          Frontend can update state that syncs with backend
        </p>
        <div className="bg-white p-4 rounded border">
          <h3 className="font-medium mb-2">Current State:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
        <div className="bg-white p-4 rounded border">
          <h3 className="font-medium mb-2">Counter Control:</h3>
          <div className="flex gap-2">
            <button
              onClick={() =>
                agent.setState({ ...state, counter: (state?.counter || 0) - 1 })
              }
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              -
            </button>
            <span className="px-4 py-2 bg-gray-100 rounded font-mono">
              {state?.counter ?? 0}
            </span>
            <button
              onClick={() =>
                agent.setState({ ...state, counter: (state?.counter || 0) + 1 })
              }
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              +
            </button>
          </div>
        </div>
        <div className="bg-white p-4 rounded border">
          <h3 className="font-medium mb-2">Status Control:</h3>
          <div className="flex flex-wrap gap-2">
            {["idle", "working", "done", "error"].map((s) => (
              <button
                key={s}
                onClick={() => agent.setState({ ...state, status: s })}
                className={`px-3 py-1 rounded text-sm ${state?.status === s ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <StateChatView threadId={threadId} />
    </>
  );
}

function StateChatView({ threadId }: { threadId: string }) {
  return (
    <RegenerateProvider>
      <div className="flex-1 min-h-0">
        <CopilotChat
          agentId={AGENT_ID}
          threadId={threadId}
          messageView={{ assistantMessage: AssistantMessageWithRegenerate }}
        />
      </div>
    </RegenerateProvider>
  );
}

function ThreadsView({
  threadId,
  storageKey,
  onNewThread,
  onLoadThread,
}: {
  threadId: string;
  storageKey: string;
  onNewThread: () => void;
  onLoadThread: (id: string) => void;
}) {
  const { agent } = useAgent({ agentId: AGENT_ID });
  const [savedThreads, setSavedThreads] = useState<
    { id: string; name: string; savedAt: string }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}-saved`) || "[]");
    } catch {
      return [];
    }
  });
  const [threadName, setThreadName] = useState("");

  const save = () => {
    const updated = [
      ...savedThreads,
      {
        id: threadId,
        name: threadName.trim() || `Thread ${savedThreads.length + 1}`,
        savedAt: new Date().toLocaleTimeString(),
      },
    ];
    setSavedThreads(updated);
    localStorage.setItem(`${storageKey}-saved`, JSON.stringify(updated));
    setThreadName("");
  };

  const remove = (id: string) => {
    const updated = savedThreads.filter((t) => t.id !== id);
    setSavedThreads(updated);
    localStorage.setItem(`${storageKey}-saved`, JSON.stringify(updated));
  };

  return (
    <>
      <div className="w-80 border-r p-4 bg-orange-50 flex flex-col gap-4">
        <h2 className="text-lg font-bold">Thread Persistence</h2>
        <p className="text-sm text-gray-600">
          Save and load conversation threads
        </p>
        <div className="bg-white p-4 rounded border">
          <h3 className="font-medium mb-2">Current Thread:</h3>
          <code className="text-xs bg-gray-100 p-2 rounded block break-all">
            {threadId}
          </code>
          <p className="text-xs text-gray-500 mt-1">
            Messages: {agent.messages?.length ?? 0}
          </p>
          <button
            onClick={onNewThread}
            className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            New Thread
          </button>
        </div>
        <div className="bg-white p-4 rounded border">
          <h3 className="font-medium mb-2">Save Current:</h3>
          <input
            type="text"
            value={threadName}
            onChange={(e) => setThreadName(e.target.value)}
            placeholder="Thread name (optional)"
            className="w-full px-3 py-2 border rounded text-sm mb-2"
          />
          <button
            onClick={save}
            className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Save Thread
          </button>
        </div>
        <div className="bg-white p-4 rounded border flex-1 overflow-auto">
          <h3 className="font-medium mb-2">Saved Threads:</h3>
          {savedThreads.length === 0 ? (
            <p className="text-sm text-gray-500">No saved threads</p>
          ) : (
            <div className="flex flex-col gap-2">
              {savedThreads.map((t) => (
                <div
                  key={t.id}
                  className={`p-2 rounded border text-sm ${t.id === threadId ? "bg-blue-100 border-blue-300" : "bg-gray-50"}`}
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">
                    {t.id.slice(0, 8)}... | {t.savedAt}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => onLoadThread(t.id)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      disabled={t.id === threadId}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ThreadsChatView threadId={threadId} />
    </>
  );
}

function ThreadsChatView({ threadId }: { threadId: string }) {
  return (
    <RegenerateProvider>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-2 bg-gray-100 text-xs border-b">
          Thread: <code className="bg-white px-1 rounded">{threadId}</code>
        </div>
        <div className="flex-1 min-h-0">
          <CopilotChat
            agentId={AGENT_ID}
            threadId={threadId}
            messageView={{ assistantMessage: AssistantMessageWithRegenerate }}
          />
        </div>
      </div>
    </RegenerateProvider>
  );
}
