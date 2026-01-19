"use client";

/**
 * Pattern 2: Next.js API Route Proxy
 *
 * This pattern demonstrates using Next.js API routes as a proxy to the
 * Python/LangGraph backend.
 *
 * USE CASE: Serverless deployments, edge functions, or when you need
 * to add middleware/authentication at the Next.js layer.
 *
 * HOW IT WORKS:
 * 1. CopilotKitProvider points to /api/copilotkit
 * 2. Next.js API route proxies requests to Python backend
 * 3. All AG-UI events flow through the proxy
 *
 * PROS:
 * - Works with serverless/edge deployments
 * - Can add auth/middleware in API route
 * - Single domain (no CORS)
 *
 * CONS:
 * - Extra hop through proxy
 * - Need to configure API route
 */

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
