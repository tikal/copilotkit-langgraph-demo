"use client";

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
