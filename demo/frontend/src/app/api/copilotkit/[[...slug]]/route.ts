import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotEndpoint,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";
import { handle } from "hono/vercel";
import { AGENT_ID, BACKEND_URL } from "../../../lib/constants";

const agent = new HttpAgent({
  url: BACKEND_URL,
  agentId: AGENT_ID,
});

const runtime = new CopilotRuntime({
  agents: { [AGENT_ID]: agent },
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpoint({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handle(app);
export const POST = handle(app);
