import { callLLM } from "@/lib/llm/ollama";
import { getRecentMemory } from "@/lib/memory/store";

export async function plannerAgent(userGoal: string): Promise<string> {
  const memory = getRecentMemory();

  const prompt = `
You are a PLANNER agent.

Previous context:
${JSON.stringify(memory, null, 2)}

Now plan the new goal.

Goal:
${userGoal}

Rules:
- Avoid repeating previous strategies
- Be concise
- Max 6 steps
`;

  return await callLLM(prompt);
}