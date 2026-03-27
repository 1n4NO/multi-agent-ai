import { NextRequest, NextResponse } from "next/server";
import { plannerAgent } from "@/lib/agents/planner";

export async function POST(req: NextRequest) {
  try {
    const { goal } = await req.json();

    if (!goal) {
      return NextResponse.json(
        { success: false, error: "Goal is required" },
        { status: 400 }
      );
    }

    const plan = await plannerAgent(goal);

    return NextResponse.json({
      success: true,
      data: {
        plan,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}