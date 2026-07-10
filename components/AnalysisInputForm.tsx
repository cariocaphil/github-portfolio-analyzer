"use client";

import { useRef, useState } from "react";
import {
  CV_PDF_MIME_TYPE,
  formatCvFileSize,
  validateCvFileSelection,
} from "@/lib/cv/cvUploadValidation";

interface AnalysisInputFormProps {
  onAnalyze: (input: { username: string; cvFile: File | null }) => void;
  loading: boolean;
}

export function AnalysisInputForm({
  onAnalyze,
  loading,
}: AnalysisInputFormProps) {
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [cvSelectionError, setCvSelectionError] = useState<string | null>(null);

  function handleCvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedCvFile(file);
    setCvSelectionError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();

    if (!username) {
      return;
    }

    if (selectedCvFile) {
      const validationError = validateCvFileSelection(selectedCvFile);
      if (validationError) {
        setCvSelectionError(validationError);
        return;
      }
    }

    onAnalyze({ username, cvFile: selectedCvFile });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <section>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            1
          </span>
          <h2 className="text-lg font-semibold text-slate-900">
            GitHub Portfolio
          </h2>
        </div>

        <label
          htmlFor="username"
          className="mt-4 block text-sm font-medium text-slate-700"
        >
          GitHub Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          placeholder="octocat"
          disabled={loading}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
        />
      </section>

      <div className="my-6 border-t border-slate-200" />

      <section>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
            2
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Optional CV</h2>
        </div>

        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Upload a CV PDF to include a CV ↔ GitHub alignment analysis. The CV is
          optional. If no CV is provided, the application will generate only the
          Engineering Portfolio Assessment.
        </p>

        <div className="mt-4">
          <input
            ref={cvInputRef}
            id="cv-file"
            type="file"
            accept={CV_PDF_MIME_TYPE}
            disabled={loading}
            onChange={handleCvFileChange}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-60"
          />
        </div>

        {selectedCvFile && (
          <p className="mt-3 text-sm text-slate-700">
            Selected:{" "}
            <span className="font-medium text-slate-900">
              {selectedCvFile.name}
            </span>
            <span className="text-slate-500">
              {" "}
              ({formatCvFileSize(selectedCvFile.size)})
            </span>
          </p>
        )}

        {cvSelectionError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {cvSelectionError}
          </p>
        )}
      </section>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={loading}
          className="min-w-[180px] rounded-md bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
