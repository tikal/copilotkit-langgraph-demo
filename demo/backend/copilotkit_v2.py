import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse

from ag_ui.core import (
    EventType,
    MessagesSnapshotEvent,
    RunFinishedEvent,
    RunStartedEvent,
    StateSnapshotEvent,
)
from ag_ui.core.types import RunAgentInput
from ag_ui.encoder import EventEncoder
from ag_ui_langgraph.agent import LangGraphAgent
from ag_ui_langgraph.utils import langchain_messages_to_agui

logger = logging.getLogger(__name__)


def _create_streaming_response(
    agent: LangGraphAgent, input_data: RunAgentInput, request: Request
) -> StreamingResponse:
    encoder = EventEncoder(accept=request.headers.get("accept"))

    async def stream():
        async for event in agent.run(input_data):
            yield encoder.encode(event)

    return StreamingResponse(stream(), media_type=encoder.get_content_type())


def add_copilotkit_v2_single_endpoint(
    app: FastAPI,
    agents: dict[str, LangGraphAgent],
    path: str = "/api/copilotkit",
):
    @app.post(path)
    async def copilotkit_v2_endpoint(request: Request):
        body = await request.json()
        method = body.get("method")
        params = body.get("params", {})
        agent_id = params.get("agentId")

        logger.info(f"[CopilotKit] method={method} agent_id={agent_id}")

        if method == "info":
            return {
                "version": "0.1.0",
                "agents": {
                    name: {"name": name, "description": agent.description or ""}
                    for name, agent in agents.items()
                },
                "audioFileTranscriptionEnabled": False,
            }

        if method == "agent/connect":
            agent = agents.get(agent_id)
            if not agent:
                raise HTTPException(404, f"Agent '{agent_id}' not found")

            request_body = body.get("body", {})
            messages = request_body.get("messages", [])

            if messages:
                input_data = RunAgentInput(**request_body)
                return _create_streaming_response(agent, input_data, request)

            thread_id = request_body.get("threadId")
            run_id = request_body.get("runId")
            encoder = EventEncoder(accept=request.headers.get("accept"))

            logger.info(f"[CopilotKit] agent/connect thread_id={thread_id}")

            async def connect_stream():
                yield encoder.encode(
                    RunStartedEvent(
                        type=EventType.RUN_STARTED,
                        thread_id=thread_id,
                        run_id=run_id,
                    )
                )

                if thread_id:
                    config = {"configurable": {"thread_id": thread_id}}
                    state = await agent.graph.aget_state(config)
                    if state and state.values:
                        msgs = state.values.get("messages", [])
                        yield encoder.encode(
                            StateSnapshotEvent(
                                type=EventType.STATE_SNAPSHOT,
                                snapshot=state.values,
                            )
                        )
                        yield encoder.encode(
                            MessagesSnapshotEvent(
                                type=EventType.MESSAGES_SNAPSHOT,
                                messages=langchain_messages_to_agui(msgs),
                            )
                        )

                yield encoder.encode(
                    RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id=thread_id,
                        run_id=run_id,
                    )
                )

            return StreamingResponse(
                connect_stream(), media_type=encoder.get_content_type()
            )

        if method == "agent/run":
            agent = agents.get(agent_id)
            if not agent:
                raise HTTPException(404, f"Agent '{agent_id}' not found")
            request_body = body.get("body", {})

            # CopilotKit v2 may send threadId in different locations/cases depending on
            # the request source. Normalize to snake_case for RunAgentInput compatibility.
            thread_id = request_body.get("threadId") or request_body.get("thread_id")
            if not thread_id:
                forwarded = request_body.get("forwardedProps", {}) or request_body.get("forwarded_props", {})
                thread_id = forwarded.get("threadId") or forwarded.get("thread_id")

            if thread_id:
                request_body["thread_id"] = thread_id  # Use snake_case for RunAgentInput

            input_data = RunAgentInput(**request_body)
            return _create_streaming_response(agent, input_data, request)

        if method == "agent/stop":
            return {"stopped": False, "message": "Stop not implemented"}

        if method is None:
            input_data = RunAgentInput(**body)
            default_agent = next(iter(agents.values()))
            return _create_streaming_response(default_agent, input_data, request)

        raise HTTPException(400, f"Unknown method: {method}")

    @app.get(f"{path}/health")
    def health():
        return {
            "status": "ok",
            "agents": list(agents.keys()),
        }
