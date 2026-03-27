export default function AgentGraph({ currentStep }: { currentStep: string }) {
  const steps = ["planner", "research", "writer", "critic"];

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {steps.map((step) => (
        <div
          key={step}
          style={{
            padding: 10,
            border: "2px solid",
            background:
              currentStep.includes(step) ? "lightgreen" : "white",
          }}
        >
          {step.toUpperCase()}
        </div>
      ))}
    </div>
  );
}