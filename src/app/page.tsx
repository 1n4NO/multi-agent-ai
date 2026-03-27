"use client";

import { useState } from "react";
import AgentGraph from "@/components/AgentGraph";

export default function Home() {
  const [goal, setGoal] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState("");

  const runAgents = async () => {
    setLogs([]);
    setCurrentStep("");

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

          // 🔥 track current step
          if (parsed.step) {
            setCurrentStep(parsed.step);
          }

          setLogs((prev) => [...prev, parsed]);
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

      {/* 🔥 Agent Graph */}
      <AgentGraph currentStep={currentStep} />

      {/* Logs */}
      <div style={{ marginTop: 20 }}>
        {logs.map((log, i) => (
          <pre key={i}>{JSON.stringify(log, null, 2)}</pre>
        ))}
      </div>
    </div>
  );
}