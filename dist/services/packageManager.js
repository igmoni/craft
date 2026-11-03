import { execa } from "execa";
export async function isPackageManagerInstalled(pm) {
    try {
        await execa(pm, ["--version"], {
            stdio: "ignore",
            windowsHide: true,
            shell: process.platform === "win32",
            reject: true,
        });
        return true;
    }
    catch {
        return false;
    }
}
export async function ensurePackageManagerInstalled(pm) {
    const installed = await isPackageManagerInstalled(pm);
    if (!installed) {
        throw new Error(`Package manager "${pm}" is not installed or not found in PATH.\n` +
            `Please install ${pm} first or choose an installed package manager (e.g. npm).`);
    }
}
export function getInstallCommand(pm) {
    switch (pm) {
        case "pnpm":
            return { command: "pnpm", args: ["install"] };
        case "yarn":
            return { command: "yarn", args: ["install"] };
        case "bun":
            return { command: "bun", args: ["install"] };
        case "npm":
        default:
            return { command: "npm", args: ["install"] };
    }
}
export function getRunScriptCommand(pm, script, args = []) {
    const forwarded = args.length === 0 ? "" : ` ${pm === "npm" ? "-- " : ""}${args.join(" ")}`;
    return `${pm} run ${script}${forwarded}`;
}
export function getDlxCommand(pm, pkg, args = []) {
    switch (pm) {
        case "pnpm":
            return {
                command: "pnpm",
                args: ["dlx", pkg, ...args],
            };
        case "yarn":
            return {
                command: "yarn",
                args: ["dlx", pkg, ...args],
            };
        case "bun":
            return {
                command: "bunx",
                args: [pkg, ...args],
            };
        case "npm":
        default:
            return {
                command: "npx",
                args: ["--yes", pkg, ...args],
            };
    }
}
export function getCreateCommand(pm, templatePkg, targetDirName, extraArgs = []) {
    switch (pm) {
        case "pnpm":
            return {
                command: "pnpm",
                args: ["create", templatePkg, targetDirName, ...extraArgs],
            };
        case "yarn":
            return {
                command: "yarn",
                args: ["create", templatePkg, targetDirName, ...extraArgs],
            };
        case "bun":
            return {
                command: "bun",
                args: ["create", templatePkg, targetDirName, ...extraArgs],
            };
        case "npm":
        default: {
            const npmArgs = ["create", templatePkg, targetDirName];
            if (extraArgs.length > 0) {
                npmArgs.push("--", ...extraArgs);
            }
            return {
                command: "npm",
                args: npmArgs,
            };
        }
    }
}
//# sourceMappingURL=packageManager.js.map