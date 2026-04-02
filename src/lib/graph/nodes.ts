import { plannerAgent } from "@/lib/agents/planner";
import { researcherAgent } from "@/lib/agents/researcher";
import { synthesizerAgent } from "@/lib/agents/synthesizer";
import { writerAgent } from "@/lib/agents/writer";
import { criticAgent } from "@/lib/agents/critic";
import { parsePlanToTasks } from "@/lib/utils/parsePlan";
import { webSearch } from "@/lib/tools/webSearch";

async function streamText(
	text: string,
	nodeId: string,
	onStep?: (data: any) => void
) {
	for (let i = 0; i < text.length; i += 5) {
		const chunk = text.slice(i, i + 5);

		onStep?.({
			step: "stream",
			nodeId,
			content: chunk,
		});

		await new Promise((r) => setTimeout(r, 10)); // speed control
	}
}

export function createGraph(goal: string) {
	let tasks: string[] = [];

	return {
		nodes: {
			planner: {
				id: "planner",
				run: async (state: any, onStep?: any) => {
					const plan = await plannerAgent(goal);

					// 🔥 STREAM OUTPUT
					await streamText(plan, "planner", onStep);

					tasks = parsePlanToTasks(plan);

					return plan;
				},
			},

			researchers: {
				id: "researchers",
				run: async (_state: any, onStep?: (data: any) => void) => {
					const researchPromises = tasks.map(async (task, index) => {
						const nodeId = `research_${index}`;
						onStep?.({ step: `${nodeId}_start`, attempt: 1 });

						// simulate minor incremental progress for UX (25/60/90) while running
						onStep?.({ step: "NODE_PROGRESS", nodeId, progress: 10 });

						const webData = await webSearch(task);
						onStep?.({ step: "NODE_PROGRESS", nodeId, progress: 40 });

						const result = await researcherAgent(task + "\n" + webData);

						// 🔥 STREAM EACH RESEARCHER
						await streamText(result, nodeId, onStep);
						onStep?.({ step: "NODE_PROGRESS", nodeId, progress: 80 });

						// final load for this researcher node
						onStep?.({ step: `${nodeId}_done`, data: result });
						onStep?.({ step: "NODE_PROGRESS", nodeId, progress: 100 });

						return result;
					});

					const results = await Promise.all(researchPromises);
					return results;
				},
			},

			synthesizer: {
				id: "synthesizer",
				run: async (state: any, onStep?: any) => {
					const output = await synthesizerAgent(state.data.researchers);

					await streamText(output, "synthesizer", onStep);

					return output;
				},
			},

			writer: {
				id: "writer",
				run: async (state: any, onStep?: any) => {
					const output = await writerAgent(
						goal,
						state.data.planner,
						state.data.synthesizer
					);

					await streamText(output, "writer", onStep);

					return output;
				},
			},

			critic: {
				id: "critic",
				run: async (state: any, onStep?: any) => {
					const output = await criticAgent(
						goal,
						state.data.planner,
						state.data.writer
					);

					await streamText(output, "critic", onStep);

					return output;
				},
			},
		},

		edges: [
			{ from: "planner", to: "researchers" },
			{ from: "researchers", to: "synthesizer" },
			{ from: "synthesizer", to: "writer" },

			// 🔁 LOOP: writer → critic
			{ from: "writer", to: "critic" },

			// 🔥 CONDITIONAL LOOP BACK
			{
				from: "critic",
				to: "writer",
				condition: (state: any) => {
					const output = state.data.critic || "";
					const match = output.match(/(\d+)%/);
					const score = match ? parseInt(match[1]) : 100;

					return score < 80 &&
						(state.meta.attempts["writer"] || 0) < 3;
				},
			},
		],
	};
}