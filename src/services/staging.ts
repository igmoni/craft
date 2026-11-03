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

export async function resolveStagingProjectDirectory(
  stagingRoot: string,
  expectedProjectName: string
): Promise<string> {
  const candidate = path.join(stagingRoot, expectedProjectName);
  const candidateInfo = await inspect(candidate);

  if (candidateInfo.exists && candidateInfo.isDirectory) {
    const candidateEntries = await fs.readdir(candidate);
    if (candidateEntries.length > 0) {
      // Check for nested directory: candidate/expectedProjectName
      const nested = path.join(candidate, expectedProjectName);
      const nestedInfo = await inspect(nested);
      if (nestedInfo.exists && nestedInfo.isDirectory) {
        const hasPackageJsonAtCandidate = await inspect(
          path.join(candidate, "package.json")
        );
        const hasPackageJsonAtNested = await inspect(
          path.join(nested, "package.json")
        );
        if (
          !hasPackageJsonAtCandidate.exists &&
          hasPackageJsonAtNested.exists
        ) {
          return nested;
        }
      }
      return candidate;
    }
  }

  // Check if stagingRoot has package.json directly
  const rootPackageJson = await inspect(path.join(stagingRoot, "package.json"));
  if (rootPackageJson.exists) {
    return stagingRoot;
  }

  // Look for any subdirectory in stagingRoot that has package.json or files
  const rootEntries = await fs.readdir(stagingRoot, { withFileTypes: true });
  const subDirs = rootEntries.filter(
    (e) => e.isDirectory() && e.name !== "node_modules" && e.name !== ".git"
  );

  for (const dir of subDirs) {
    const subDirPath = path.join(stagingRoot, dir.name);
    const pkgJson = await inspect(path.join(subDirPath, "package.json"));
    if (pkgJson.exists) {
      return subDirPath;
    }
  }

  if (subDirs.length === 1) {
    const subDirPath = path.join(stagingRoot, subDirs[0].name);
    const subEntries = await fs.readdir(subDirPath);
    if (subEntries.length > 0) {
      return subDirPath;
    }
  }

  throw new Error(
    `No files were generated in staging directory (${stagingRoot}). Generator produced no output.`
  );
}

export async function mergeStagedFiles(
  stagingDir: string,
  targetDir: string,
  allowExisting = false
): Promise<void> {
  const entries = await listEntries(stagingDir);

  if (entries.length === 0) {
    throw new Error(
      `Staging directory "${stagingDir}" is empty. Generator produced no files.`
    );
  }

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

      const destInfo = await inspect(destination);
      if (destInfo.exists) {
        if (destInfo.isDirectory) {
          throw new Error(`Directory conflict: ${destination}`);
        }
        // Preserve existing user file when allowExisting is true
        continue;
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
