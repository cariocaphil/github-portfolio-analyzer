import type { TechnologyCategoryGroup } from "@/lib/presentation/reportPresentation";

interface TechnologyBreakdownProps {
  groups: TechnologyCategoryGroup[];
}

export function TechnologyBreakdown({ groups }: TechnologyBreakdownProps) {
  const total = groups.reduce((sum, group) => sum + group.technologies.length, 0);
  const max = Math.max(...groups.map((group) => group.technologies.length), 1);

  return (
    <section
      id="technology-breakdown"
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">Technology Breakdown</h2>
      <p className="mt-1 text-sm text-slate-600">
        Technologies are grouped in the presentation layer and unknown tools are
        retained under General Utilities.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          const value = group.technologies.length;
          const width = Math.round((value / max) * 100);
          return (
            <article key={group.category} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">{group.category}</h3>
                <span className="text-xs text-slate-500">{value} technologies</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-700"
                  style={{ width: `${width}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.technologies.length === 0 ? (
                  <span className="text-xs text-slate-500">No entries</span>
                ) : (
                  group.technologies.map((technology) => (
                    <span
                      key={`${group.category}-${technology}`}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {technology}
                    </span>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500">Total categorized technologies: {total}</p>
    </section>
  );
}
