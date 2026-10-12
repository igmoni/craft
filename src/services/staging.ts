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
    const absolute = path.join(current, entry.name);
    const relativePath = path.relative(root, absolute);

    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported: ${relativePath}`);
    }

    if (entry.isDirectory()) {
      result.push({ relativePath, isDirectory: true });
      result.push(...(await listEntries(root, absolute)));
    } else if (entry.isFile()) {
      result.push({ relativePath, isDirectory: false });
    } else {
      throw new Error(`Unsupported filesystem entry: ${relativePath}`);
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
  targetDir: string
): Promise<void> {
  const entries = await listEntries(stagingDir);
  const targetInfo = await inspect(targetDir);

  if (targetInfo.exists && !targetInfo.isDirectory) {
    throw new Error(`Target is not a directory: ${targetDir}`);
  }

  // Check every destination before copying any files.
  for (const entry of entries) {
    const destination = path.join(targetDir, entry.relativePath);
    const info = await inspect(destination);

    if (!info.exists) continue;

    if (entry.isDirectory && info.isDirectory) continue;

    throw new Error(`File conflict: ${entry.relativePath}`);
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
        await fs.mkdir(destination);
        createdDirectories.push(destination);
      } else if (!info.isDirectory) {
        throw new Error(`Directory conflict: ${entry.relativePath}`);
      }
    }

    for (const entry of entries.filter((item) => !item.isDirectory)) {
      const source = path.join(stagingDir, entry.relativePath);
      const destination = path.join(targetDir, entry.relativePath);

      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination, constants.COPYFILE_EXCL);
      createdFiles.push(destination);
    }
  } catch (error: unknown) {
    // Roll back only files and directories created by this merge.
    for (const file of createdFiles.reverse()) {
      await fs.rm(file, { force: true }).catch(() => {});
    }

    for (const directory of createdDirectories.reverse()) {
      await fs.rmdir(directory).catch(() => {});
    }

    throw error;
  }
}
