import type { ReportSection } from "@/lib/models/report";
import { ObservationView } from "@/components/Observation";

interface ReportSectionViewProps {
  section: ReportSection;
}

export function ReportSectionView({ section }: ReportSectionViewProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
      <p className="mt-1 text-sm text-slate-500">
        <span className="font-medium text-slate-600">Guiding question:</span>{" "}
        {section.guidingQuestion}
      </p>

      <div className="mt-6 space-y-6">
        {section.observations.length === 0 ? (
          <p className="text-sm text-slate-500">
            No observations were generated for this lens.
          </p>
        ) : (
          section.observations.map((observation, index) => (
            <ObservationView
              key={`${section.lensId}-${index}`}
              observation={observation}
            />
          ))
        )}
      </div>
    </section>
  );
}
