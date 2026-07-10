interface ReportNavigationSection {
  id: string;
  label: string;
}

interface ReportNavigationGroup {
  reportId: string;
  reportTitle: string;
  sections: ReportNavigationSection[];
}

interface ReportNavigationProps {
  groups: ReportNavigationGroup[];
}

export function ReportNavigation({ groups }: ReportNavigationProps) {
  const hasSections = groups.some((group) => group.sections.length > 0);

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <nav className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Reports
        </h2>

        {groups.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Expand a report to browse its sections.
          </p>
        ) : (
          <div className="mt-3 space-y-5">
            {groups.map((group, index) => (
              <div key={group.reportId}>
                {index > 0 && (
                  <div
                    aria-hidden="true"
                    className="mb-4 border-t border-slate-200"
                  />
                )}
                <p className="text-sm font-semibold text-slate-900">
                  {group.reportTitle}
                </p>
                <ul className="mt-2 space-y-2">
                  {group.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {hasSections && (
          <a
            href="#top"
            className="mt-4 inline-block text-xs font-medium text-blue-700 hover:underline"
          >
            Back to top
          </a>
        )}
      </nav>
    </aside>
  );
}
