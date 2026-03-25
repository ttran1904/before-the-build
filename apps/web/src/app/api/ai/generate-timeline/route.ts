import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { scope, goal, budgetTier, bathroomSize, mustHaves, style } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are a bathroom renovation project manager. Generate a detailed Gantt-chart-style project timeline as JSON for a ${scope || "full"} bathroom remodel.

Context:
- Goal: ${goal || "update style"}
- Budget tier: ${budgetTier || "mid"}-range
- Bathroom size: ${bathroomSize || "medium"}
- Style: ${style || "modern"}
- Must-haves: ${mustHaves?.join(", ") || "standard fixtures"}

Return a JSON array of tasks. Each task must have this exact structure:
[
  {
    "id": 1,
    "name": "Task name",
    "phase": "Planning" | "Demolition" | "Rough-In" | "Installation" | "Finishing",
    "startDay": number (day offset from project start, 0-based),
    "duration": number (in days),
    "dependencies": [] (array of task id numbers),
    "assignee": "Plumber" | "Electrician" | "Tile Installer" | "GC" | "Homeowner" | "Designer" | "Inspector",
    "milestone": false
  }
]

Include 18-25 tasks across all 5 phases. Make milestones for permit approval, rough-in inspection, and final walkthrough (duration: 0 for milestones). Ensure dependencies are logical. Total project should span 6-12 weeks depending on scope. Return ONLY the JSON array, no other text.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const tasks = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ tasks, source: "ai" });
        }
      }
    } catch {
      // Fall through to defaults
    }
  }

  return NextResponse.json({ tasks: getDefaultTimeline(scope), source: "default" });
}

function getDefaultTimeline(scope?: string) {
  const isFull = scope === "full" || scope === "addition";
  return [
    { id: 1, name: "Finalize design & materials", phase: "Planning", startDay: 0, duration: 7, dependencies: [], assignee: "Designer", milestone: false },
    { id: 2, name: "Submit permit application", phase: "Planning", startDay: 7, duration: 14, dependencies: [1], assignee: "GC", milestone: false },
    { id: 3, name: "Order long-lead materials", phase: "Planning", startDay: 7, duration: 10, dependencies: [1], assignee: "Homeowner", milestone: false },
    { id: 4, name: "Permit approved", phase: "Planning", startDay: 21, duration: 0, dependencies: [2], assignee: "Inspector", milestone: true },
    { id: 5, name: "Set up dust barriers", phase: "Demolition", startDay: 21, duration: 1, dependencies: [4], assignee: "GC", milestone: false },
    { id: 6, name: "Demo existing fixtures & tile", phase: "Demolition", startDay: 22, duration: isFull ? 4 : 2, dependencies: [5], assignee: "GC", milestone: false },
    { id: 7, name: "Haul away debris", phase: "Demolition", startDay: isFull ? 26 : 24, duration: 1, dependencies: [6], assignee: "GC", milestone: false },
    { id: 8, name: "Plumbing rough-in", phase: "Rough-In", startDay: isFull ? 27 : 25, duration: 3, dependencies: [7], assignee: "Plumber", milestone: false },
    { id: 9, name: "Electrical rough-in", phase: "Rough-In", startDay: isFull ? 27 : 25, duration: 2, dependencies: [7], assignee: "Electrician", milestone: false },
    { id: 10, name: "Waterproofing membrane", phase: "Rough-In", startDay: isFull ? 30 : 28, duration: 2, dependencies: [8], assignee: "Tile Installer", milestone: false },
    { id: 11, name: "Rough-in inspection", phase: "Rough-In", startDay: isFull ? 32 : 30, duration: 0, dependencies: [8, 9, 10], assignee: "Inspector", milestone: true },
    { id: 12, name: "Install tub/shower base", phase: "Installation", startDay: isFull ? 33 : 31, duration: 2, dependencies: [11], assignee: "Plumber", milestone: false },
    { id: 13, name: "Install wall tile", phase: "Installation", startDay: isFull ? 35 : 33, duration: 4, dependencies: [12], assignee: "Tile Installer", milestone: false },
    { id: 14, name: "Install floor tile", phase: "Installation", startDay: isFull ? 39 : 37, duration: 3, dependencies: [13], assignee: "Tile Installer", milestone: false },
    { id: 15, name: "Install vanity & countertop", phase: "Installation", startDay: isFull ? 42 : 40, duration: 2, dependencies: [14], assignee: "GC", milestone: false },
    { id: 16, name: "Install toilet", phase: "Installation", startDay: isFull ? 42 : 40, duration: 1, dependencies: [14], assignee: "Plumber", milestone: false },
    { id: 17, name: "Plumbing fixtures (faucet, shower)", phase: "Installation", startDay: isFull ? 44 : 42, duration: 1, dependencies: [15, 16], assignee: "Plumber", milestone: false },
    { id: 18, name: "Glass shower door", phase: "Installation", startDay: isFull ? 45 : 43, duration: 1, dependencies: [17], assignee: "GC", milestone: false },
    { id: 19, name: "Electrical trim (lights, fan, GFCI)", phase: "Finishing", startDay: isFull ? 46 : 44, duration: 1, dependencies: [18], assignee: "Electrician", milestone: false },
    { id: 20, name: "Paint & caulk", phase: "Finishing", startDay: isFull ? 47 : 45, duration: 2, dependencies: [19], assignee: "GC", milestone: false },
    { id: 21, name: "Install mirror, accessories, hardware", phase: "Finishing", startDay: isFull ? 49 : 47, duration: 1, dependencies: [20], assignee: "GC", milestone: false },
    { id: 22, name: "Final clean-up", phase: "Finishing", startDay: isFull ? 50 : 48, duration: 1, dependencies: [21], assignee: "GC", milestone: false },
    { id: 23, name: "Final walkthrough", phase: "Finishing", startDay: isFull ? 51 : 49, duration: 0, dependencies: [22], assignee: "Inspector", milestone: true },
  ];
}
