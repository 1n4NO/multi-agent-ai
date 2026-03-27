import { callLLM } from "@/lib/llm/ollama";

export async function criticAgent(content: string): Promise<string> {
  const prompt = `
You are a CRITIC agent.

Improve the content below:
- Fix clarity
- Improve structure
- Remove fluff
- Make it more actionable

Format your response in clean markdown:
- Use headings
- Use numbered lists
- Use bold where needed
- Keep it readable

Content:
${content}

Return ONLY the improved version.
`;

  return await callLLM(prompt);
}