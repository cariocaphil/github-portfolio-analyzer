import { describe, expect, it, vi } from "vitest";
import OpenAI from "openai";
import {
  buildAzureClientConfiguration,
  buildAzureV1BaseUrl,
  createAzureOpenAIClient,
} from "../azureClientFactory";
import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";

describe("azureClientFactory", () => {
  it("builds Azure OpenAI v1 base URL from resource endpoint", () => {
    expect(buildAzureV1BaseUrl("https://example.openai.azure.com")).toBe(
      "https://example.openai.azure.com/openai/v1/",
    );
  });

  it("does not duplicate /openai/v1 when endpoint already includes it", () => {
    expect(buildAzureV1BaseUrl("https://example.openai.azure.com/openai/v1")).toBe(
      "https://example.openai.azure.com/openai/v1/",
    );
  });

  it("throws ProviderConfigurationError when endpoint includes api-version query", () => {
    expect(() =>
      buildAzureV1BaseUrl("https://example.openai.azure.com?api-version=v1"),
    ).toThrow(ProviderConfigurationError);
  });

  it("v1 client configuration does not include api-version query parameter", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({ ok: true }),
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    const config = {
      endpoint: "https://example.openai.azure.com",
      apiKey: "test-key",
      deployment: "gpt-5-mini",
      apiVersion: "v1",
      usesV1Endpoint: true,
      modelCapabilities: {
        supportsTemperature: false,
        supportsTopP: false,
      },
    };

    const built = buildAzureClientConfiguration(config);
    expect(built.baseURL).toBe("https://example.openai.azure.com/openai/v1/");
    expect(built.usesV1Path).toBe(true);
    expect(built.includesApiVersionQuery).toBe(false);

    const client = new OpenAI({
      baseURL: built.baseURL,
      apiKey: config.apiKey,
      defaultHeaders: { "api-key": config.apiKey },
      fetch: fetchMock as typeof fetch,
    });

    await client.responses.create({
      model: config.deployment,
      input: "test",
    });

    const requestUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");
    expect(requestUrl).toContain("/openai/v1/responses");
    expect(requestUrl).not.toContain("api-version=");
  });

  it("legacy configuration keeps api-version query handling via AzureOpenAI client", () => {
    const built = buildAzureClientConfiguration({
      endpoint: "https://example.openai.azure.com",
      apiKey: "test-key",
      deployment: "gpt-4o-mini",
      apiVersion: "2024-10-21",
      usesV1Endpoint: false,
      modelCapabilities: {
        supportsTemperature: true,
        supportsTopP: true,
      },
    });

    expect(built.usesV1Path).toBe(false);
    expect(built.includesApiVersionQuery).toBe(true);
    expect(createAzureOpenAIClient).toBeDefined();
  });
});
