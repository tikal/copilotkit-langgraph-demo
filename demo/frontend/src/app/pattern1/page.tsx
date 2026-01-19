"use client";

/**
 * Pattern 1: Direct AG-UI Connection
 *
 * This pattern demonstrates direct connection to an AG-UI compatible backend
 * using the HttpAgent from @ag-ui/client.
 *
 * USE CASE: Full control over agent connection, custom agent frameworks,
 * or when you need to manage the agent lifecycle manually.
 *
 * HOW IT WORKS:
 * 1. Create HttpAgent with backend URL and agent ID
 * 2. Pass agent to CopilotKitProvider via agents__unsafe_dev_only
 * 3. Frontend communicates directly with backend via AG-UI protocol
 *
 * PROS:
 * - Full control over agent connection
 * - Works with any AG-UI compatible backend
 * - Can manage multiple agents
 *
 * CONS:
 * - More setup required
 * - agents__unsafe_dev_only is for development only
 */

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { HttpAgent } from "@ag-ui/client";
import { useMemo, ReactNode } from "react";
import { PatternPage } from "../components/PatternPage";
import { AGENT_ID, BACKEND_URL } from "../lib/constants";

function Provider({
  children,
  threadId,
}: {
  children: ReactNode;
  threadId?: string;
}) {
  const agent = useMemo(
    () => new HttpAgent({ url: BACKEND_URL, agentId: AGENT_ID, threadId }),
    [threadId],
  );
  return (
    <CopilotKitProvider agents__unsafe_dev_only={{ [AGENT_ID]: agent }}>
      {children}
    </CopilotKitProvider>
  );
}

export default function Pattern1Page() {
  return (
    <PatternPage
      config={{
        name: "Pattern 1: Direct AG-UI",
        description: "HttpAgent + agents__unsafe_dev_only",
        headerColor: "bg-blue-50",
        storageKey: "cpk-p1-thread",
      }}
      renderProvider={(props) => <Provider {...props} />}
    />
  );
}
