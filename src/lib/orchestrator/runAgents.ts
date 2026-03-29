import { executeGraph } from "@/lib/graph/engine";
import { createGraph } from "@/lib/graph/nodes";
import { saveToMemory } from "@/lib/memory/store";

export async function runAgents(goal: string, onStep?: any) {
  const graph = createGraph(goal);

  const results = await executeGraph(graph, { goal }, onStep);

  saveToMemory(goal, results);

  return results;
}