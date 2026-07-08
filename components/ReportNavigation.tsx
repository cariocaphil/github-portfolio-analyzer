interface ReportNavigationItem {
  id: string;
  label: string;
}

interface ReportNavigationProps {
  items: ReportNavigationItem[];
}

export function ReportNavigation({ items }: ReportNavigationProps) {
  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <nav className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Report navigation
        </h2>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#top"
          className="mt-4 inline-block text-xs font-medium text-blue-700 hover:underline"
        >
          Back to top
        </a>
      </nav>
    </aside>
  );
}
