export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001/api/copilotkit";

export const AGENT_ID = "my-agent";

export interface AgentState {
  status: string;
}
