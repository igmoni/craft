import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const activeWorkspaces = new Set<string>();
let exitHooksRegistered = false;

function registerExitHooks(): void {
  if (exitHooksRegistered) return;
  exitHooksRegistered = true;

  const cleanupAll = () => {
    for (const dir of activeWorkspaces) {
      try {
        // Sync cleanup on process exit
        import("node:fs").then((fsSync) => {
          try {
            fsSync.rmSync(dir, { recursive: true, force: true });
          } catch {
            // Ignore on hard process exit
          }
        });
      } catch {
        // Ignore errors during final shutdown
      }
    }
  };

  process.once("exit", cleanupAll);
  process.once("SIGINT", () => {
    cleanupAll();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    cleanupAll();
    process.exit(143);
  });
}

/**
 * Creates an isolated temporary directory for test execution.
 */
export async function createTempWorkspace(
  prefix = "craft-generator-test-"
): Promise<string> {
  registerExitHooks();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  activeWorkspaces.add(tempDir);
  return tempDir;
}

/**
 * Safely cleans up a temporary directory with retry for Windows file locks.
 */
export async function cleanupTempWorkspace(
  dirPath: string,
  retries = 3,
  delayMs = 250
): Promise<void> {
  activeWorkspaces.delete(dirPath);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      return;
    } catch (error: unknown) {
      if (attempt === retries) {
        // Log warning on final failure but do not throw to allow test suite completion
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `[Warning] Could not remove temporary test workspace (${dirPath}): ${message}`
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
