import { callLLM } from "@/lib/llm/ollama";

export async function synthesizerAgent(
	researchOutputs: string[],
	citationCatalog: string,
	signal?: AbortSignal
): Promise<string> {
	const prompt = `
You are a SYNTHESIZER agent.

Combine the following research into a single cohesive insight:

${researchOutputs.join("\n\n")}

Available citations:
${citationCatalog}

Rules:
- Remove redundancy
- Keep best insights
- Structure clearly
- Preserve any existing citations already attached to factual claims
- When a factual claim needs support, cite it with inline HTML anchor tags like <a href="https://example.com" target="_blank" rel="noreferrer">[1]</a>
`;

	return await callLLM(prompt, signal);
}
