# CLAUDE.md

CopilotKit v1.50 + Python LangGraph demo with 3 integration patterns.

## Stack
- **Frontend**: Next.js, CopilotKit v1.50-beta, AG-UI client
- **Backend**: Python FastAPI, LangGraph, CopilotKit SDK

## Ports
- Frontend: 3001
- Backend: 8001

## Commands
```bash
# Start both services
cd demo && npx pm2 start ecosystem.config.js

# Stop services
npx pm2 stop all

# View logs
npx pm2 logs

# Install deps
cd demo/backend && uv sync
cd demo/frontend && npm install
```

## Structure
- `demo/backend/` - FastAPI + LangGraph (main.py, graph.py, state.py)
- `demo/frontend/src/app/` - Next.js app with pattern1/, pattern2/, pattern3/
- `PATTERN-*.md` - Documentation for each integration pattern

## Environment
Requires `OPENAI_API_KEY` in `demo/backend/.env`