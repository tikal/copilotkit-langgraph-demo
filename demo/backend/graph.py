from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableConfig
from copilotkit.langgraph import copilotkit_emit_state, copilotkit_customize_config

from state import AgentState


async def chat_node(state: AgentState, config: RunnableConfig):
    config = copilotkit_customize_config(config, emit_messages=True)

    await copilotkit_emit_state(config, {"status": "thinking"})

    llm = ChatOpenAI(model="gpt-4o-mini")
    response = await llm.ainvoke(state["messages"], config)

    await copilotkit_emit_state(config, {"status": "idle"})
    return {"messages": [response], "status": "idle"}


workflow = StateGraph(AgentState)
workflow.add_node("chat", chat_node)
workflow.set_entry_point("chat")
workflow.add_edge("chat", END)

graph = workflow.compile(checkpointer=MemorySaver())
