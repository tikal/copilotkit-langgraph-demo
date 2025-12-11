"use client";

import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ThreadControls } from "../../components/shared/ThreadControls";
import { useThreadManager } from "../../hooks/useThreadManager";
import { AGENT_ID } from "../../lib/constants";

const STORAGE_KEY = "copilotkit-pattern2-thread";

export default function Pattern2ThreadsPage() {
  const { threadId, isHydrated, onNewThread, onLoadThread } =
    useThreadManager(STORAGE_KEY);

  if (!isHydrated) return null;

  return (
    <CopilotKitProvider key={threadId} runtimeUrl="/api/copilotkit">
      <div className="h-full flex">
        <ThreadControls
          threadId={threadId}
          storageKey={STORAGE_KEY}
          onNewThread={onNewThread}
          onLoadThread={onLoadThread}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="p-2 bg-gray-100 text-xs border-b">
            Thread: <code className="bg-white px-1 rounded">{threadId}</code>
          </div>
          <div className="flex-1 min-h-0">
            <CopilotChat agentId={AGENT_ID} threadId={threadId} />
          </div>
        </div>
      </div>
    </CopilotKitProvider>
  );
}
