import { DocumentConfigurationError } from "@/lib/azure/documentIntelligenceErrors";

export interface DocumentIntelligenceConfig {
  endpoint: string;
  key: string;
}

export function loadDocumentIntelligenceConfig(): DocumentIntelligenceConfig {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim();
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim();

  const missing: string[] = [];
  if (!endpoint) missing.push("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT");
  if (!key) missing.push("AZURE_DOCUMENT_INTELLIGENCE_KEY");

  if (missing.length > 0) {
    throw new DocumentConfigurationError(
      `Missing required Azure Document Intelligence configuration: ${missing.join(", ")}.`,
    );
  }

  return {
    endpoint: endpoint!,
    key: key!,
  };
}
