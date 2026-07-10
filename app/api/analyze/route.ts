import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import { NextResponse } from "next/server";
import {
  analyzeGitHubPortfolio,
  formatAnalysisError,
} from "@/lib/services/analyzePortfolio";

interface AnalyzeRequestBody {
  username?: string;
  candidateEvidence?: CandidateEvidenceModel | null;
  cvSource?: string;
  cvExtractionFailed?: boolean;
  cvUploaded?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequestBody;
    const username = body.username?.trim();

    if (!username) {
      return NextResponse.json(
        { error: "A GitHub username is required." },
        { status: 400 },
      );
    }

    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
      return NextResponse.json(
        { error: "Please provide a valid GitHub username." },
        { status: 400 },
      );
    }

    const report = await analyzeGitHubPortfolio(username, {
      candidateEvidence: body.candidateEvidence ?? undefined,
      cvSource: body.cvSource,
      cvExtractionFailed: body.cvExtractionFailed,
      cvUploaded: body.cvUploaded,
    });
    return NextResponse.json(report);
  } catch (error) {
    const message = formatAnalysisError(error);
    const status = message.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
