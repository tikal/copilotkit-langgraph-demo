"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ReactNode } from "react";
import { PatternPage } from "../components/PatternPage";
import { BACKEND_URL } from "../lib/constants";

function Provider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl={BACKEND_URL}
      useSingleEndpoint
      onError={(error) => console.error("[CopilotKit Error]", error)}
    >
      {children}
    </CopilotKitProvider>
  );
}

export default function Pattern3Page() {
  return (
    <PatternPage
      config={{
        name: "Pattern 3: useSingleEndpoint",
        description: "runtimeUrl + useSingleEndpoint",
        headerColor: "bg-purple-50",
        storageKey: "cpk-p3-thread",
      }}
      renderProvider={(props) => <Provider {...props} />}
    />
  );
}
