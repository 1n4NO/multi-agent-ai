import { callLLM } from "@/lib/llm/ollama";

export async function writerAgent(
	goal: string,
	plan: string,
	research: string,
	citationCatalog: string,
	previousDraft?: string,
	criticFeedback?: string,
	signal?: AbortSignal
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

Previous draft:
${previousDraft || "None. This is the first draft."}

Critic feedback:
${criticFeedback || "None. This is the first draft."}

Write a complete, structured, actionable solution.

Format:
- Headings
- Lists
- Clear sections

Revision rules:
- If critic feedback is provided, revise the previous draft instead of starting over
- Incorporate the critic's specific improvements where they strengthen the answer
- Preserve useful material from the previous draft unless the critique identifies a weakness

Citation rules:
- Add inline citations for factual claims using clickable HTML anchor tags like <a href="https://example.com" target="_blank" rel="noreferrer">[1]</a>
- Only cite using the numbered sources provided in the citation catalog
- Reuse the exact URL from the citation catalog
`;

	return await callLLM(prompt, signal);
}
