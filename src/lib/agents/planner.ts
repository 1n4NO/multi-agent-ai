import { callLLM } from "@/lib/llm/ollama";
import { getRecentMemory } from "@/lib/memory/store";

export async function plannerAgent(
  userGoal: string,
  signal?: AbortSignal
): Promise<string> {
  const memory = getRecentMemory();

  const prompt = `
You are a PLANNER agent.

GOAL:
${userGoal}

PREVIOUS CONTEXT:
${JSON.stringify(memory, null, 2)}

INSTRUCTIONS:
- Break the goal into a maximum of 6 steps
- Use EXACTLY this numbered format:
  1. ...
  2. ...
  3. ...
- Each step must be one concise sentence
- Do NOT include any title, heading, label, or introduction
- Do NOT repeat or rephrase the goal
- Do NOT use bold text, markdown, or special formatting
- Do NOT include blank lines

STRICT OUTPUT RULE:
- Output ONLY numbered steps
- The FIRST character of the response MUST be "1."
- If any text appears before "1.", the response is invalid

CONSTRAINTS:
- Avoid repeating strategies from previous context
- Keep steps practical and actionable

FAIL CONDITION:
If you include anything other than the numbered steps, the response is invalid.
`;

  return await callLLM(prompt, signal);
}
