interface AnalyzeFormProps {
  onAnalyze: (username: string) => void;
  loading: boolean;
}

export function AnalyzeForm({ onAnalyze, loading }: AnalyzeFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    if (username) {
      onAnalyze(username);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <label htmlFor="username" className="block text-sm font-medium text-slate-700">
        GitHub username
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="username"
          name="username"
          type="text"
          required
          placeholder="octocat"
          disabled={loading}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
