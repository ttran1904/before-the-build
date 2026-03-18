export default function BuildBookPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Build Book
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your comprehensive project review — everything in one place.
        </p>
      </div>

      {/* Scope */}
      <Section icon="📋" title="Scope Description">
        <p className="text-sm text-zinc-500">
          No build book generated yet. Complete your room designs to generate a
          comprehensive review.
        </p>
      </Section>

      {/* 2D Layouts */}
      <Section icon="📐" title="2D Layouts">
        <Placeholder text="Room floor plans will appear here" />
      </Section>

      {/* 3D Layouts */}
      <Section icon="🏠" title="3D Layouts">
        <Placeholder text="3D room renders will appear here" />
      </Section>

      {/* Movement Flow */}
      <Section icon="🏃" title="Movement Flow">
        <p className="text-sm text-zinc-500">
          A gaming-like simulation showing how people, children, and pets move
          through the space. Available after finalizing your design.
        </p>
        <Placeholder text="Movement simulation preview" />
      </Section>

      {/* Cost Summary */}
      <Section icon="💰" title="Cost Summary">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Total Estimated Cost
          </span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            $0.00
          </span>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900">
          Generate Build Book
        </button>
        <button className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
          Export as PDF
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-400 dark:bg-zinc-800">
      {text}
    </div>
  );
}
