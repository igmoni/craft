import type { PackageManager } from "../core/types/config.js";
export interface PackageExecutionCommand {
    command: string;
    args: string[];
}
export declare function isPackageManagerInstalled(pm: PackageManager): Promise<boolean>;
export declare function ensurePackageManagerInstalled(pm: PackageManager): Promise<void>;
export declare function getInstallCommand(pm: PackageManager): PackageExecutionCommand;
export declare function getRunScriptCommand(pm: PackageManager, script: string, args?: string[]): string;
export declare function getDlxCommand(pm: PackageManager, pkg: string, args?: string[]): PackageExecutionCommand;
export declare function getCreateCommand(pm: PackageManager, templatePkg: string, targetDirName: string, extraArgs?: string[]): PackageExecutionCommand;
