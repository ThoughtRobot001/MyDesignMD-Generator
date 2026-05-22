import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import type { ApiResponse, ValidateRequest } from "../../../lib/types/api";
import type { LintIssue, LintResult } from "../../../lib/types/design-md";

const execAsync = promisify(exec);

/** Handles DESIGN.md validation using the official CLI linter. */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<LintResult>>> {
  const tmpFile = path.join(os.tmpdir(), `design-${Date.now()}.md`);

  try {
    const body = (await request.json()) as Partial<ValidateRequest>;

    if (typeof body.content !== "string" || body.content.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request: content is required." }, { status: 400 });
    }

    await fs.writeFile(tmpFile, body.content, "utf-8");
    const result = await runLint(tmpFile);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Unexpected validation route error." }, { status: 500 });
  } finally {
    await fs.unlink(tmpFile).catch(() => undefined);
  }
}

/** Runs the DESIGN.md linter and maps output to the lint result type. */
async function runLint(tmpFile: string): Promise<LintResult> {
  try {
    const { stdout } = await execAsync(`npx @google/design.md lint --format json "${tmpFile}"`);

    return parseLintOutput(stdout, true);
  } catch (error) {
    const output = getExecOutput(error);

    return parseLintOutput(output, false);
  }
}

/** Parses linter JSON output into the normalized lint result shape. */
function parseLintOutput(output: string, passed: boolean): LintResult {
  try {
    const parsed = JSON.parse(output) as { issues?: Array<Partial<LintIssue>> };
    const normalized = (Array.isArray(parsed.issues) ? parsed.issues : []).map(normalizeIssue);

    return {
      passed,
      errors: normalized.filter((issue) => issue.severity === "error"),
      warnings: normalized.filter((issue) => issue.severity === "warning"),
    };
  } catch {
    return {
      passed: false,
      errors: [],
      warnings: [{ rule: "lint-output", message: "Linter output could not be parsed", severity: "warning" }],
    };
  }
}

/** Normalizes a partial lint issue into the public lint issue type. */
function normalizeIssue(issue: Partial<LintIssue>): LintIssue {
  return {
    rule: issue.rule ?? "unknown",
    message: issue.message ?? "Unknown lint issue",
    severity: issue.severity === "error" ? "error" : "warning",
  };
}

/** Extracts stdout or stderr from an exec failure. */
function getExecOutput(error: unknown): string {
  return (error as { stdout?: string; stderr?: string }).stdout ?? (error as { stderr?: string }).stderr ?? "";
}
