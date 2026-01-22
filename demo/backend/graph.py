import re

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import AIMessage
from copilotkit.langgraph import (
    copilotkit_emit_state,
    copilotkit_customize_config,
    copilotkit_emit_message,
)

from state import AgentState


# Dangerous command patterns for server-side interrupt HITL
DANGEROUS_PATTERNS = [
    r"\brm\s+-rf\b",
    r"\brm\s+.*-r\b",
    r"\bsudo\b",
    r"\bchmod\s+777\b",
    r"\bdd\s+if=",
    r"\bmkfs\b",
    r"\b:\(\)\{.*\}",  # fork bomb
    r"\b>\s*/dev/",
]


def is_dangerous_command(text: str) -> bool:
    """Check if text contains dangerous command patterns."""
    if not text:
        return False
    text_lower = text.lower()
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    return False


def extract_command(text: str) -> str:
    """Extract command from message text."""
    # Look for code blocks first
    code_match = re.search(r"```(?:bash|sh)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if code_match:
        return code_match.group(1).strip()
    # Otherwise return the whole text
    return text

def get_user_message(state: AgentState) -> str:
    """Extract the latest user message from state."""
    messages = state.get("messages", [])
    for msg in reversed(messages):
        if hasattr(msg, "type") and msg.type == "human":
            return msg.content if isinstance(msg.content, str) else ""
        if hasattr(msg, "role") and msg.role == "user":
            return msg.content if isinstance(msg.content, str) else ""
    return ""


async def make_response(config: RunnableConfig, message: str) -> dict:
    """Emit idle state and return formatted response."""
    await copilotkit_emit_state(config, {"status": "idle"})
    return {"messages": [AIMessage(content=message)], "status": "idle"}


async def request_dangerous_command_approval(
    user_message: str, config: RunnableConfig
) -> str | None:
    """
    If message contains dangerous command, interrupt for approval.
    Returns None to continue, or a cancellation message to return early.
    """
    if not is_dangerous_command(user_message):
        return None

    command = extract_command(user_message)
    user_decision = interrupt({
        "__copilotkit_interrupt_value__": {
            "action": "server_command_approval",
            "args": {
                "command": command,
                "reason": "This request contains a potentially dangerous command pattern and requires explicit approval before proceeding",
                "original_message": user_message,
            },
        },
    })

    if user_decision == "CANCEL":
        cancel_message = "Request cancelled by user. I won't proceed with dangerous command information."
        await copilotkit_emit_message(config, cancel_message)
        return cancel_message

    await copilotkit_emit_message(config, "Approval granted. Proceeding with your request...")
    return None


def create_llm_with_tools(state: AgentState) -> ChatOpenAI:
    """Create LLM with frontend tools bound from CopilotKit state."""
    frontend_tools = state.get("copilotkit", {}).get("actions", [])
    llm = ChatOpenAI(model="gpt-4o-mini")
    return llm.bind_tools(frontend_tools) if frontend_tools else llm


async def chat_node(state: AgentState, config: RunnableConfig):
    """Main chat node that handles conversation with interrupt-based HITL."""
    config = copilotkit_customize_config(config, emit_messages=True)
    await copilotkit_emit_state(config, {"status": "thinking"})

    user_message = get_user_message(state)
    if cancel_msg := await request_dangerous_command_approval(user_message, config):
        return await make_response(config, cancel_msg)

    llm = create_llm_with_tools(state)
    response = await llm.ainvoke(state["messages"], config)

    await copilotkit_emit_state(config, {"status": "idle"})
    return {"messages": [response], "status": "idle"}


# Build the graph - simple single-node structure
# The chat_node uses interrupt() directly for HITL, so no conditional routing needed
workflow = StateGraph(AgentState)
workflow.add_node("chat", chat_node)

workflow.set_entry_point("chat")
workflow.add_edge("chat", END)

# Compile with checkpointer for state persistence
# Server-side interrupt HITL uses interrupt() directly in chat_node
graph = workflow.compile(
    checkpointer=MemorySaver(),
)
