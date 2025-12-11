"use client";

import { ReactNode, ReactElement, useState, cloneElement } from "react";
import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";
import { AGENT_ID, AgentState } from "../lib/constants";
import { useThreadManager } from "../hooks/useThreadManager";

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
            {activeTab === "chat" && <ChatView />}
            {activeTab === "state" && <StateView />}
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

function ChatView() {
  return (
    <div className="flex-1 min-h-0">
      <CopilotChat agentId={AGENT_ID} />
    </div>
  );
}

function StateView() {
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
      <div className="flex-1 min-h-0">
        <CopilotChat agentId={AGENT_ID} />
      </div>
    </>
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
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-2 bg-gray-100 text-xs border-b">
          Thread: <code className="bg-white px-1 rounded">{threadId}</code>
        </div>
        <div className="flex-1 min-h-0">
          <CopilotChat agentId={AGENT_ID} threadId={threadId} />
        </div>
      </div>
    </>
  );
}
