"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { HttpAgent } from "@ag-ui/client";
import { ReactNode, useMemo } from "react";
import { AGENT_ID, BACKEND_URL } from "../lib/constants";

export default function Pattern1Layout({ children }: { children: ReactNode }) {
  const agent = useMemo(
    () =>
      new HttpAgent({
        url: BACKEND_URL,
        agentId: AGENT_ID,
      }),
    []
  );

  return (
    <CopilotKitProvider agents__unsafe_dev_only={{ [AGENT_ID]: agent }}>
      <div className="h-[calc(100vh-60px)]">{children}</div>
    </CopilotKitProvider>
  );
}
