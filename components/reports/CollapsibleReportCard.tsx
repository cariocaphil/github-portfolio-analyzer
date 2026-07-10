"use client";

import type { ReactNode } from "react";

interface CollapsibleReportCardProps {
  reportId: string;
  title: string;
  expanded: boolean;
  onToggle: (reportId: string) => void;
  isPrimary?: boolean;
  header: ReactNode;
  children: ReactNode;
}

export function CollapsibleReportCard({
  reportId,
  title,
  expanded,
  onToggle,
  isPrimary = false,
  header,
  children,
}: CollapsibleReportCardProps) {
  const contentId = `${reportId}-content`;

  return (
    <article
      aria-label={title}
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
        isPrimary
          ? "border-slate-300 ring-1 ring-slate-100"
          : "border-slate-200"
      }`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => onToggle(reportId)}
        className="flex w-full items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 text-left hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">{header}</div>
        <span
          aria-hidden="true"
          className="mt-1 shrink-0 text-sm font-medium text-slate-500"
        >
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded && (
        <div id={contentId} className="space-y-8 px-6 py-6">
          {children}
        </div>
      )}
    </article>
  );
}
