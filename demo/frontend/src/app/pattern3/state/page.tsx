"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { StateControls } from "../../components/shared/StateControls";
import { AGENT_ID } from "../../lib/constants";

export default function Pattern3StatePage() {
  return (
    <div className="h-full flex">
      <StateControls />
      <div className="flex-1 min-h-0">
        <CopilotChat agentId={AGENT_ID} />
      </div>
    </div>
  );
}
