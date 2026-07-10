interface AnalysisErrorAlertProps {
  title: string;
  message: string;
}

export function AnalysisErrorAlert({ title, message }: AnalysisErrorAlertProps) {
  return (
    <div
      role="alert"
      className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-amber-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-amber-800">{message}</p>
    </div>
  );
}
