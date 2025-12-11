"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ReactNode } from "react";
import { PatternPage } from "../components/PatternPage";

function Provider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKitProvider>
  );
}

export default function Pattern2Page() {
  return (
    <PatternPage
      config={{
        name: "Pattern 2: Next.js Proxy",
        description: "runtimeUrl → /api/copilotkit",
        headerColor: "bg-green-50",
        storageKey: "cpk-p2-thread",
      }}
      renderProvider={(props) => <Provider {...props} />}
    />
  );
}
