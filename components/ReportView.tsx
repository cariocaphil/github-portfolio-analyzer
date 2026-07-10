import { ReportsWorkspace } from "@/components/reports/ReportsWorkspace";
import type { DeveloperPortfolioReport } from "@/lib/models/report";

interface ReportViewProps {
  report: DeveloperPortfolioReport;
}

export function ReportView({ report }: ReportViewProps) {
  return <ReportsWorkspace report={report} />;
}
