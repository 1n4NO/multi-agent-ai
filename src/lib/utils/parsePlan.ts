export function parsePlanToTasks(plan: string): string[] {
  const normalizedPlan = plan.replace(/\r/g, "").trim();

  if (!normalizedPlan) {
    return [];
  }

  const numberedMatches = Array.from(
    normalizedPlan.matchAll(
      /(?:^|\n|\s)(?:Step\s*)?(\d+)[.:]\s*([\s\S]*?)(?=(?:\n|\s)(?:Step\s*)?\d+[.:]\s|$)/gi
    )
  );

  if (numberedMatches.length > 0) {
    return numberedMatches
      .map((match) => match[2].trim())
      .filter(Boolean);
  }

  return normalizedPlan
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter(Boolean);
}
