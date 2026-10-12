import { execa } from "execa";

export async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  try {
    await execa(command, args, {
      cwd,
      stdio: "inherit",
      windowsHide: true,
      reject: true,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(
        `Command failed: ${command} ${args.join(" ")}\n${error.message}`,
        { cause: error }
      );
    }

    throw new Error(`Command failed: ${command} ${args.join(" ")}`, {
      cause: error,
    });
  }
}
