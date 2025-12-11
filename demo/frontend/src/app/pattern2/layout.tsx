"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ReactNode } from "react";

export default function Pattern2Layout({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      <div className="h-[calc(100vh-60px)]">{children}</div>
    </CopilotKitProvider>
  );
}
