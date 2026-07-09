import type { AzureModelCapabilities } from "./types";

const DEFAULT_CAPABILITIES: AzureModelCapabilities = {
  supportsTemperature: true,
  supportsTopP: true,
};

const MODEL_CAPABILITY_OVERRIDES: Array<{
  matcher: (deployment: string) => boolean;
  capabilities: AzureModelCapabilities;
}> = [
  {
    matcher: (deployment) => deployment.toLowerCase().startsWith("gpt-5"),
    capabilities: {
      supportsTemperature: false,
      supportsTopP: false,
    },
  },
];

export function resolveAzureModelCapabilities(
  deployment: string,
): AzureModelCapabilities {
  const match = MODEL_CAPABILITY_OVERRIDES.find((entry) =>
    entry.matcher(deployment),
  );

  return match?.capabilities ?? DEFAULT_CAPABILITIES;
}
