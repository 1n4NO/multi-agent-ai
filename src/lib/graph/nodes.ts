import { plannerAgent } from "@/lib/agents/planner";
import { researcherAgent } from "@/lib/agents/researcher";
import { synthesizerAgent } from "@/lib/agents/synthesizer";
import { writerAgent } from "@/lib/agents/writer";
import { criticAgent } from "@/lib/agents/critic";
import { parsePlanToTasks } from "@/lib/utils/parsePlan";
import { webSearch } from "@/lib/tools/webSearch";

export function createGraph(goal: string) {
	let tasks: string[] = [];

	return {
		nodes: {
			planner: {
				id: "planner",
				run: async () => {
					const plan = await plannerAgent(goal);
					tasks = parsePlanToTasks(plan);
					return plan;
				},
			},

			researchers: {
				id: "researchers",
				run: async () => {
					const results = await Promise.all(
						tasks.map(async (task) => {
							const webData = await webSearch(task);
							return await researcherAgent(task + "\n" + webData);
						})
					);
					return results;
				},
			},

			synthesizer: {
				id: "synthesizer",
				run: async (input: any) => {
					return await synthesizerAgent(input.researchers);
				},
			},

			writer: {
				id: "writer",
				run: async (input: any) => {
					return await writerAgent(
						goal,
						input.planner,
						input.synthesizer
					);
				},
			},

			critic: {
				id: "critic",
				run: async (input: any) => {
					return await criticAgent(
						goal,
						input.planner,
						input.writer
					);
				},
			},
		},

		edges: [
			{ from: "planner", to: "researchers" },
			{ from: "researchers", to: "synthesizer" },
			{ from: "synthesizer", to: "writer" },
			{ from: "writer", to: "critic" },
		],
	};
}