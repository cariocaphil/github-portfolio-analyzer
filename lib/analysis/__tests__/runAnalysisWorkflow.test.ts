import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AnalysisWorkflowError,
  runAnalysisWorkflow,
} from "@/lib/analysis/runAnalysisWorkflow";

const uploadCv = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/cvUploadClient", () => ({
  CvUploadRequestError: class CvUploadRequestError extends Error {
    readonly status?: number;
    readonly stage?: string;

    constructor(message: string, status?: number, stage?: string) {
      super(message);
      this.name = "CvUploadRequestError";
      this.status = status;
      this.stage = stage;
    }
  },
  uploadCv: (...args: unknown[]) => uploadCv(...args),
}));

describe("runAnalysisWorkflow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        developerSnapshot: {
          username: "dev-user",
          name: null,
          bio: null,
          totalRepositories: 1,
          primaryLanguages: ["TypeScript"],
          accountCreated: "2021-01-01T00:00:00Z",
          profileUrl: "https://github.com/dev-user",
        },
        sections: [],
        improvementSuggestions: [],
        metadata: {
          analysisSource: "mock",
          generationTimestamp: new Date().toISOString(),
        },
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runs portfolio-only analysis without CV upload", async () => {
    const onStepChange = vi.fn();

    await runAnalysisWorkflow({
      username: "dev-user",
      onStepChange,
    });

    expect(uploadCv).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledWith("github");
    expect(onStepChange).toHaveBeenCalledWith("generating-portfolio");
  });

  it("uploads CV once and includes CV evidence in the analysis request", async () => {
    const cvFile = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
    uploadCv.mockResolvedValue({
      candidateEvidence: {
        personalInformation: { confidence: 0.9, websites: [] },
        executiveSummary: { confidence: 0.8, text: "Engineer" },
        skills: { confidence: 0.9, entries: ["React"] },
        employmentHistory: { confidence: 0.8, entries: [] },
        education: { confidence: 0.7, entries: [] },
        certifications: { confidence: 0.6, entries: [] },
        projects: { confidence: 0.7, entries: [] },
        languages: { confidence: 0.7, entries: [] },
      },
      filename: "cv.pdf",
    });

    await runAnalysisWorkflow({
      username: "dev-user",
      cvFile,
    });

    expect(uploadCv).toHaveBeenCalledWith(cvFile);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, requestInit] = fetchMock.mock.calls[0] as [
      string,
      { body: string },
    ];
    const body = JSON.parse(requestInit.body) as {
      cvUploaded: boolean;
      candidateEvidence: { skills: { entries: string[] } };
      cvSource: string;
    };

    expect(body.cvUploaded).toBe(true);
    expect(body.cvSource).toBe("cv.pdf");
    expect(body.candidateEvidence.skills.entries).toContain("React");
  });

  it("continues portfolio analysis when CV extraction fails", async () => {
    const cvFile = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
    uploadCv.mockRejectedValue(new Error("CV extraction failed."));

    await runAnalysisWorkflow({
      username: "dev-user",
      cvFile,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, requestInit] = fetchMock.mock.calls[0] as [
      string,
      { body: string },
    ];
    const body = JSON.parse(requestInit.body) as {
      cvUploaded: boolean;
      cvExtractionFailed: boolean;
      candidateEvidence: null;
    };

    expect(body.cvUploaded).toBe(true);
    expect(body.cvExtractionFailed).toBe(true);
    expect(body.candidateEvidence).toBeNull();
  });
});
