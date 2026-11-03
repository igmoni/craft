import pc from "picocolors";
let bannerDisplayed = false;
export const CRAFT_VERSION = "2.0.0";
export const CRAFT_TAGLINE = "Stop setting up. Start building.";
export function displayBanner() {
    if (bannerDisplayed)
        return;
    bannerDisplayed = true;
    const ascii = [
        "  ██████╗██████╗  █████╗ ███████╗████████╗",
        " ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝",
        " ██║     ██████╔╝███████║█████╗     ██║   ",
        " ██║     ██╔══██╗██╔══██║██╔══╝     ██║   ",
        " ╚██████╗██║  ██║██║  ██║██║        ██║   ",
        "  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   ",
    ];
    console.log("");
    for (const line of ascii) {
        console.log(pc.blue(pc.bold(line)));
    }
    console.log("");
    console.log(`  ${pc.bold(pc.white("CRAFT"))} ${pc.dim(`v${CRAFT_VERSION}`)}`);
    console.log(`  ${pc.cyan(CRAFT_TAGLINE)}`);
    console.log("");
}
export function resetBannerForTesting() {
    bannerDisplayed = false;
}
//# sourceMappingURL=banner.js.map