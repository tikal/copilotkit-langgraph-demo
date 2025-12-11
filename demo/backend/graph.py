from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from state import AgentState


async def chat_node(state: AgentState, config):
    """Process user message and respond."""
    llm = ChatOpenAI(model="gpt-4o-mini")

    response = await llm.ainvoke(state["messages"], config)

    return {"messages": [response], "status": "completed"}


workflow = StateGraph(AgentState)
workflow.add_node("chat", chat_node)
workflow.set_entry_point("chat")
workflow.add_edge("chat", END)

checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)
