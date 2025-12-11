# Pattern 2: Next.js Proxy

Frontend connects through a Next.js API route with `InMemoryAgentRunner`. Production-ready with thread persistence.

## When to Use

- Production applications
- Server-side authentication needed
- Full thread persistence (history survives page refresh)
- Multiple agents

## Architecture

```
Frontend (React)         Next.js API           Backend (Python)
     │                       │                       │
     │   CopilotKit          │                       │
     └──────────────────────▶│   HttpAgent           │
     │                       └──────────────────────▶│
     │    SSE events         │                       │
     │◀──────────────────────│◀──────────────────────┘
     │                       │                       │
CopilotKitProvider      CopilotRuntime          FastAPI
  └─ runtimeUrl         └─ InMemoryAgentRunner       │
                                              LangGraphAGUIAgent
```

## Source Files

### API Route (Next.js Proxy)

| File | Purpose |
|------|---------|
| `demo/frontend/src/app/api/copilotkit/[[...slug]]/route.ts` | Full proxy implementation |
| Line 10-13 | HttpAgent to backend |
| Line 15-18 | CopilotRuntime with InMemoryAgentRunner |
| Line 20-23 | createCopilotEndpoint |
| Line 25-26 | Hono handlers (GET/POST) |

### Frontend

| File | Purpose |
|------|---------|
| `demo/frontend/src/app/pattern2/page.tsx:9` | `runtimeUrl="/api/copilotkit"` |

## Key Concepts

**runtimeUrl**: Points to Next.js API route instead of backend directly - see `page.tsx:9`

**InMemoryAgentRunner**: Enables thread persistence in Next.js server memory - see `route.ts:17`

**createCopilotEndpoint**: Creates Hono app with CopilotKit routes - see `route.ts:20-23`

**Catch-all route**: `[[...slug]]` required for Hono routing

## Run

```bash
cd demo/backend && uv run uvicorn main:app --reload --port 8001
cd demo/frontend && npm run dev -- -p 3001
```

Visit http://localhost:3001/pattern2

## Thread Persistence

Full thread persistence in Pattern 2:
- `InMemoryAgentRunner` stores events in Next.js server memory
- `threadId` triggers automatic history loading via `connect()`
- Conversation history survives page refresh

Limitations:
- Data lost when Next.js server restarts
- Not shared across server instances

## Troubleshooting

**404 on `/api/copilotkit`**: Ensure catch-all route `[[...slug]]/route.ts`

**Agent not found**: Ensure agent ID matches in HttpAgent, agents map, CopilotChat, and backend

**History not loading**: Verify `threadId` passed to CopilotChat
