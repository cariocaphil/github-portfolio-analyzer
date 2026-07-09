import { afterEach, describe, expect, it } from "vitest";
import { loadAzureConfig } from "../azureConfig";
import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";

const ENV_KEYS = [
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_DEPLOYMENT",
  "AZURE_OPENAI_API_VERSION",
] as const;

describe("loadAzureConfig", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("loads configuration from environment variables", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o-mini";
    process.env.AZURE_OPENAI_API_VERSION = "2024-10-21";

    expect(loadAzureConfig()).toEqual({
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
  });

  it("marks v1 api version configuration correctly", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5-mini";
    process.env.AZURE_OPENAI_API_VERSION = "v1";

    expect(loadAzureConfig()).toEqual({
      endpoint: "https://example.openai.azure.com",
      apiKey: "test-key",
      deployment: "gpt-5-mini",
      apiVersion: "v1",
      usesV1Endpoint: true,
      modelCapabilities: {
        supportsTemperature: false,
        supportsTopP: false,
      },
    });
  });

  it("throws ProviderConfigurationError when endpoint includes api-version query", () => {
    process.env.AZURE_OPENAI_ENDPOINT =
      "https://example.openai.azure.com?api-version=v1";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5-mini";
    process.env.AZURE_OPENAI_API_VERSION = "v1";

    expect(() => loadAzureConfig()).toThrow(ProviderConfigurationError);
  });

  it("throws ProviderConfigurationError when variables are missing", () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }

    expect(() => loadAzureConfig()).toThrow(ProviderConfigurationError);
  });
});
