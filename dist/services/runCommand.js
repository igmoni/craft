import { execa } from "execa";
export async function runCommand(command, args, cwd) {
    await execa(command, args, {
        cwd,
        stdio: "inherit",
        windowsHide: true,
    });
}
//# sourceMappingURL=runCommand.js.map