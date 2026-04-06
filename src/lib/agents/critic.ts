import { callLLM } from "@/lib/llm/ollama";

export async function criticAgent(
	goal: string,
	plan: string,
	content: string,
	citationCatalog: string,
	signal?: AbortSignal
): Promise<string> {
	const prompt = `
You are a CRITIC agent.

Evaluate the solution:

Goal:
${goal}

Plan:
${plan}

Solution:
${content}

Available citations:
${citationCatalog}

Tasks:
1. Improve the solution if needed
2. Give a confidence score (0–100%)
3. Justify the score briefly

Citation rules:
- Preserve useful inline citations already present in the solution
- Add inline citations for factual claims using clickable HTML anchor tags like <a href="https://example.com" target="_blank" rel="noreferrer">[1]</a>
- Only cite using the numbered sources provided in the citation catalog
- Reuse the exact URL from the citation catalog

Output format:

## Final Criticism and Improvement Suggestions
<improved solution>

## Confidence Score
<number>%

## Reason
<short explanation>
`;

	return await callLLM(prompt, signal);
}
