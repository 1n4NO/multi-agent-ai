import { callLLM } from "@/lib/llm/ollama";

export async function writerAgent(
	goal: string,
	plan: string,
	research: string,
	citationCatalog: string
): Promise<string> {
	const prompt = `
You are a WRITER agent.

Goal:
${goal}

Plan:
${plan}

Research Insights:
${research}

Available citations:
${citationCatalog}

Write a complete, structured, actionable solution.

Format:
- Headings
- Lists
- Clear sections

Citation rules:
- Add inline citations for factual claims using clickable HTML anchor tags like <a href="https://example.com" target="_blank" rel="noreferrer">[1]</a>
- Only cite using the numbered sources provided in the citation catalog
- Reuse the exact URL from the citation catalog
`;

	return await callLLM(prompt);
}
