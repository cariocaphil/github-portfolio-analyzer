import OpenAI from "openai";
import { ProviderAnalysisError } from "@/lib/errors/ProviderAnalysisError";
import type { AzureOpenAIConfig, TokenUsageTotals } from "./types";
import { AZURE_SYSTEM_PROMPT } from "./prompts";
import { createAzureOpenAIClient } from "./azureClientFactory";
import {
  detectUnsupportedParameter,
  extractAzureFailureDiagnostics,
  isResponsesApiUnsupported,
} from "./azureErrorDiagnostics";
import { logAzureFailure } from "./logger";

export interface StructuredCompletionParams {
  schemaName: string;
  schema: Record<string, unknown>;
  userPrompt: string;
  lensId?: string;
  requestType?: "lens_analysis" | "executive_summary";
}

export interface StructuredCompletionResult<T> {
  parsed: T;
  usage: TokenUsageTotals;
}

export interface AzureCompletionClient {
  createStructuredCompletion<T>(
    params: StructuredCompletionParams,
  ): Promise<StructuredCompletionResult<T>>;
}

export interface RequestStrategy {
  api: "responses" | "chat";
  structuredOutput: "json_schema" | "json_object" | "plain";
  temperature?: number;
  topP?: number;
}

interface RequestContext {
  config: AzureOpenAIConfig;
  params: StructuredCompletionParams;
}

export function createAzureCompletionClient(
  config: AzureOpenAIConfig,
): AzureCompletionClient {
  const client = createAzureOpenAIClient(config);

  return {
    createStructuredCompletion: <T>(params: StructuredCompletionParams) =>
      runStructuredCompletionWithFallback<T>(client, { config, params }),
  };
}

export async function runStructuredCompletionWithFallback<T>(
  client: OpenAI,
  context: RequestContext,
): Promise<StructuredCompletionResult<T>> {
  const initialStrategy: RequestStrategy = {
    api: "responses",
    structuredOutput: "json_schema",
    temperature: 0.2,
    topP: 0.95,
  };

  let strategy = initialStrategy;
  let lastError: unknown;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await executeStrategy<T>(client, context, strategy);
    } catch (error) {
      lastError = error;
      logAzureFailure({
        ...extractAzureFailureDiagnostics(error),
        deployment: context.config.deployment,
        apiVersion: context.config.apiVersion,
        requestType: context.params.requestType ?? "structured_completion",
        lensId: context.params.lensId,
        strategy: describeStrategy(strategy),
      });

      const unsupported = detectUnsupportedParameter(error);
      if (unsupported) {
        const adjusted = stripUnsupportedParameter(strategy, unsupported);
        if (adjusted) {
          strategy = adjusted;
          continue;
        }
      }

      if (strategy.api === "responses" && isResponsesApiUnsupported(error)) {
        strategy = {
          ...strategy,
          api: "chat",
        };
        continue;
      }

      const next = getNextFallbackStrategy(strategy);
      if (!next) {
        break;
      }
      strategy = next;
    }
  }

  throw new ProviderAnalysisError(
    `Azure OpenAI request failed after fallback strategies for ${context.params.schemaName}.`,
    "AzureOpenAIAnalysisProvider",
    lastError,
  );
}

export function getNextFallbackStrategy(
  strategy: RequestStrategy,
): RequestStrategy | null {
  if (strategy.structuredOutput === "json_schema") {
    return {
      ...strategy,
      structuredOutput: "json_object",
    };
  }

  if (strategy.structuredOutput === "json_object") {
    return {
      ...strategy,
      structuredOutput: "plain",
      temperature: undefined,
      topP: undefined,
    };
  }

  if (strategy.api === "responses") {
    return {
      api: "chat",
      structuredOutput: "json_schema",
      temperature: strategy.temperature,
      topP: strategy.topP,
    };
  }

  return null;
}

export function stripUnsupportedParameter(
  strategy: RequestStrategy,
  parameter: ReturnType<typeof detectUnsupportedParameter>,
): RequestStrategy | null {
  if (!parameter) {
    return null;
  }

  if (parameter === "temperature" && strategy.temperature !== undefined) {
    return { ...strategy, temperature: undefined };
  }

  if (parameter === "top_p" && strategy.topP !== undefined) {
    return { ...strategy, topP: undefined };
  }

  if (parameter === "json_schema" && strategy.structuredOutput === "json_schema") {
    return { ...strategy, structuredOutput: "json_object" };
  }

  if (
    parameter === "response_format" &&
    strategy.structuredOutput !== "plain"
  ) {
    return { ...strategy, structuredOutput: "plain", temperature: undefined, topP: undefined };
  }

  return null;
}

function describeStrategy(strategy: RequestStrategy): string {
  return `${strategy.api}:${strategy.structuredOutput}:temp=${strategy.temperature ?? "none"}:top_p=${strategy.topP ?? "none"}`;
}

async function executeStrategy<T>(
  client: OpenAI,
  context: RequestContext,
  strategy: RequestStrategy,
): Promise<StructuredCompletionResult<T>> {
  if (strategy.api === "responses") {
    return executeResponsesRequest<T>(client, context, strategy);
  }

  return executeChatRequest<T>(client, context, strategy);
}

async function executeResponsesRequest<T>(
  client: OpenAI,
  context: RequestContext,
  strategy: RequestStrategy,
): Promise<StructuredCompletionResult<T>> {
  const userContent = buildUserContent(context.params, strategy.structuredOutput);

  const body: Record<string, unknown> = {
    model: context.config.deployment,
    instructions: AZURE_SYSTEM_PROMPT,
    input: userContent,
  };

  if (strategy.temperature !== undefined) {
    body.temperature = strategy.temperature;
  }
  if (strategy.topP !== undefined) {
    body.top_p = strategy.topP;
  }

  if (strategy.structuredOutput === "json_schema") {
    body.text = {
      format: {
        type: "json_schema",
        name: context.params.schemaName,
        schema: context.params.schema,
        strict: true,
      },
    };
  } else if (strategy.structuredOutput === "json_object") {
    body.text = {
      format: { type: "json_object" },
    };
  }

  const response = await client.responses.create(body as never);
  const content = response.output_text;
  if (!content) {
    throw new ProviderAnalysisError(
      `Azure OpenAI Responses API returned empty output for ${context.params.schemaName}.`,
      "AzureOpenAIAnalysisProvider",
    );
  }

  return {
    parsed: parseJsonContent<T>(content, context.params.schemaName),
    usage: mapUsage(response.usage),
  };
}

async function executeChatRequest<T>(
  client: OpenAI,
  context: RequestContext,
  strategy: RequestStrategy,
): Promise<StructuredCompletionResult<T>> {
  const userContent = buildUserContent(context.params, strategy.structuredOutput);
  const body: Record<string, unknown> = {
    model: context.config.deployment,
    messages: [
      { role: "system", content: AZURE_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  };

  if (strategy.temperature !== undefined) {
    body.temperature = strategy.temperature;
  }
  if (strategy.topP !== undefined) {
    body.top_p = strategy.topP;
  }

  if (strategy.structuredOutput === "json_schema") {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: context.params.schemaName,
        schema: context.params.schema,
        strict: true,
      },
    };
  } else if (strategy.structuredOutput === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const completion = await client.chat.completions.create(body as never);
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new ProviderAnalysisError(
      `Azure OpenAI chat completion returned empty output for ${context.params.schemaName}.`,
      "AzureOpenAIAnalysisProvider",
    );
  }

  return {
    parsed: parseJsonContent<T>(content, context.params.schemaName),
    usage: {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    },
  };
}

function buildUserContent(
  params: StructuredCompletionParams,
  structuredOutput: RequestStrategy["structuredOutput"],
): string {
  if (structuredOutput === "plain") {
    return `${params.userPrompt}\n\nReturn valid JSON only. Match this schema exactly:\n${JSON.stringify(params.schema)}`;
  }

  return `${params.userPrompt}\n\nRespond with JSON matching this schema exactly:\n${JSON.stringify(params.schema)}`;
}

function mapUsage(usage?: {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}): TokenUsageTotals {
  return {
    promptTokens: usage?.input_tokens ?? 0,
    completionTokens: usage?.output_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}

export function parseJsonContent<T>(content: string, schemaName: string): T {
  try {
    return JSON.parse(content) as T;
  } catch (firstError) {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new ProviderAnalysisError(
        `Failed to parse Azure OpenAI JSON response for ${schemaName}.`,
        "AzureOpenAIAnalysisProvider",
        firstError,
      );
    }

    try {
      return JSON.parse(match[0]) as T;
    } catch (secondError) {
      throw new ProviderAnalysisError(
        `Failed to parse Azure OpenAI JSON response for ${schemaName}.`,
        "AzureOpenAIAnalysisProvider",
        secondError,
      );
    }
  }
}
