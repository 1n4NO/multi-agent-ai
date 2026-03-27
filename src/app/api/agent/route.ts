import { NextRequest } from "next/server";
import { runAgents } from "@/lib/orchestrator/runAgents";

export async function POST(req: NextRequest) {
  const { goal } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const result = await runAgents(goal, send);

        send({ step: "complete", data: result });

        controller.close();
      } catch {
        send({ step: "error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
}