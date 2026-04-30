export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">
          Your workspace is ready
        </h1>
        <p className="mt-2 text-slate-400">
          Cognitive features — Focus Queue, Zen Mode, and the Cognitive Guardian
          — will appear here as they are activated.
        </p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-500">
          No active features yet. Check back soon.
        </p>
      </div>
    </div>
  );
}
