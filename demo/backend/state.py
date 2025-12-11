from copilotkit import CopilotKitState


class AgentState(CopilotKitState):
    """Agent state extending CopilotKitState for frontend sync."""

    counter: int = 0
    status: str = "idle"
