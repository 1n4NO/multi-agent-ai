import { NextRequest } from "next/server";
import { runAgents } from "@/lib/orchestrator/runAgents";

export async function POST(req: NextRequest) {
  const { goal } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        send({ step: "start", message: "Processing started..." });

        const result = await runAgents(goal);

        send({ step: "complete", data: result });

        controller.close();
      } catch (err) {
        send({ step: "error", message: "Something went wrong" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}