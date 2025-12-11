# CopilotKit v1.50 + LangGraph Integration

> **Disclaimer:** This project was vibe-coded. It works, it demos well, but it hasn't been battle-tested in production. Use at your own risk and expect rough edges.

Working demo with 3 integration patterns for CopilotKit v1.50-beta with Python LangGraph backends.

## Version Compatibility

| Package | Version |
|---------|---------|
| `@copilotkit/react-core` | `^1.50.0-beta.8` |
| `@copilotkit/react-ui` | `^1.50.0-beta.8` |
| `@copilotkit/runtime` | `^1.50.0-beta.8` |
| `@ag-ui/client` | `^0.0.42` |
| `copilotkit` (Python) | `>=0.1.72` |
| `langgraph` | `>=1.0.3` |

See `demo/frontend/package.json` for exact versions.

## Architecture

```
Frontend (Next.js)                    Backend (Python)
┌─────────────────────┐               ┌─────────────────────┐
│ CopilotKitProvider  │               │ FastAPI             │
│   └─ CopilotChat    │──AG-UI/SSE──▶│   └─ LangGraph      │
│   └─ useAgent()     │               │       └─ ChatOpenAI│
└─────────────────────┘               └─────────────────────┘
```

## Patterns

| Pattern | Use Case | File |
|---------|----------|------|
| [Pattern 1](./PATTERN-1.md) | Development - Direct AG-UI | `demo/frontend/.../pattern1/page.tsx` |
| [Pattern 2](./PATTERN-2.md) | Production - Next.js Proxy | `demo/frontend/.../pattern2/page.tsx` |
| [Pattern 3](./PATTERN-3.md) | Minimal - useSingleEndpoint | `demo/frontend/.../pattern3/page.tsx` |

## Demo Source

All working code lives in `demo/`:

```
demo/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── graph.py          # LangGraph workflow
│   ├── state.py          # AgentState definition
│   └── copilotkit_v2.py  # v2 single endpoint handler
└── frontend/
    └── src/app/
        ├── lib/constants.ts           # Config
        ├── pattern1/page.tsx          # Direct AG-UI (self-contained)
        ├── pattern2/page.tsx          # Next.js Proxy (self-contained)
        ├── pattern3/page.tsx          # useSingleEndpoint (self-contained)
        ├── api/copilotkit/            # Proxy route (Pattern 2)
        ├── hooks/useThreadManager.ts  # Thread persistence hook
        └── components/PatternPage.tsx # Shared UI with tabs
```

## Setup

1. Install dependencies:
   ```bash
   cd demo/backend && uv sync
   cd demo/frontend && npm install
   ```

2. Configure environment:
   ```bash
   cp demo/backend/.env.example demo/backend/.env
   # Edit .env and add your OpenAI API key
   ```

3. Run the demo:
   ```bash
   cd demo && npx pm2 start ecosystem.config.js
   ```

4. Open `http://localhost:3001`

Stop with `npx pm2 stop all`. Logs with `npx pm2 logs`.

## External Links

- [CopilotKit Docs](https://docs.copilotkit.ai)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [AG-UI Protocol](https://docs.ag-ui.com)
