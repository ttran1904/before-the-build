"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FaArrowLeft, FaArrowRight, FaList, FaTableColumns, FaChartGantt,
  FaPlus, FaCheck, FaCircle, FaBan, FaSpinner,
} from "react-icons/fa6";
import { useWizardStore } from "@/lib/store";

interface Task {
  name: string;
  phase: string;
  duration_days: number;
  dependencies: string[];
  status: "todo" | "in_progress" | "done" | "blocked";
}

type ViewMode = "kanban" | "gantt" | "list";

const PHASE_COLORS: Record<string, string> = {
  Planning: "#87CEEB",
  Demolition: "#d4956a",
  "Rough Work": "#2d5a3d",
  Installation: "#d4c5e8",
  Finishing: "#bde0c0",
};

const STATUS_CONFIG = {
  todo: { label: "To Do", color: "#e8e6e1", icon: FaCircle },
  in_progress: { label: "In Progress", color: "#87CEEB", icon: FaSpinner },
  done: { label: "Done", color: "#2d5a3d", icon: FaCheck },
  blocked: { label: "Blocked", color: "#d4956a", icon: FaBan },
};

export default function TimelinePage() {
  const store = useWizardStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: store.scope || "full",
          goal: store.goal || "update_style",
          budgetTier: store.budgetTier || "mid",
        }),
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, [store.scope, store.goal, store.budgetTier]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const syncToAsana = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/asana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-project",
          projectName: "Bathroom Renovation - Before The Build",
          tasks,
        }),
      });
      const data = await res.json();
      setSynced(data.synced);
    } catch {
      // Handle error silently
    }
    setSyncing(false);
  };

  const updateTaskStatus = (index: number, status: Task["status"]) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, status } : t)));
  };

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
    blocked: tasks.filter((t) => t.status === "blocked"),
  };

  const totalDays = tasks.reduce((sum, t) => sum + t.duration_days, 0);
  const totalWeeks = Math.ceil(totalDays / 7);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f4]">
      {/* Header */}
      <header className="border-b border-[#e8e6e1] bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <Link href="/dashboard/projects/new/bathroom/visualize" className="flex items-center gap-2 text-sm text-[#6a6a7a] hover:text-[#1a1a2e]">
            <FaArrowLeft className="text-xs" /> Back to Design
          </Link>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg border border-[#e8e6e1] bg-[#f8f7f4] p-0.5">
              {([
                { id: "kanban" as const, icon: FaTableColumns, label: "Board" },
                { id: "gantt" as const, icon: FaChartGantt, label: "Gantt" },
                { id: "list" as const, icon: FaList, label: "List" },
              ]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    viewMode === v.id
                      ? "bg-white text-[#1a1a2e] shadow-sm"
                      : "text-[#6a6a7a] hover:text-[#1a1a2e]"
                  }`}
                >
                  <v.icon className="text-[10px]" />
                  {v.label}
                </button>
              ))}
            </div>

            <button
              onClick={syncToAsana}
              disabled={syncing || synced}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                synced
                  ? "bg-[#2d5a3d]/10 text-[#2d5a3d]"
                  : "bg-[#2d5a3d] text-white hover:bg-[#234a31]"
              } disabled:opacity-50`}
            >
              {synced ? (
                <>
                  <FaCheck className="text-xs" /> Synced to Asana
                </>
              ) : syncing ? (
                <>
                  <FaSpinner className="animate-spin text-xs" /> Syncing...
                </>
              ) : (
                "Sync to Asana"
              )}
            </button>

            <Link
              href="/build-book"
              className="flex items-center gap-2 rounded-lg bg-[#2d5a3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#234a31]"
            >
              Build Book <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-[#e8e6e1] bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center gap-8 px-6 py-3">
          <div>
            <span className="text-xs text-[#6a6a7a]">Total Tasks</span>
            <p className="text-lg font-bold text-[#1a1a2e]">{tasks.length}</p>
          </div>
          <div>
            <span className="text-xs text-[#6a6a7a]">Est. Duration</span>
            <p className="text-lg font-bold text-[#1a1a2e]">{totalWeeks} weeks</p>
          </div>
          <div>
            <span className="text-xs text-[#6a6a7a]">Completed</span>
            <p className="text-lg font-bold text-[#2d5a3d]">{tasksByStatus.done.length}/{tasks.length}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {Object.entries(PHASE_COLORS).map(([phase, color]) => (
              <span key={phase} className="flex items-center gap-1 text-[10px] text-[#6a6a7a]">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {phase}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#2d5a3d] border-t-transparent" />
              <p className="text-sm text-[#6a6a7a]">Generating your renovation timeline...</p>
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          <KanbanView tasks={tasks} tasksByStatus={tasksByStatus} onUpdateStatus={updateTaskStatus} allTasks={tasks} />
        ) : viewMode === "gantt" ? (
          <GanttView tasks={tasks} />
        ) : (
          <ListView tasks={tasks} onUpdateStatus={updateTaskStatus} allTasks={tasks} />
        )}
      </div>
    </div>
  );
}

/* ── Kanban View ── */
function KanbanView({
  tasksByStatus,
  onUpdateStatus,
  allTasks,
}: {
  tasks: Task[];
  tasksByStatus: Record<string, Task[]>;
  onUpdateStatus: (index: number, status: Task["status"]) => void;
  allTasks: Task[];
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {(Object.entries(STATUS_CONFIG) as [Task["status"], typeof STATUS_CONFIG.todo][]).map(([status, config]) => (
        <div key={status} className="rounded-xl bg-[#f3f2ef] p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: config.color }} />
            <span className="text-sm font-semibold text-[#1a1a2e]">{config.label}</span>
            <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[#6a6a7a]">
              {tasksByStatus[status]?.length || 0}
            </span>
          </div>
          <div className="space-y-2">
            {(tasksByStatus[status] || []).map((task) => {
              const taskIndex = allTasks.indexOf(task);
              return (
                <div
                  key={task.name}
                  className="rounded-lg border border-[#e8e6e1] bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-xs font-medium text-[#1a1a2e]">{task.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ background: PHASE_COLORS[task.phase] || "#9a9aaa" }}
                    >
                      {task.phase}
                    </span>
                    <span className="text-[10px] text-[#9a9aaa]">{task.duration_days}d</span>
                  </div>
                  {/* Quick status buttons */}
                  <div className="mt-2 flex gap-1">
                    {(["todo", "in_progress", "done", "blocked"] as const).map((s) => (
                      s !== status && (
                        <button
                          key={s}
                          onClick={() => onUpdateStatus(taskIndex, s)}
                          className="rounded px-1.5 py-0.5 text-[9px] text-[#6a6a7a] hover:bg-[#f3f2ef]"
                          title={`Move to ${STATUS_CONFIG[s].label}`}
                        >
                          → {STATUS_CONFIG[s].label}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Gantt View ── */
function GanttView({ tasks }: { tasks: Task[] }) {
  // Calculate start offsets based on dependencies
  const taskPositions = new Map<string, { start: number; end: number }>();
  let maxEnd = 0;

  tasks.forEach((task) => {
    let start = 0;
    for (const dep of task.dependencies) {
      const depPos = taskPositions.get(dep);
      if (depPos && depPos.end > start) {
        start = depPos.end;
      }
    }
    const end = start + task.duration_days;
    taskPositions.set(task.name, { start, end });
    if (end > maxEnd) maxEnd = end;
  });

  const totalDays = Math.max(maxEnd, 1);

  return (
    <div className="rounded-xl border border-[#e8e6e1] bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-[#1a1a2e]">Project Timeline</h3>

      {/* Week headers */}
      <div className="mb-2 ml-52 flex">
        {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
          <div
            key={i}
            className="text-center text-[10px] text-[#9a9aaa]"
            style={{ width: `${(7 / totalDays) * 100}%` }}
          >
            Week {i + 1}
          </div>
        ))}
      </div>

      {/* Gantt rows */}
      <div className="space-y-1.5">
        {tasks.map((task) => {
          const pos = taskPositions.get(task.name);
          if (!pos) return null;
          const leftPct = (pos.start / totalDays) * 100;
          const widthPct = Math.max((task.duration_days / totalDays) * 100, 2);

          return (
            <div key={task.name} className="flex items-center gap-3 py-1">
              <span className="w-48 shrink-0 truncate text-xs text-[#4a4a5a]">{task.name}</span>
              <div className="relative h-7 flex-1 rounded bg-[#f3f2ef]">
                <div
                  className="absolute top-0 h-full rounded transition-all"
                  style={{
                    background: PHASE_COLORS[task.phase] || "#9a9aaa",
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                >
                  <span className="absolute inset-0 flex items-center px-2 text-[9px] font-medium text-white">
                    {task.duration_days}d
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── List View ── */
function ListView({
  tasks,
  onUpdateStatus,
  allTasks,
}: {
  tasks: Task[];
  onUpdateStatus: (index: number, status: Task["status"]) => void;
  allTasks: Task[];
}) {
  const phases = [...new Set(tasks.map((t) => t.phase))];

  return (
    <div className="space-y-6">
      {phases.map((phase) => (
        <div key={phase} className="rounded-xl border border-[#e8e6e1] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#e8e6e1] px-5 py-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: PHASE_COLORS[phase] || "#9a9aaa" }}
            />
            <h3 className="text-sm font-semibold text-[#1a1a2e]">{phase}</h3>
            <span className="text-xs text-[#9a9aaa]">
              {tasks.filter((t) => t.phase === phase).length} tasks
            </span>
          </div>
          <div className="divide-y divide-[#f3f2ef]">
            {tasks
              .filter((t) => t.phase === phase)
              .map((task) => {
                const taskIndex = allTasks.indexOf(task);
                const config = STATUS_CONFIG[task.status];
                return (
                  <div key={task.name} className="flex items-center gap-4 px-5 py-3">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateStatus(taskIndex, e.target.value as Task["status"])}
                      className="rounded-md border border-[#e8e6e1] px-2 py-1 text-xs"
                      style={{ color: config.color }}
                    >
                      {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                        <option key={s} value={s}>{c.label}</option>
                      ))}
                    </select>
                    <span className="flex-1 text-sm text-[#1a1a2e]">{task.name}</span>
                    <span className="text-xs text-[#9a9aaa]">{task.duration_days} days</span>
                    {task.dependencies.length > 0 && (
                      <span className="text-[10px] text-[#9a9aaa]">
                        Depends on: {task.dependencies.join(", ")}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
