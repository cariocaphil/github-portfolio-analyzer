import { DocumentConfigurationError } from "@/lib/azure/documentIntelligenceErrors";

export const DEFAULT_DOCUMENT_INTELLIGENCE_MODEL_ID = "prebuilt-layout";

export interface DocumentIntelligenceConfig {
  endpoint: string;
  key: string;
  modelId: string;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

export function loadDocumentIntelligenceConfig(): DocumentIntelligenceConfig {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim();
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim();
  const modelId =
    process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID?.trim() ||
    DEFAULT_DOCUMENT_INTELLIGENCE_MODEL_ID;

  const missing: string[] = [];
  if (!endpoint) missing.push("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT");
  if (!key) missing.push("AZURE_DOCUMENT_INTELLIGENCE_KEY");

  if (missing.length > 0) {
    throw new DocumentConfigurationError(
      `Missing required Azure Document Intelligence configuration: ${missing.join(", ")}.`,
    );
  }

  return {
    endpoint: normalizeEndpoint(endpoint!),
    key: key!,
    modelId,
  };
}
