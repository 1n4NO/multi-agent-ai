import { Graph, GraphState, StepCallback } from "./types";
import { throwIfAborted } from "@/lib/utils/abort";

export async function executeGraph(
  graph: Graph,
  initialState: GraphState,
  onStep?: StepCallback,
  signal?: AbortSignal
) {
  const state = initialState;

  async function runNode(nodeId: string): Promise<void> {
    throwIfAborted(signal);
    const node = graph.nodes[nodeId];

    // track attempts
    state.meta.attempts[nodeId] =
      (state.meta.attempts[nodeId] || 0) + 1;

    onStep?.({
      step: `${nodeId}_start`,
      attempt: state.meta.attempts[nodeId],
    });

    const output = await node.run(state, onStep, { signal });
    throwIfAborted(signal);

    state.data[nodeId] = output;

    onStep?.({
      step: `${nodeId}_done`,
      data: output,
    });

    // find next edges with conditions
    const nextEdges = graph.edges.filter(
      (e) =>
        e.from === nodeId &&
        (!e.condition || e.condition(state))
    );

    for (const edge of nextEdges) {
      throwIfAborted(signal);
      await runNode(edge.to);
    }
  }

  await runNode("planner");
  throwIfAborted(signal);

  return state.data;
}
