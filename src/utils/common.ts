export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error;
  }


  // const runCommand = (
  //   command: string,
  //   args: string[],
  //   options: SpawnOptions = {}
  // ): Promise<void> => {