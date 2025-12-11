"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ReactNode } from "react";
import { BACKEND_URL } from "../lib/constants";

export default function Pattern3Layout({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider runtimeUrl={BACKEND_URL} useSingleEndpoint={true}>
      <div className="h-[calc(100vh-60px)]">{children}</div>
    </CopilotKitProvider>
  );
}
