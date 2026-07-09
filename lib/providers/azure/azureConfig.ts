import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";
import {
  isAzureOpenAiV1,
  validateAzureConfiguration,
} from "./azureClientFactory";
import type { AzureOpenAIConfig } from "./types";

const PROVIDER_NAME = "AzureOpenAIAnalysisProvider";

export function loadAzureConfig(): AzureOpenAIConfig {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim();

  const missing: string[] = [];
  if (!endpoint) missing.push("AZURE_OPENAI_ENDPOINT");
  if (!apiKey) missing.push("AZURE_OPENAI_API_KEY");
  if (!deployment) missing.push("AZURE_OPENAI_DEPLOYMENT");
  if (!apiVersion) missing.push("AZURE_OPENAI_API_VERSION");

  if (missing.length > 0) {
    throw new ProviderConfigurationError(
      `Missing required Azure OpenAI configuration: ${missing.join(", ")}.`,
      PROVIDER_NAME,
    );
  }

  const config: AzureOpenAIConfig = {
    endpoint: endpoint!,
    apiKey: apiKey!,
    deployment: deployment!,
    apiVersion: apiVersion!,
    usesV1Endpoint: isAzureOpenAiV1(apiVersion!),
  };

  validateAzureConfiguration(config);
  return config;
}
