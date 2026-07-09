import { describe, expect, it, vi } from "vitest";
import type { AzureOpenAI } from "openai";
import {
  getNextFallbackStrategy,
  parseJsonContent,
  runStructuredCompletionWithFallback,
  stripUnsupportedParameter,
} from "../azureCompletionClient";
import { LENS_ANALYSIS_JSON_SCHEMA } from "../schemas";

const sampleResult = {
  score: 84,
  confidence: 91,
  summary: "Summary",
  strengths: ["Strength"],
  concerns: ["Concern"],
  evidence: [
    {
      repository: "dev-user/app",
      path: "package.json",
      description: "manifest",
      facts: ["react"],
    },
  ],
  recommendations: ["Recommendation"],
};

describe("azureCompletionClient fallbacks", () => {
  it("strips unsupported temperature from strategy", () => {
    const adjusted = stripUnsupportedParameter(
      {
        api: "responses",
        structuredOutput: "json_schema",
        temperature: 0.2,
        topP: 0.95,
      },
      "temperature",
    );

    expect(adjusted?.temperature).toBeUndefined();
    expect(adjusted?.topP).toBe(0.95);
  });

  it("falls back from json_schema to json_object", () => {
    const next = getNextFallbackStrategy({
      api: "responses",
      structuredOutput: "json_schema",
    });

    expect(next?.structuredOutput).toBe("json_object");
  });

  it("starts without sampling params for gpt-5-mini and succeeds on first response request", async () => {
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const responsesCreate = vi
      .fn()
      .mockResolvedValueOnce({
        output_text: JSON.stringify(sampleResult),
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
      });

    const client = {
      responses: { create: responsesCreate },
      chat: { completions: { create: vi.fn() } },
    } as unknown as AzureOpenAI;

    const result = await runStructuredCompletionWithFallback<typeof sampleResult>(
      client,
      {
        config: {
          endpoint: "https://example.openai.azure.com",
          apiKey: "key",
          deployment: "gpt-5-mini",
          apiVersion: "2024-10-21",
          usesV1Endpoint: false,
          modelCapabilities: {
            supportsTemperature: false,
            supportsTopP: false,
          },
        },
        params: {
          schemaName: "lens_analysis_test",
          schema: LENS_ANALYSIS_JSON_SCHEMA,
          lensId: "technical-breadth",
          requestType: "lens_analysis",
          userPrompt: "Analyze this portfolio",
        },
      },
    );

    expect(result.parsed.summary).toBe("Summary");
    expect(responsesCreate).toHaveBeenCalledTimes(1);
    expect(responsesCreate.mock.calls[0][0]).not.toHaveProperty("temperature");
    expect(responsesCreate.mock.calls[0][0]).not.toHaveProperty("top_p");
    expect(
      String(responsesCreate.mock.calls[0][0].input).includes(
        "Respond with JSON matching this schema exactly:",
      ),
    ).toBe(false);
    expect(
      String(responsesCreate.mock.calls[0][0].input).includes("Analyze this portfolio"),
    ).toBe(true);
    expect(
      logSpy.mock.calls.some(([message]) => {
        if (typeof message !== "string") return false;
        try {
          const parsed = JSON.parse(message) as { event?: string; promptChars?: number };
          return parsed.event === "azure_request_prompt_size" && (parsed.promptChars ?? 0) > 0;
        } catch {
          return false;
        }
      }),
    ).toBe(true);
  });

  it("falls back from structured outputs to plain JSON via chat completions", async () => {
    const responsesCreate = vi
      .fn()
      .mockRejectedValue(new Error("Responses API route not found"));
    const chatCreate = vi
      .fn()
      .mockRejectedValueOnce({
        status: 400,
        message: "Unsupported parameter: 'response_format' is not supported with this model.",
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(sampleResult) } }],
        usage: { prompt_tokens: 8, completion_tokens: 4, total_tokens: 12 },
      });

    const client = {
      responses: { create: responsesCreate },
      chat: { completions: { create: chatCreate } },
    } as unknown as AzureOpenAI;

    const result = await runStructuredCompletionWithFallback<typeof sampleResult>(
      client,
      {
        config: {
          endpoint: "https://example.openai.azure.com",
          apiKey: "key",
          deployment: "gpt-5-mini",
          apiVersion: "2024-10-21",
          usesV1Endpoint: false,
          modelCapabilities: {
            supportsTemperature: false,
            supportsTopP: false,
          },
        },
        params: {
          schemaName: "lens_analysis_test",
          schema: LENS_ANALYSIS_JSON_SCHEMA,
          lensId: "technical-breadth",
          requestType: "lens_analysis",
          userPrompt: "Analyze this portfolio",
        },
      },
    );

    expect(result.parsed.score).toBe(84);
    expect(chatCreate).toHaveBeenCalledTimes(2);
    const chatPayload = chatCreate.mock.calls[1][0];
    const userMessage = chatPayload.messages?.find(
      (message: { role?: string; content?: string }) => message.role === "user",
    )?.content;
    expect(String(userMessage)).toContain(
      "Return valid JSON only. Match this schema exactly:",
    );
  });

  it("parses JSON embedded in text", () => {
    expect(parseJsonContent<{ score: number }>('Result:\n{"score": 70}\n', "test")).toEqual({
      score: 70,
    });
  });
});
