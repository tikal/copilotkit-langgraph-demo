"use client";

import { useState, useCallback, useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";
import { AGENT_ID } from "../../lib/constants";

interface SavedThread {
  id: string;
  name: string;
  savedAt: string;
}

interface ThreadControlsProps {
  threadId: string;
  storageKey: string;
  onNewThread: () => void;
  onLoadThread: (id: string) => void;
}

export function ThreadControls({
  threadId,
  storageKey,
  onNewThread,
  onLoadThread,
}: ThreadControlsProps) {
  const { agent } = useAgent({ agentId: AGENT_ID });
  const messageCount = agent.messages?.length ?? 0;
  const savedThreadsKey = `${storageKey}-saved`;
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(savedThreadsKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [threadName, setThreadName] = useState("");

  useEffect(() => {
    localStorage.setItem(savedThreadsKey, JSON.stringify(savedThreads));
  }, [savedThreadsKey, savedThreads]);

  const handleSaveThread = useCallback(() => {
    const name = threadName.trim() || `Thread ${savedThreads.length + 1}`;
    setSavedThreads((prev) => [
      ...prev,
      {
        id: threadId,
        name,
        savedAt: new Date().toLocaleTimeString(),
      },
    ]);
    setThreadName("");
  }, [threadId, threadName, savedThreads.length]);

  const handleDeleteThread = useCallback((id: string) => {
    setSavedThreads((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="w-80 border-r p-4 bg-orange-50 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Thread Persistence</h1>
      <p className="text-sm text-gray-600">Save and load conversation threads</p>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-medium mb-2">Current Thread:</h2>
        <code className="text-xs bg-gray-100 p-2 rounded block break-all">
          {threadId}
        </code>
        <p className="text-xs text-gray-500 mt-1">Messages: {messageCount}</p>
        <button
          onClick={onNewThread}
          className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          New Thread
        </button>
      </div>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-medium mb-2">Save Current:</h2>
        <input
          type="text"
          value={threadName}
          onChange={(e) => setThreadName(e.target.value)}
          placeholder="Thread name (optional)"
          className="w-full px-3 py-2 border rounded text-sm mb-2"
        />
        <button
          onClick={handleSaveThread}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Save Thread
        </button>
      </div>

      <div className="bg-white p-4 rounded border flex-1 overflow-auto">
        <h2 className="font-medium mb-2">Saved Threads:</h2>
        {savedThreads.length === 0 ? (
          <p className="text-sm text-gray-500">No saved threads</p>
        ) : (
          <div className="flex flex-col gap-2">
            {savedThreads.map((thread) => (
              <div
                key={thread.id}
                className={`p-2 rounded border text-sm ${
                  thread.id === threadId
                    ? "bg-blue-100 border-blue-300"
                    : "bg-gray-50"
                }`}
              >
                <div className="font-medium">{thread.name}</div>
                <div className="text-xs text-gray-500">
                  {thread.id.slice(0, 8)}... | {thread.savedAt}
                </div>
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => onLoadThread(thread.id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    disabled={thread.id === threadId}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteThread(thread.id)}
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
  );
}
