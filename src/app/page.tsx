"use client";

import { useState } from "react";

export default function Home() {
  const [goal, setGoal] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const runAgents = async () => {
    setLogs([]);

    const res = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ goal }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n");

      lines.forEach((line) => {
        if (line.startsWith("data: ")) {
          const parsed = JSON.parse(line.replace("data: ", ""));
          setLogs((prev) => [...prev, JSON.stringify(parsed)]);
        }
      });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Multi-Agent AI</h1>

      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Enter goal..."
      />

      <button onClick={runAgents}>Run</button>

      <div>
        {logs.map((log, i) => (
          <pre key={i}>{log}</pre>
        ))}
      </div>
    </div>
  );
}