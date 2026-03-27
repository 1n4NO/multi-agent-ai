import { callLLM } from "@/lib/llm/ollama";

export async function plannerAgent(userGoal: string): Promise<string> {
  const prompt = `
You are a PLANNER agent.

Break the user's goal into clear step-by-step actionable tasks.

Goal:
${userGoal}

Rules:
- Be concise
- Use numbered list
- Max 6 steps

Output:
`;

  const result = await callLLM(prompt);
  return result;
}