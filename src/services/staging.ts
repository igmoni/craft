import { constants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type Entry = {
  relativePath: string;
  isDirectory: boolean;
};

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export async function createStagingDirectory(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "craft-staging-"));
}

async function listEntries(root: string, current = root): Promise<Entry[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const result: Entry[] = [];

  for (const entry of entries) {
    // Never copy or scan node_modules or .git during staging merge
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }

    const absolute = path.join(current, entry.name);
    const relativePath = path.relative(root, absolute);

    if (entry.isDirectory()) {
      result.push({ relativePath, isDirectory: true });
      result.push(...(await listEntries(root, absolute)));
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      result.push({ relativePath, isDirectory: false });
    }
  }

  return result;
}

async function inspect(
  target: string
): Promise<{ exists: boolean; isDirectory: boolean }> {
  try {
    const stat = await fs.lstat(target);

    return {
      exists: true,
      isDirectory: stat.isDirectory() && !stat.isSymbolicLink(),
    };
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return { exists: false, isDirectory: false };
    }

    throw error;
  }
}

export async function mergeStagedFiles(
  stagingDir: string,
  targetDir: string,
  allowExisting = false
): Promise<void> {
  const entries = await listEntries(stagingDir);
  const targetInfo = await inspect(targetDir);

  if (targetInfo.exists && !targetInfo.isDirectory) {
    throw new Error(`Target is not a directory: ${targetDir}`);
  }

  // Check destination before copying if allowExisting is false
  if (!allowExisting) {
    for (const entry of entries) {
      const destination = path.join(targetDir, entry.relativePath);
      const info = await inspect(destination);

      if (!info.exists) continue;
      if (entry.isDirectory && info.isDirectory) continue;

      throw new Error(`File conflict: ${entry.relativePath}`);
    }
  }

  const createdDirectories: string[] = [];
  const createdFiles: string[] = [];

  try {
    if (!targetInfo.exists) {
      await fs.mkdir(targetDir, { recursive: true });
      createdDirectories.push(targetDir);
    }

    for (const entry of entries.filter((item) => item.isDirectory)) {
      const destination = path.join(targetDir, entry.relativePath);
      const info = await inspect(destination);

      if (!info.exists) {
        await fs.mkdir(destination, { recursive: true });
        createdDirectories.push(destination);
      } else if (!info.isDirectory) {
        throw new Error(`Directory conflict: ${entry.relativePath}`);
      }
    }

    for (const entry of entries.filter((item) => !item.isDirectory)) {
      const source = path.join(stagingDir, entry.relativePath);
      const destination = path.join(targetDir, entry.relativePath);

      const parentDir = path.dirname(destination);
      const parentInfo = await inspect(parentDir);

      if (!parentInfo.exists) {
        await fs.mkdir(parentDir, { recursive: true });
        createdDirectories.push(parentDir);
      } else if (!parentInfo.isDirectory) {
        throw new Error(`Directory conflict: ${parentDir}`);
      }

      await fs.copyFile(source, destination);
      createdFiles.push(destination);
    }
  } catch (error: unknown) {
    // Roll back files and directories created by this merge if it failed
    for (const file of createdFiles.reverse()) {
      await fs.rm(file, { force: true }).catch(() => {});
    }

    for (const directory of createdDirectories.reverse()) {
      await fs.rmdir(directory).catch(() => {});
    }

    throw error;
  }
}
