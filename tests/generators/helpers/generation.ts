import path from "node:path";

import { generateProject } from "../../../dist/core/engine/generate.js";
import type { GeneratorOptions } from "../../../dist/core/types/config.js";

export interface GenerationResult {
  projectDir: string;
  durationMs: number;
  error?: Error;
}

/**
 * Executes the Craft generation pipeline inside an isolated workspace.
 * Reuses the existing generateProject engine without modifying production behavior.
 */
export async function runProjectGeneration(
  config: GeneratorOptions,
  workspaceDir: string
): Promise<GenerationResult> {
  const originalCwd = process.cwd();
  const startTime = Date.now();
  const projectDir = path.join(workspaceDir, config.projectName);

  try {
    process.chdir(workspaceDir);
    await generateProject(config);
    return {
      projectDir,
      durationMs: Date.now() - startTime,
    };
  } catch (error: unknown) {
    return {
      projectDir,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  } finally {
    try {
      process.chdir(originalCwd);
    } catch {
      // Best-effort cwd restoration
    }
  }
}
