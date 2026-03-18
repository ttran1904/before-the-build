"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROJECT_GOAL_LABELS,
  DESIGN_STYLE_LABELS,
  ROOM_TYPE_LABELS,
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEPS,
} from "@before-the-build/shared";
import type {
  ProjectGoal,
  DesignStyle,
  RoomType,
  OnboardingStep,
} from "@before-the-build/shared";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("household_info");
  const currentIndex = ONBOARDING_STEPS.indexOf(step);

  const next = () => {
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      setStep(ONBOARDING_STEPS[currentIndex + 1]);
    }
  };

  const back = () => {
    if (currentIndex > 0) {
      setStep(ONBOARDING_STEPS[currentIndex - 1]);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {ONBOARDING_STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                i <= currentIndex ? "bg-zinc-900 dark:bg-zinc-50" : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-zinc-500">
          Step {currentIndex + 1} of {ONBOARDING_STEPS.length}:{" "}
          {ONBOARDING_STEP_LABELS[step]}
        </p>
      </div>

      {/* Step content */}
      {step === "household_info" && <HouseholdInfoStep />}
      {step === "areas_of_interest" && <AreasOfInterestStep />}
      {step === "explore_styles" && <ExploreStylesStep />}
      {step === "set_goals" && <SetGoalsStep />}
      {step === "scan_rooms" && <ScanRoomsStep />}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={back}
          disabled={currentIndex === 0}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300"
        >
          Back
        </button>
        {currentIndex < ONBOARDING_STEPS.length - 1 ? (
          <button
            onClick={next}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Finish Setup
          </button>
        )}
      </div>
    </div>
  );
}

function HouseholdInfoStep() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          About Your Household
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Help us tailor recommendations to your lifestyle.
        </p>
      </div>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Number of Adults
          </span>
          <input
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Number of Children
          </span>
          <input
            type="number"
            min={0}
            defaultValue={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Daily Habits &amp; Routines
          </span>
          <textarea
            rows={3}
            placeholder="e.g., Work from home, cook daily, exercise at home..."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
      </div>
    </div>
  );
}

function AreasOfInterestStep() {
  const [selected, setSelected] = useState<RoomType[]>([]);
  const toggle = (t: RoomType) =>
    setSelected((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          What areas do you want to change?
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Select all that apply.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {(Object.entries(ROOM_TYPE_LABELS) as [RoomType, string][]).map(([type, label]) => (
          <button
            key={type}
            onClick={() => toggle(type)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              selected.includes(type)
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExploreStylesStep() {
  const [selected, setSelected] = useState<DesignStyle[]>([]);
  const toggle = (s: DesignStyle) =>
    setSelected((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Explore Styles You Love
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Pick your favorite aesthetics. Browse more from the Explore page later.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(Object.entries(DESIGN_STYLE_LABELS) as [DesignStyle, string][]).map(
          ([style, label]) => (
            <button
              key={style}
              onClick={() => toggle(style)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition ${
                selected.includes(style)
                  ? "border-zinc-900 dark:border-zinc-50"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-xl dark:bg-zinc-800">
                {label.charAt(0)}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {label}
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function SetGoalsStep() {
  const [goals, setGoals] = useState<ProjectGoal[]>([]);
  const toggle = (g: ProjectGoal) =>
    setGoals((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          What is the goal?
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select your project goals and define must-haves.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {(Object.entries(PROJECT_GOAL_LABELS) as [ProjectGoal, string][]).map(
          ([goal, label]) => (
            <button
              key={goal}
              onClick={() => toggle(goal)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                goals.includes(goal)
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <label className="block">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Must Haves</span>
        <textarea
          rows={3}
          placeholder="e.g., Open floor plan, island kitchen, walk-in closet..."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nice to Haves</span>
        <textarea
          rows={3}
          placeholder="e.g., Skylight, home gym area, reading nook..."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
    </div>
  );
}

function ScanRoomsStep() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Scan Your Rooms
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Room scanning works best on the mobile app using AR. You can also add
          rooms manually below.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 p-12 dark:border-zinc-700">
        <span className="text-5xl">📱</span>
        <p className="text-sm text-zinc-500">
          Open the mobile app to scan rooms with AR, or add rooms manually here.
        </p>
      </div>

      <button className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
        + Add Room Manually
      </button>
    </div>
  );
}
