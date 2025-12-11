# Pattern 3: Direct Python (useSingleEndpoint)

Frontend connects directly to Python backend via `runtimeUrl` + `useSingleEndpoint={true}`. No Next.js proxy layer.

## When to Use

- Development and prototyping
- Minimal infrastructure
- Direct browser-to-Python communication
- Full thread persistence via LangGraph checkpointer

## Architecture

```
Frontend (React)                     Backend (Python)
     │                                     │
     │   CopilotKit                        │
     └────────────────────────────────────▶│
     │   (useSingleEndpoint=true)          │
     │                                     │
     │    SSE events                       │
     │◀────────────────────────────────────┘
     │                                     │
CopilotKitProvider                     FastAPI
  └─ runtimeUrl                   (v2 single endpoint)
  └─ useSingleEndpoint=true              │
                                  LangGraphAgent
                                         │
                                     LangGraph
```

## Source Files

### Backend (v2 Single Endpoint)

| File | Purpose |
|------|---------|
| `demo/backend/copilotkit_v2.py:33-37` | `add_copilotkit_v2_single_endpoint` signature |
| `demo/backend/copilotkit_v2.py:47-55` | `info` method handler |
| `demo/backend/copilotkit_v2.py:57-121` | `agent/connect` handler (thread restore) |
| `demo/backend/copilotkit_v2.py:123-129` | `agent/run` handler |
| `demo/backend/main.py:33-37` | Endpoint registration |

### Frontend

| File | Purpose |
|------|---------|
| `demo/frontend/src/app/pattern3/layout.tsx:9` | `runtimeUrl={BACKEND_URL} useSingleEndpoint={true}` |

## Key Concepts

**useSingleEndpoint**: All requests go to single POST endpoint with method dispatch - see `layout.tsx:9`

**Method dispatch**: Backend routes by `method` field:
- `info` - Returns agent metadata
- `agent/connect` - Reconnect to existing thread
- `agent/run` - Execute agent with user input

**Thread persistence**: Via LangGraph checkpointer - see `copilotkit_v2.py:84-109`

## How useSingleEndpoint Works

All requests POST to single endpoint with:

| Operation | Request Body |
|-----------|--------------|
| Get info | `{ "method": "info" }` |
| Run agent | `{ "method": "agent/run", "params": { "agentId": "..." }, "body": {...} }` |
| Connect | `{ "method": "agent/connect", "params": { "agentId": "..." }, "body": {...} }` |

## Run

```bash
cd demo/backend && uv run uvicorn main:app --reload --port 8001
cd demo/frontend && npm run dev -- -p 3001
```

Visit http://localhost:3001/pattern3

## Thread Persistence

Pattern 3 uses LangGraph's checkpointer:
- `MemorySaver` for dev - see `demo/backend/graph.py:21-22`
- On `connect()` with empty messages, backend returns stored state
- For production, use `PostgresSaver` or other persistent checkpointers

## Pattern Comparison

| Aspect | Pattern 2 (Proxy) | Pattern 3 (Direct) |
|--------|-------------------|-------------------|
| Middleware | Next.js API route | None |
| Thread storage | InMemoryAgentRunner | LangGraph checkpointer |
| Provider props | `runtimeUrl` only | `runtimeUrl` + `useSingleEndpoint` |
| Auth | Add in Next.js | Add in Python middleware |
| CORS | Not needed | Required |

## Troubleshooting

**CORS errors**: Check `demo/backend/main.py:20-25` for allowed origins

**Agent not found**: Ensure agent ID matches in `agents` dict and frontend

**Empty messages error**: `agent/connect` handler must return early for empty messages - see `copilotkit_v2.py:65-67`
