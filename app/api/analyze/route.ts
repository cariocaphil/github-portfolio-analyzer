import { NextResponse } from "next/server";
import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import { ValidationError } from "@/lib/errors/application/types";
import {
  createApiErrorResponse,
  handleApiRouteError,
} from "@/lib/errors/apiErrorResponse";
import { analyzeGitHubPortfolio } from "@/lib/services/analyzePortfolio";

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
      return createApiErrorResponse(
        new ValidationError({
          userMessage: "A GitHub username is required.",
        }),
      );
    }

    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
      return createApiErrorResponse(
        new ValidationError({
          userMessage: "Please provide a valid GitHub username.",
        }),
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
    return handleApiRouteError(error, {
      route: "/api/analyze",
      operation: "analyze_portfolio",
    });
  }
}
