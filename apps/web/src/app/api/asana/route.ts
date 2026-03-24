import { NextRequest, NextResponse } from "next/server";

const ASANA_BASE = "https://app.asana.com/api/1.0";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, tasks, projectName } = body;

  const pat = process.env.ASANA_PAT;
  const workspaceId = process.env.ASANA_WORKSPACE_ID;

  if (!pat || !workspaceId) {
    return NextResponse.json({ error: "Asana not configured", synced: false }, { status: 200 });
  }

  const headers = {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };

  try {
    if (action === "create-project") {
      // Create a project
      const projectRes = await fetch(`${ASANA_BASE}/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            name: projectName || "Bathroom Renovation",
            workspace: workspaceId,
            layout: "board",
            default_view: "board",
          },
        }),
      });
      const projectData = await projectRes.json();
      const projectId = projectData.data?.gid;

      if (!projectId) {
        return NextResponse.json({ error: "Failed to create project", synced: false });
      }

      // Create sections
      const sections = ["To Do", "In Progress", "Done", "Blocked"];
      const sectionIds: Record<string, string> = {};
      for (const sectionName of sections) {
        const secRes = await fetch(`${ASANA_BASE}/projects/${projectId}/sections`, {
          method: "POST",
          headers,
          body: JSON.stringify({ data: { name: sectionName } }),
        });
        const secData = await secRes.json();
        sectionIds[sectionName] = secData.data?.gid;
      }

      // Create tasks if provided
      if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
          const today = new Date();
          const startOffset = tasks.indexOf(task) * 2;
          const startDate = new Date(today.getTime() + startOffset * 86400000);
          const dueDate = new Date(startDate.getTime() + (task.duration_days || 1) * 86400000);

          await fetch(`${ASANA_BASE}/tasks`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              data: {
                name: task.name,
                projects: [projectId],
                memberships: [
                  {
                    project: projectId,
                    section: sectionIds["To Do"],
                  },
                ],
                start_on: startDate.toISOString().split("T")[0],
                due_on: dueDate.toISOString().split("T")[0],
                notes: `Phase: ${task.phase}\nDuration: ${task.duration_days} days`,
              },
            }),
          });
        }
      }

      return NextResponse.json({ projectId, sectionIds, synced: true });
    }

    return NextResponse.json({ error: "Unknown action", synced: false });
  } catch (error) {
    return NextResponse.json({ error: "Asana sync failed", synced: false }, { status: 200 });
  }
}
