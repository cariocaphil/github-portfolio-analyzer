import OpenAI, { AzureOpenAI } from "openai";
import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";
import type { AzureOpenAIConfig } from "./types";

const PROVIDER_NAME = "AzureOpenAIAnalysisProvider";

export function isAzureOpenAiV1(apiVersion: string): boolean {
  return apiVersion.trim().toLowerCase() === "v1";
}

export function buildAzureV1BaseUrl(endpoint: string): string {
  const normalized = endpoint.replace(/\/+$/, "");

  if (normalized.includes("api-version=")) {
    throw new ProviderConfigurationError(
      "AZURE_OPENAI_ENDPOINT must not include api-version query parameters. Set AZURE_OPENAI_API_VERSION separately.",
      PROVIDER_NAME,
    );
  }

  if (normalized.endsWith("/openai/v1")) {
    return `${normalized}/`;
  }

  if (normalized.endsWith("/openai")) {
    return `${normalized}/v1/`;
  }

  return `${normalized}/openai/v1/`;
}

export function validateAzureConfiguration(config: AzureOpenAIConfig): void {
  if (config.endpoint.includes("api-version=")) {
    throw new ProviderConfigurationError(
      "AZURE_OPENAI_ENDPOINT must not include api-version query parameters. Set AZURE_OPENAI_API_VERSION separately.",
      PROVIDER_NAME,
    );
  }

  if (isAzureOpenAiV1(config.apiVersion)) {
    try {
      buildAzureV1BaseUrl(config.endpoint);
    } catch (error) {
      if (error instanceof ProviderConfigurationError) {
        throw error;
      }
      throw new ProviderConfigurationError(
        "Invalid AZURE_OPENAI_ENDPOINT for Azure OpenAI v1 configuration.",
        PROVIDER_NAME,
      );
    }
  }
}

export interface AzureClientBuildResult {
  client: OpenAI;
  baseURL: string;
  usesV1Path: boolean;
  includesApiVersionQuery: boolean;
}

export function buildAzureClientConfiguration(
  config: AzureOpenAIConfig,
): AzureClientBuildResult {
  validateAzureConfiguration(config);

  if (isAzureOpenAiV1(config.apiVersion)) {
    const baseURL = buildAzureV1BaseUrl(config.endpoint);
    const client = new OpenAI({
      baseURL,
      apiKey: config.apiKey,
      defaultHeaders: {
        "api-key": config.apiKey,
      },
    });

    return {
      client,
      baseURL,
      usesV1Path: true,
      includesApiVersionQuery: false,
    };
  }

  const client = new AzureOpenAI({
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    apiVersion: config.apiVersion,
    deployment: config.deployment,
  });

  return {
    client,
    baseURL: `${config.endpoint.replace(/\/+$/, "")}/openai`,
    usesV1Path: false,
    includesApiVersionQuery: true,
  };
}

export function createAzureOpenAIClient(config: AzureOpenAIConfig): OpenAI {
  return buildAzureClientConfiguration(config).client;
}
