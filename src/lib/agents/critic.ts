import { callLLM } from "@/lib/llm/ollama";

export async function criticAgent(content: string): Promise<string> {
  const prompt = `
You are a CRITIC agent.

Improve the content below:
- Fix clarity
- Improve structure
- Remove fluff
- Make it more actionable

Content:
${content}

Return ONLY the improved version.
`;

  return await callLLM(prompt);
}