"use client";

import { PatternChatPage } from "../components/shared/PatternChatPage";

export default function Pattern2ChatPage() {
  return (
    <PatternChatPage
      name="Pattern 2: Next.js Proxy"
      description="Frontend connects via API route (/api/copilotkit) which proxies to Python backend"
      headerColor="bg-green-50"
    />
  );
}
