import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { scope, goal, budgetTier } = body;

  // Generate tasks with Claude AI
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const prompt = `Generate a bathroom renovation task list as JSON for a ${scope || "full"} remodel. Goal: ${goal || "update style"}. Budget: ${budgetTier || "mid"}-range.

Return a JSON array of tasks with this exact structure:
[
  {
    "name": "task name",
    "phase": "Planning|Demolition|Rough Work|Installation|Finishing",
    "duration_days": number,
    "dependencies": ["name of dependency task"] or [],
    "status": "todo"
  }
]

Include 15-20 tasks covering planning, demolition, rough work, installation, and finishing phases. Be specific to bathroom renovation.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        // Extract JSON from response
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

  return NextResponse.json({ tasks: getDefaultTasks(scope), source: "default" });
}

function getDefaultTasks(scope?: string) {
  const tasks = [
    // Planning
    { name: "Finalize design & select materials", phase: "Planning", duration_days: 7, dependencies: [], status: "todo" },
    { name: "Get permits", phase: "Planning", duration_days: 14, dependencies: ["Finalize design & select materials"], status: "todo" },
    { name: "Order materials (long-lead items)", phase: "Planning", duration_days: 10, dependencies: ["Finalize design & select materials"], status: "todo" },
    { name: "Schedule contractor", phase: "Planning", duration_days: 5, dependencies: ["Get permits"], status: "todo" },
    // Demolition
    { name: "Protect adjacent areas", phase: "Demolition", duration_days: 1, dependencies: ["Schedule contractor"], status: "todo" },
    { name: "Remove old fixtures, tile, vanity", phase: "Demolition", duration_days: 3, dependencies: ["Protect adjacent areas"], status: "todo" },
    { name: "Inspect plumbing & electrical", phase: "Demolition", duration_days: 1, dependencies: ["Remove old fixtures, tile, vanity"], status: "todo" },
    // Rough Work
    { name: "Plumbing rough-in", phase: "Rough Work", duration_days: 3, dependencies: ["Inspect plumbing & electrical"], status: "todo" },
    { name: "Electrical rough-in", phase: "Rough Work", duration_days: 2, dependencies: ["Inspect plumbing & electrical"], status: "todo" },
    { name: "Waterproofing & moisture barrier", phase: "Rough Work", duration_days: 2, dependencies: ["Plumbing rough-in"], status: "todo" },
    // Installation
    { name: "Install tub/shower base", phase: "Installation", duration_days: 1, dependencies: ["Waterproofing & moisture barrier"], status: "todo" },
    { name: "Install tile (floor + walls)", phase: "Installation", duration_days: 5, dependencies: ["Install tub/shower base"], status: "todo" },
    { name: "Install vanity & sink", phase: "Installation", duration_days: 1, dependencies: ["Install tile (floor + walls)"], status: "todo" },
    { name: "Install toilet", phase: "Installation", duration_days: 1, dependencies: ["Install tile (floor + walls)"], status: "todo" },
    { name: "Install fixtures (faucets, showerhead)", phase: "Installation", duration_days: 1, dependencies: ["Install vanity & sink"], status: "todo" },
    { name: "Install glass shower door", phase: "Installation", duration_days: 1, dependencies: ["Install tile (floor + walls)"], status: "todo" },
    // Finishing
    { name: "Paint walls & ceiling", phase: "Finishing", duration_days: 2, dependencies: ["Install fixtures (faucets, showerhead)"], status: "todo" },
    { name: "Install mirror, lighting, accessories", phase: "Finishing", duration_days: 1, dependencies: ["Paint walls & ceiling"], status: "todo" },
    { name: "Final plumbing connections & test", phase: "Finishing", duration_days: 1, dependencies: ["Install mirror, lighting, accessories"], status: "todo" },
    { name: "Clean up & final inspection", phase: "Finishing", duration_days: 1, dependencies: ["Final plumbing connections & test"], status: "todo" },
  ];

  if (scope === "cosmetic") {
    return tasks.filter((t) => ["Planning", "Installation", "Finishing"].includes(t.phase)).slice(0, 8);
  }

  return tasks;
}
