interface DistributionItem {
  label: string;
  value: number;
}

interface ReportVisualsProps {
  lensDistribution: DistributionItem[];
  technologyDistribution: DistributionItem[];
  repositoryTypeDistribution: DistributionItem[];
}

function DistributionCard({
  title,
  items,
}: {
  title: string;
  items: DistributionItem[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={`${title}-${item.label}`}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-slate-700"
                style={{ width: `${Math.round((item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ReportVisuals({
  lensDistribution,
  technologyDistribution,
  repositoryTypeDistribution,
}: ReportVisualsProps) {
  return (
    <section
      id="visual-summary"
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">Visual Summary</h2>
      <p className="mt-1 text-sm text-slate-600">
        Lightweight distributions complement the detailed textual assessment.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <DistributionCard title="Lens finding density" items={lensDistribution} />
        <DistributionCard
          title="Technology categories"
          items={technologyDistribution}
        />
        <DistributionCard
          title="Repository evidence profile"
          items={repositoryTypeDistribution}
        />
      </div>
    </section>
  );
}
