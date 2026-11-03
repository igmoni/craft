export declare function createStagingDirectory(): Promise<string>;
export declare function resolveStagingProjectDirectory(stagingRoot: string, expectedProjectName: string): Promise<string>;
export declare function mergeStagedFiles(stagingDir: string, targetDir: string, allowExisting?: boolean): Promise<void>;
