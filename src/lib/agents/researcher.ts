import { callLLM } from "@/lib/llm/ollama";

export async function researcherAgent(plan: string): Promise<string> {
  const prompt = `
You are a RESEARCHER agent.

Given the plan below, provide useful insights, facts, and strategies
to help execute it.

Plan:
${plan}

Rules:
- Be informative
- Use bullet points
- Add practical insights

Output:
`;

  return await callLLM(prompt);
}