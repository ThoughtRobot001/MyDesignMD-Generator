import OpenAI from "openai";
import type { ResponseInput, ResponseInputContent } from "openai/resources/responses/responses";
import { OPENAI_FALLBACK_MODEL, OPENAI_MAX_TOKENS, OPENAI_MODEL } from "./prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ClaudeClientOptions = {
  system: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string | Array<unknown>;
  }>;
  model?: string;
  maxTokens?: number;
};

export type AiClientOptions = ClaudeClientOptions;

export class ClientError extends Error {
  /** Creates a typed Claude client error with an optional cause. */
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ClientError";
  }
}

/** Sends a non-streaming OpenAI request and returns the response text. */
export async function aiClient(options: AiClientOptions): Promise<string> {
  try {
    const finalModel = options.model ?? OPENAI_MODEL;

    const response = await createResponseWithFallback(finalModel, options);
    const content = response.output_text;

    if (content === null || content === undefined || content.trim().length === 0) {
      if (finalModel !== OPENAI_FALLBACK_MODEL) {
        console.warn(`[openai] Model ${finalModel} returned no text; retrying with ${OPENAI_FALLBACK_MODEL}.`);
        return await aiClient({ ...options, model: OPENAI_FALLBACK_MODEL });
      }

      throw new ClientError("OpenAI response did not include text content.");
    }

    return content;
  } catch (error) {
    if (error instanceof ClientError) {
      throw error;
    }

    throw new ClientError(`OpenAI SDK request failed: ${getErrorMessage(error)}`, error);
  }
}

/** Sends a streaming OpenAI chat request and returns the final accumulated text. */
export async function aiClientStream(
  options: ClaudeClientOptions,
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    const stream = await createStreamWithFallback(options.model ?? OPENAI_MODEL, options);

    let full = "";
    for await (const event of stream) {
      const eventRecord = getRecord(event);
      const text = eventRecord.type === "response.output_text.delta" && typeof eventRecord.delta === "string"
        ? eventRecord.delta
        : "";
      if (text) {
        full += text;
        onChunk(text);
      }
    }

    if (full.trim().length === 0) {
      if ((options.model ?? OPENAI_MODEL) !== OPENAI_FALLBACK_MODEL) {
        console.warn(`[openai] Model ${options.model ?? OPENAI_MODEL} streamed no text; retrying with ${OPENAI_FALLBACK_MODEL}.`);
        return await aiClientStream({ ...options, model: OPENAI_FALLBACK_MODEL }, onChunk);
      }

      throw new ClientError("OpenAI streaming response did not include text content.");
    }

    return full;
  } catch (error) {
    if (error instanceof ClientError) {
      throw error;
    }

    if (shouldFallbackModel(error, options.model ?? OPENAI_MODEL)) {
      console.warn(`[openai] Model ${options.model ?? OPENAI_MODEL} unavailable during stream; retrying with ${OPENAI_FALLBACK_MODEL}.`);
      return await aiClientStream({ ...options, model: OPENAI_FALLBACK_MODEL }, onChunk);
    }

    throw new ClientError(`OpenAI streaming SDK request failed: ${getErrorMessage(error)}`, error);
  }
}

/** Creates a JSON-mode response, falling back when the preferred model is unavailable. */
async function createResponseWithFallback(model: string, options: AiClientOptions) {
  try {
    return await openai.responses.create({
      model,
      instructions: options.system,
      max_output_tokens: options.maxTokens ?? OPENAI_MAX_TOKENS,
      input: toResponsesInput(options.messages),
      reasoning: { effort: "minimal" },
      text: {
        format: { type: "json_object" },
        verbosity: "low",
      },
    });
  } catch (error) {
    if (shouldFallbackModel(error, model)) {
      console.warn(`[openai] Model ${model} unavailable; retrying with ${OPENAI_FALLBACK_MODEL}.`);
      return await openai.responses.create({
        model: OPENAI_FALLBACK_MODEL,
        instructions: options.system,
        max_output_tokens: options.maxTokens ?? OPENAI_MAX_TOKENS,
        input: toResponsesInput(options.messages),
        reasoning: { effort: "minimal" },
        text: {
          format: { type: "json_object" },
          verbosity: "low",
        },
      });
    }

    throw error;
  }
}

/** Creates a streaming response, falling back when the preferred model is unavailable. */
async function createStreamWithFallback(model: string, options: ClaudeClientOptions) {
  try {
    return await openai.responses.create({
      model,
      instructions: options.system,
      max_output_tokens: options.maxTokens ?? OPENAI_MAX_TOKENS,
      input: toResponsesInput(options.messages),
      reasoning: { effort: "minimal" },
      text: { verbosity: "medium" },
      stream: true,
    });
  } catch (error) {
    if (shouldFallbackModel(error, model)) {
      console.warn(`[openai] Model ${model} unavailable; retrying stream with ${OPENAI_FALLBACK_MODEL}.`);
      return await openai.responses.create({
        model: OPENAI_FALLBACK_MODEL,
        instructions: options.system,
        max_output_tokens: options.maxTokens ?? OPENAI_MAX_TOKENS,
        input: toResponsesInput(options.messages),
        reasoning: { effort: "minimal" },
        text: { verbosity: "medium" },
        stream: true,
      });
    }

    throw error;
  }
}

/** Detects model-access failures that should retry on the fallback model. */
function shouldFallbackModel(error: unknown, attemptedModel: string): boolean {
  if (attemptedModel === OPENAI_FALLBACK_MODEL) {
    return false;
  }

  const message = getErrorMessage(error).toLowerCase();
  return message.includes("model_not_found") ||
    message.includes("must be verified") ||
    message.includes("verified to use the model") ||
    message.includes("does not exist") ||
    message.includes("do not have access");
}

/** Converts the app's chat-style messages to Responses API input. */
function toResponsesInput(messages: ClaudeClientOptions["messages"]): ResponseInput {
  return messages.map((message) => ({
    role: message.role,
    content: Array.isArray(message.content) ? message.content.map(toResponsesContentBlock) : message.content,
  }));
}

/** Converts legacy chat multimodal content blocks to Responses API content blocks. */
function toResponsesContentBlock(block: unknown): ResponseInputContent {
  const record = getRecord(block);

  if (record.type === "text" && typeof record.text === "string") {
    return { type: "input_text", text: record.text };
  }

  const imageUrl = getRecord(record.image_url);
  if (record.type === "image_url" && typeof imageUrl.url === "string") {
    return { type: "input_image", image_url: imageUrl.url, detail: "high" };
  }

  return { type: "input_text", text: "" };
}

/** Narrows unknown JSON-like values without trusting their shape. */
function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

/** Extracts the useful part of OpenAI SDK errors for local API responses. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Unknown OpenAI error";
}
