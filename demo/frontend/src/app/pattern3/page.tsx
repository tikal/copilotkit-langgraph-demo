"use client";

import { PatternChatPage } from "../components/shared/PatternChatPage";

export default function Pattern3ChatPage() {
  return (
    <PatternChatPage
      name="Pattern 3: Direct Python (useSingleEndpoint)"
      description="Frontend connects directly to Python backend via runtimeUrl + useSingleEndpoint"
      headerColor="bg-purple-50"
    />
  );
}
