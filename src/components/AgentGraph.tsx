export default function AgentGraph({ currentStep }: { currentStep: string }) {
  const steps = ["planner", "research", "writer", "critic"];

  return (
    <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
      {steps.map((step) => {
        const isActive = currentStep.startsWith(step);

        return (
          <div
            key={step}
            style={{
              padding: 10,
              border: "2px solid black",
              background: isActive ? "lightgreen" : "white",
            }}
          >
            {step.toUpperCase()}
          </div>
        );
      })}
    </div>
  );
}