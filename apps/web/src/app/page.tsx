import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 font-sans dark:bg-zinc-950">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Before The Build
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Plan, design, and visualize your dream renovation — from inspiration
          to build book.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get Started
          </Link>
          <Link
            href="/explore"
            className="rounded-full border border-zinc-300 px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Explore Styles
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            icon="📷"
            title="Scan & Capture"
            description="Use your phone to scan rooms and capture existing layouts"
          />
          <FeatureCard
            icon="🎨"
            title="AI Design"
            description="Get personalized recommendations powered by AI"
          />
          <FeatureCard
            icon="📐"
            title="2D & 3D Views"
            description="Interactive room design with drag & drop furniture"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 px-6 py-8 dark:border-zinc-800 dark:bg-zinc-900/50">
      <span className="text-3xl">{icon}</span>
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}
