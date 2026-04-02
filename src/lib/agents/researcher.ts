import { callLLM } from "@/lib/llm/ollama";

export async function researcherAgent(task: string): Promise<string> {
	const prompt = `
You are a RESEARCH AGENT.

Research the following topic and provide deep insights based on the provided data.

Topic: ${task}

Focus on:
- Key insights
- Practical strategies
- Real-world considerations

Be concise but useful.

Output format:

## Researched on ${task}

### Research findings in bullet points
<number>. <insight 1>
`;

	return await callLLM(prompt);
}