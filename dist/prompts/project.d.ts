import type { configType } from "../types/utils.js";
export declare const promptProjectConfig: (existing?: configType) => Promise<{
    projectName: string;
    framework: import("../types/utils.js").FrameworkType;
    typeScript: boolean;
    database: import("../types/utils.js").DatabaseType;
    auth: boolean;
    tools: import("../types/utils.js").ToolType[];
}>;
