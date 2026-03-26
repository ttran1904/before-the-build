"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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

  /* Dirty-check: only re-fetch when wizard inputs actually change */
  const inputHash = useMemo(
    () => [store.scope, store.goal, store.budgetTier].join("|"),
    [store.scope, store.goal, store.budgetTier],
  );
  const fetchedHashRef = useRef("");

  const fetchTasks = useCallback(async () => {
    if (fetchedHashRef.current === inputHash && tasks.length > 0) {
      setLoading(false);
      return;
    }
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
      fetchedHashRef.current = inputHash;
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, [inputHash, store.scope, store.goal, store.budgetTier, tasks.length]);

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
          <Link href="/renovate/bathroom/visualize" className="flex items-center gap-2 text-sm text-[#6a6a7a] hover:text-[#1a1a2e]">
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

/* ── Gantt View (frappe-gantt) ── */
function GanttView({ tasks }: { tasks: Task[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    // Build start dates based on dependency offsets
    const taskPositions = new Map<string, { start: number; end: number }>();
    tasks.forEach((task) => {
      let start = 0;
      for (const dep of task.dependencies) {
        const depPos = taskPositions.get(dep);
        if (depPos && depPos.end > start) start = depPos.end;
      }
      taskPositions.set(task.name, { start, end: start + task.duration_days });
    });

    // Convert to frappe-gantt format
    const baseDate = new Date();
    const frappeTaskList = tasks.map((task, i) => {
      const pos = taskPositions.get(task.name)!;
      const startDate = new Date(baseDate);
      startDate.setDate(startDate.getDate() + pos.start);
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + pos.end);

      // Format as YYYY-MM-DD strings for frappe-gantt v1.x
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      return {
        id: `task-${i}`,
        name: task.name,
        start: fmt(startDate),
        end: fmt(endDate),
        progress: task.status === "done" ? 100 : task.status === "in_progress" ? 50 : 0,
        dependencies: task.dependencies
          .map((dep) => {
            const depIndex = tasks.findIndex((t) => t.name === dep);
            return depIndex >= 0 ? `task-${depIndex}` : null;
          })
          .filter(Boolean)
          .join(", "),
        custom_class: `gantt-phase-${task.phase.toLowerCase().replace(/\s+/g, "-")}`,
      };
    });

    // Build a map of task index → phase for direct coloring
    const taskPhaseMap = new Map(
      tasks.map((t, i) => [`task-${i}`, t.phase])
    );

    // Dynamically import frappe-gantt (DOM-dependent, no SSR)
    import("frappe-gantt").then((mod) => {
      const Gantt = mod.default;
      // Clear previous chart
      if (!containerRef.current) return;

      // Inject frappe-gantt CSS if not already loaded
      if (!document.getElementById("frappe-gantt-css")) {
        const link = document.createElement("link");
        link.id = "frappe-gantt-css";
        link.rel = "stylesheet";
        link.href = "/frappe-gantt.css";
        document.head.appendChild(link);
      }

      containerRef.current.innerHTML = "";

      ganttRef.current = new Gantt(containerRef.current, frappeTaskList, {
        view_mode: "Day",
        bar_height: 28,
        bar_corner_radius: 4,
        arrow_curve: 6,
        padding: 18,
        language: "en",
        on_click: () => {},
        on_date_change: () => {},
        on_progress_change: () => {},
        on_view_change: () => {},
      });

      // Directly color bars by phase after render
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const barWrappers = containerRef.current.querySelectorAll(".bar-wrapper");
        barWrappers.forEach((wrapper) => {
          const dataId = wrapper.getAttribute("data-id");
          if (!dataId) return;
          const phase = taskPhaseMap.get(dataId);
          const color = phase ? PHASE_COLORS[phase] : "#2d5a3d";
          if (color) {
            const bar = wrapper.querySelector(".bar") as SVGRectElement | null;
            if (bar) bar.setAttribute("fill", color);
            const progress = wrapper.querySelector(".bar-progress") as SVGRectElement | null;
            if (progress) progress.setAttribute("fill", color);
          }
        });
      });
    });
  }, [tasks]);

  return (
    <div className="rounded-xl border border-[#e8e6e1] bg-white shadow-sm overflow-hidden">
      {/* Title + legend header */}
      <div className="border-b border-[#e8e6e1] px-6 py-4">
        <h3 className="mb-2 text-lg font-semibold text-[#1a1a2e]">Project Timeline</h3>
        <p className="mb-3 text-xs text-[#9a9aaa]">
          AI-generated renovation schedule. Phases are color-coded with dependency arrows shown.
        </p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(PHASE_COLORS).map(([phase, color]) => (
            <span key={phase} className="flex items-center gap-1.5 text-xs text-[#6a6a7a]">
              <span className="h-2.5 w-2.5 rounded" style={{ background: color }} />
              {phase}
            </span>
          ))}
        </div>
      </div>

      {/* frappe-gantt renders here */}
      <div className="w-full overflow-x-auto">
        <div ref={containerRef} className="gantt-container min-w-[900px]" />
      </div>

      {/* Phase-specific bar color overrides */}
      <style jsx global>{`
        .gantt-container {
          --g-bar-color: #2d5a3d;
          --g-bar-border: #2d5a3d;
        }
        .gantt-container .grid-header {
          background-color: #fafaf8;
        }
        .gantt-container .gantt .grid-row {
          fill: #ffffff;
        }
        .gantt-container .gantt .grid-row:nth-child(even) {
          fill: #fdfcfa;
        }
        .gantt-container .gantt .row-line {
          stroke: #f3f2ef;
        }
        .gantt-container .gantt .tick {
          stroke: #f0efeb;
          stroke-dasharray: none;
        }
        .gantt-container .gantt .today-highlight {
          fill: rgba(45, 90, 61, 0.06);
        }
        .gantt-container .gantt .arrow {
          stroke: #8a8a9a;
          stroke-width: 1.8;
        }
        .gantt-container .gantt .bar-label {
          font-size: 11px;
          font-weight: 600;
          fill: #fff;
        }
        .gantt-container .gantt .bar-wrapper .bar-label.big {
          font-size: 11px;
          fill: #1a1a2e;
        }
        .gantt-container .lower-text,
        .gantt-container .upper-text {
          font-size: 11px;
          color: #9a9aaa;
          font-weight: 500;
        }
        .gantt-container .gantt .lower-text,
        .gantt-container .gantt .upper-text {
          font-size: 11px;
          fill: #9a9aaa;
          font-weight: 500;
        }
        .gantt-container .gantt .bar-wrapper:hover .bar {
          filter: brightness(1.08);
        }
        /* Phase colors */
        .gantt .bar-wrapper.gantt-phase-planning .bar {
          fill: #87CEEB !important;
        }
        .gantt .bar-wrapper.gantt-phase-demolition .bar {
          fill: #d4956a !important;
        }
        .gantt .bar-wrapper.gantt-phase-rough-work .bar {
          fill: #2d5a3d !important;
        }
        .gantt .bar-wrapper.gantt-phase-installation .bar {
          fill: #d4c5e8 !important;
        }
        .gantt .bar-wrapper.gantt-phase-finishing .bar {
          fill: #bde0c0 !important;
        }
        /* Popup styling */
        .gantt-container .popup-wrapper .pointer {
          display: none;
        }
      `}</style>
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
