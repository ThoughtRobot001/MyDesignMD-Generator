"use client";

import { useCallback, useState } from "react";
import { GENERATION_STEPS } from "../components/shared/ProgressTracker";
import type { GenerateRequest } from "../lib/types/api";
import type { DesignMdDocument } from "../lib/types/design-md";
import type { DesignTokens } from "../lib/types/design-tokens";

const GENERATE_TIMEOUT_MS = 600_000;
const TOKEN_ENVELOPE_PREFIX = "<!--DESIGNMD_TOKENS:";

export interface UseGenerateReturn {
  generate: (request: GenerateRequest) => Promise<void>;
  document: DesignMdDocument | null;
  tokens: DesignTokens | null;
  currentStep: number;
  isLoading: boolean;
  isComplete: boolean;
  hasError: boolean;
  errorMessage: string | null;
  reset: () => void;
}

/** Manages the full DESIGN.md generation and validation lifecycle. */
export default function useGenerate(): UseGenerateReturn {
  const [document, setDocument] = useState<DesignMdDocument | null>(null);
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback((): void => {
    setDocument(null);
    setTokens(null);
    setCurrentStep(0);
    setIsLoading(false);
    setIsComplete(false);
    setHasError(false);
    setErrorMessage(null);
  }, []);

  const generate = useCallback(async (request: GenerateRequest): Promise<void> => {
    try {
      reset();
      setIsLoading(true);
      setCurrentStep(GENERATION_STEPS[0].id);
      setCurrentStep(GENERATION_STEPS[1].id);
      setCurrentStep(GENERATION_STEPS[2].id);

      const result = await postStreamingMarkdownWithTimeout("/api/generate", request, GENERATE_TIMEOUT_MS, (nextRaw, nextTokens) => {
        setTokens(nextTokens);
        setDocument((prev) => prev ? { ...prev, raw: nextRaw } : buildStreamingDocument(nextRaw));
      });

      setTokens(result.tokens);
      setDocument((prev) => prev ? { ...prev, raw: result.raw } : buildStreamingDocument(result.raw));
      setCurrentStep(GENERATION_STEPS[4].id);
      setIsComplete(true);
      setIsLoading(false);
    } catch (error) {
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : "Generation failed unexpectedly.");
      setIsLoading(false);
    }
  }, [reset]);

  return { generate, document, tokens, currentStep, isLoading, isComplete, hasError, errorMessage, reset };
}

/** Posts JSON and streams the markdown response into local state. */
async function postStreamingMarkdownWithTimeout(
  url: string,
  body: unknown,
  timeoutMs: number,
  onChunk: (raw: string, tokens: DesignTokens | null) => void,
): Promise<{ raw: string; tokens: DesignTokens | null }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text.trim() || `Request failed with HTTP ${response.status}.`);
    }

    if (!response.body) {
      throw new Error("The server did not return a readable stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let payload = "";
    let raw = "";
    let tokens: DesignTokens | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      payload += chunk;
      const parsed = parseStreamPayload(payload, tokens);
      raw = parsed.raw;
      tokens = parsed.tokens;
      onChunk(raw, tokens);
    }

    payload += decoder.decode();
    const parsed = parseStreamPayload(payload, tokens);
    raw = parsed.raw;
    tokens = parsed.tokens;

    if (raw.startsWith("Generation failed:")) {
      throw new Error(raw.replace(/^Generation failed:\s*/, ""));
    }

    return { raw, tokens };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation timed out after 10 minutes. Try again with a smaller input or check the server logs.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Removes the hidden token envelope from the stream and returns tokens separately. */
function parseStreamPayload(payload: string, existingTokens: DesignTokens | null): { raw: string; tokens: DesignTokens | null } {
  if (!payload.startsWith(TOKEN_ENVELOPE_PREFIX)) {
    return { raw: payload, tokens: existingTokens };
  }

  const envelopeEnd = payload.indexOf("-->\n");
  if (envelopeEnd === -1) {
    return { raw: "", tokens: existingTokens };
  }

  const encoded = payload.slice(TOKEN_ENVELOPE_PREFIX.length, envelopeEnd);
  return {
    raw: payload.slice(envelopeEnd + "-->\n".length),
    tokens: existingTokens ?? parseTokenEnvelope(encoded),
  };
}

/** Decodes the DESIGN.md token envelope sent before streamed markdown. */
function parseTokenEnvelope(encoded: string): DesignTokens | null {
  try {
    return JSON.parse(decodeURIComponent(encoded)) as DesignTokens;
  } catch {
    return null;
  }
}

/** Creates a minimal document shell while raw markdown is streaming. */
function buildStreamingDocument(raw: string): DesignMdDocument {
  const section = (title: string) => ({ title, yaml: null, prose: "" });

  return {
    name: "streaming-design",
    version: "1.0.0",
    sections: {
      overview: section("Overview"),
      colors: section("Colors"),
      typography: section("Typography"),
      spacing: section("Spacing"),
      shapes: section("Shapes"),
      elevation: section("Elevation & Depth"),
      layout: section("Layout"),
      components: section("Components"),
      motion: section("Motion"),
      guidelines: section("Do's and Don'ts"),
      responsive: section("Responsive Behavior"),
      iteration: section("Iteration Guide"),
    },
    raw,
    isValid: false,
    lintResult: null,
  };
}
