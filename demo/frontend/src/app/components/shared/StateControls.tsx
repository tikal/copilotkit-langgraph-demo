"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { AGENT_ID, AgentState } from "../../lib/constants";

export function StateControls() {
  const { agent } = useAgent({ agentId: AGENT_ID });
  const state = agent.state as AgentState | undefined;

  const handleIncrement = () => {
    agent.setState({ ...state, counter: (state?.counter || 0) + 1 });
  };

  const handleDecrement = () => {
    agent.setState({ ...state, counter: (state?.counter || 0) - 1 });
  };

  const handleSetStatus = (status: string) => {
    agent.setState({ ...state, status });
  };
  return (
    <div className="w-80 border-r p-4 bg-purple-50 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Bidirectional State</h1>
      <p className="text-sm text-gray-600">
        Frontend can update state that syncs with backend
      </p>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-medium mb-2">Current State:</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-medium mb-2">Counter Control:</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDecrement}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            -
          </button>
          <span className="px-4 py-2 bg-gray-100 rounded font-mono">
            {state?.counter ?? 0}
          </span>
          <button
            onClick={handleIncrement}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            +
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded border">
        <h2 className="font-medium mb-2">Status Control:</h2>
        <div className="flex flex-wrap gap-2">
          {["idle", "working", "done", "error"].map((status) => (
            <button
              key={status}
              onClick={() => handleSetStatus(status)}
              className={`px-3 py-1 rounded text-sm ${
                state?.status === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Running: {agent.isRunning ? "Yes" : "No"}
      </div>
    </div>
  );
}
