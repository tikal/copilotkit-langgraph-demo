"""Fixed LangGraphAgent that properly handles regeneration with checkpointers."""

from copilotkit import LangGraphAGUIAgent
from ag_ui.core import RunAgentInput
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage


class FixedLangGraphAgent(LangGraphAGUIAgent):
    """
    LangGraphAgent subclass that fixes the regenerate bug.

    The bug: prepare_regenerate_stream passes fork via kwargs.update(fork)
    which spreads 'configurable' into kwargs instead of passing it as config=.

    The fix: Use config=fork since fork IS the RunnableConfig with the
    forked checkpoint_id needed for proper time-travel regeneration.

    See: https://github.com/ag-ui-protocol/ag-ui/issues/683

    TODO: Remove this class once the upstream fix is merged.
    """

    async def prepare_regenerate_stream(
        self,
        input: RunAgentInput,
        message_checkpoint: HumanMessage,
        config: RunnableConfig,
    ):
        thread_id = input.thread_id

        time_travel_checkpoint = await self.get_checkpoint_before_message(
            message_checkpoint.id, thread_id
        )
        if time_travel_checkpoint is None:
            return None

        fork = await self.graph.aupdate_state(
            time_travel_checkpoint.config,
            time_travel_checkpoint.values,
            as_node=(
                time_travel_checkpoint.next[0]
                if time_travel_checkpoint.next
                else "__start__"
            ),
        )

        stream_input = self.langgraph_default_merge_state(
            time_travel_checkpoint.values, [message_checkpoint], input
        )
        subgraphs_stream_enabled = (
            input.forwarded_props.get("stream_subgraphs")
            if input.forwarded_props
            else False
        )

        # FIX 1: Use fork as config for streaming - it contains the checkpoint_id for proper time-travel
        kwargs = self.get_stream_kwargs(
            input=stream_input,
            config=fork,  # fork IS the RunnableConfig with forked checkpoint_id
            subgraphs=bool(subgraphs_stream_enabled),
            version="v2",
        )
        stream = self.graph.astream_events(**kwargs)

        # FIX 2: Return a config with only thread_id (not checkpoint_id from fork)
        # so that aget_state() at the end of _handle_stream_events fetches the
        # LATEST checkpoint (after streaming), not the forked parent checkpoint.
        return {
            "stream": stream,
            "state": time_travel_checkpoint.values,
            "config": {"configurable": {"thread_id": thread_id}},
        }