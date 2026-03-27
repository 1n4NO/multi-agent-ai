import { callLLM } from "@/lib/llm/ollama";

export async function writerAgent(
  plan: string,
  research: string
): Promise<string> {
  const prompt = `
You are a WRITER agent.

Using the plan and research, create a detailed and well-structured response.

Plan:
${plan}

Research:
${research}

Rules:
- Clear sections
- Professional tone
- Actionable content

Format your response in clean markdown:
- Use headings
- Use numbered lists
- Use bold where needed
- Keep it readable

Output:
`;

  return await callLLM(prompt);
}