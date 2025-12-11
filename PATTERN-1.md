# Pattern 1: Direct AG-UI

Frontend connects directly to Python backend via `HttpAgent`. Simple setup for development.

## When to Use

- Development and prototyping
- Simple single-agent setups
- No thread persistence needed across page refreshes

## Architecture

```
Frontend (Next.js)          Backend (Python)
     │                           │
     │  HttpAgent (AG-UI)        │
     └──────────────────────────▶│
     │    SSE events             │
     │◀──────────────────────────┘
     │                           │
CopilotKitProvider          FastAPI
  └─ agents__unsafe_dev_only     │
                          LangGraphAGUIAgent
                                 │
                            LangGraph
```

## Source Files

### Backend

| File | Purpose |
|------|---------|
| `demo/backend/state.py` | AgentState extending CopilotKitState |
| `demo/backend/graph.py` | LangGraph workflow with MemorySaver |
| `demo/backend/main.py:27-37` | LangGraphAGUIAgent setup |

### Frontend

| File | Purpose |
|------|---------|
| `demo/frontend/src/app/lib/constants.ts` | BACKEND_URL, AGENT_ID config |
| `demo/frontend/src/app/pattern1/layout.tsx:9-16` | HttpAgent creation |
| `demo/frontend/src/app/pattern1/layout.tsx:19` | `agents__unsafe_dev_only` prop |

## Key Concepts

**HttpAgent**: Direct connection to AG-UI endpoint - see `layout.tsx:11-14`

**agents__unsafe_dev_only**: Dev-only prop that bypasses runtime - see `layout.tsx:19`

**MemorySaver**: Required for AG-UI - see `graph.py:21-22`

## Run

```bash
cd demo/backend && uv run uvicorn main:app --reload --port 8001
cd demo/frontend && npm run dev -- -p 3001
```

Visit http://localhost:3001/pattern1

## Thread Persistence

Limited in Pattern 1:
- `threadId` can be persisted in localStorage
- Backend `MemorySaver` stores thread state
- But: `HttpAgent` doesn't implement `connect()` for history loading

For full persistence, use [Pattern 2](./PATTERN-2.md) or [Pattern 3](./PATTERN-3.md).

## Troubleshooting

**Agent not found**: Ensure agent ID matches in HttpAgent, provider, CopilotChat, and LangGraphAGUIAgent

**"No checkpointer set"**: Add MemorySaver to graph - see `demo/backend/graph.py:21-22`

**CORS errors**: Check `demo/backend/main.py:20-25` for allowed origins
