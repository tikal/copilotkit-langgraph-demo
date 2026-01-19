# CopilotKit Integration Patterns

This demo showcases three integration patterns for CopilotKit v1.50 with a Python/LangGraph backend.

## Pattern Comparison

| Pattern | Connection Type | Best For | Complexity |
|---------|----------------|----------|------------|
| **Pattern 1: Direct AG-UI** | HttpAgent → Backend | Full control, custom agents | Medium |
| **Pattern 2: Next.js Proxy** | API Route → Backend | Serverless, edge, auth middleware | Low |
| **Pattern 3: LangGraph + State** | useSingleEndpoint → Backend | Real-time state sync, progress UI | Medium |

---

## Pattern 1: Direct AG-UI Connection

**File:** `frontend/src/app/pattern1/page.tsx`

Uses `HttpAgent` from `@ag-ui/client` for direct connection to any AG-UI compatible backend.

```typescript
import { HttpAgent } from "@ag-ui/client";

const agent = new HttpAgent({ url: BACKEND_URL, agentId: AGENT_ID, threadId });

<CopilotKitProvider agents__unsafe_dev_only={{ [AGENT_ID]: agent }}>
```

**When to use:**
- You need full control over agent connection
- Working with custom agent frameworks
- Managing multiple agents manually

**Note:** `agents__unsafe_dev_only` is for development only.

---

## Pattern 2: Next.js API Route Proxy

**File:** `frontend/src/app/pattern2/page.tsx`

Routes requests through Next.js API routes to the Python backend.

```typescript
<CopilotKitProvider runtimeUrl="/api/copilotkit">
```

**When to use:**
- Serverless or edge deployments
- Need to add authentication at the proxy layer
- Want single-domain setup (no CORS)

---

## Pattern 3: LangGraph + State Streaming

**File:** `frontend/src/app/pattern3/page.tsx`

Direct connection with real-time state synchronization via `useSingleEndpoint`.

```typescript
<CopilotKitProvider runtimeUrl={BACKEND_URL} useSingleEndpoint>
```

### What Works

| Feature | Frontend | Backend |
|---------|----------|---------|
| Real-time state sync | `useAgent().agent.state` | `copilotkit_emit_state()` |
| Agent running status | `useAgent().agent.isRunning` | - |
| Backend tool execution | - | Tools bound to LLM |
| Tool/message streaming | - | `copilotkit_customize_config()` |
| Thread persistence | Built-in | MemorySaver checkpointer |

### What Doesn't Work (Architectural Limitations)

| Hook | Issue | Reference |
|------|-------|-----------|
| `useRenderToolCall` | Frontend actions filtered out, never receive backend tool events | [#2622](https://github.com/CopilotKit/CopilotKit/issues/2622) |
| `useHumanInTheLoop` | Same issue - render never triggered for backend calls | [#2622](https://github.com/CopilotKit/CopilotKit/issues/2622) |
| `useDefaultTool` | Incompatible with v2 provider (typeName error) | - |
| `useCoAgentStateRender` | Requires legacy provider, not v2 | - |

**Root Cause:** The `useRenderToolCall` hook internally calls `useCopilotAction` with `availability: "frontend"`, but these frontend actions get filtered out and never reach the runtime. This is an architectural disconnect between frontend render action registration and backend tool execution.

---

## v1.50 Deprecation Notice

As of CopilotKit v1.50, **backend actions are deprecated** in favor of MCP (Model Context Protocol).

From [Issue #2915](https://github.com/CopilotKit/CopilotKit/issues/2915):

> "Backend actions are deprecated as of 1.50.0 as they are generally replaced as a concept by MCP, that is our new recommendation."

### Recommended: BuiltInAgent + MCP

For new projects, consider using `BuiltInAgent` with MCP servers:

```typescript
import { BuiltInAgent } from "@copilotkit/runtime/v2";

const agent = new BuiltInAgent({
  model: "openai/gpt-4o",
  mcpServers: [
    { type: "http", url: "http://localhost:8000/mcp" },
    { type: "sse", url: "http://localhost:8000/sse", headers: { ... } }
  ],
  tools: [
    defineTool({
      name: "custom_tool",
      description: "...",
      parameters: z.object({ ... }),
      execute: async (args) => { ... }
    })
  ]
});
```

---

## Quick Start

```bash
# Start both services
cd demo && npx pm2 start ecosystem.config.js

# View logs
npx pm2 logs

# Stop services
npx pm2 stop all
```

**Ports:**
- Frontend: http://localhost:3001
- Backend: http://localhost:8001

---

## References

- [CopilotKit Docs](https://docs.copilotkit.ai)
- [Issue #2915 - Backend Actions Deprecated](https://github.com/CopilotKit/CopilotKit/issues/2915)
- [Issue #2622 - useRenderToolCall Limitation](https://github.com/CopilotKit/CopilotKit/issues/2622)
- [AG-UI Protocol](https://github.com/CopilotKit/ag-ui)
