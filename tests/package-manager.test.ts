import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getCreateCommand,
  getDlxCommand,
  getInstallCommand,
  getRunScriptCommand,
  isPackageManagerInstalled,
} from "../dist/services/packageManager.js";

describe("Package Manager Service", () => {
  describe("getInstallCommand", () => {
    it("should return correct install commands for all package managers", () => {
      assert.deepEqual(getInstallCommand("npm"), {
        command: "npm",
        args: ["install"],
      });
      assert.deepEqual(getInstallCommand("pnpm"), {
        command: "pnpm",
        args: ["install"],
      });
      assert.deepEqual(getInstallCommand("yarn"), {
        command: "yarn",
        args: ["install"],
      });
      assert.deepEqual(getInstallCommand("bun"), {
        command: "bun",
        args: ["install"],
      });
    });
  });

  describe("getDlxCommand", () => {
    it("should format npx for npm", () => {
      const res = getDlxCommand("npm", "create-next-app@latest", ["my-app"]);
      assert.equal(res.command, "npx");
      assert.deepEqual(res.args, ["--yes", "create-next-app@latest", "my-app"]);
    });

    it("should format pnpm dlx", () => {
      const res = getDlxCommand("pnpm", "shadcn@latest", ["init"]);
      assert.equal(res.command, "pnpm");
      assert.deepEqual(res.args, ["dlx", "shadcn@latest", "init"]);
    });

    it("should format yarn dlx", () => {
      const res = getDlxCommand("yarn", "create-vite", ["app"]);
      assert.equal(res.command, "yarn");
      assert.deepEqual(res.args, ["dlx", "create-vite", "app"]);
    });

    it("should format bunx for bun", () => {
      const res = getDlxCommand("bun", "shadcn@latest", ["init"]);
      assert.equal(res.command, "bunx");
      assert.deepEqual(res.args, ["shadcn@latest", "init"]);
    });
  });

  describe("getRunScriptCommand", () => {
    it("should include -- separator for npm when arguments are provided", () => {
      assert.equal(
        getRunScriptCommand("npm", "lint", ["--fix"]),
        "npm run lint -- --fix"
      );
      assert.equal(getRunScriptCommand("npm", "dev"), "npm run dev");
    });

    it("should format direct script execution for pnpm, yarn, bun", () => {
      assert.equal(
        getRunScriptCommand("pnpm", "lint", ["--fix"]),
        "pnpm run lint --fix"
      );
      assert.equal(
        getRunScriptCommand("yarn", "lint", ["--fix"]),
        "yarn run lint --fix"
      );
      assert.equal(
        getRunScriptCommand("bun", "lint", ["--fix"]),
        "bun run lint --fix"
      );
    });
  });

  describe("getCreateCommand", () => {
    it("should format npm create with -- separator", () => {
      const res = getCreateCommand("npm", "vite@latest", "my-app", [
        "--template",
        "react-ts",
      ]);
      assert.equal(res.command, "npm");
      assert.deepEqual(res.args, [
        "create",
        "vite@latest",
        "my-app",
        "--",
        "--template",
        "react-ts",
      ]);
    });

    it("should format pnpm create without -- separator", () => {
      const res = getCreateCommand("pnpm", "vite@latest", "my-app", [
        "--template",
        "react-ts",
      ]);
      assert.equal(res.command, "pnpm");
      assert.deepEqual(res.args, [
        "create",
        "vite@latest",
        "my-app",
        "--template",
        "react-ts",
      ]);
    });
  });

  describe("isPackageManagerInstalled", () => {
    it("should detect that npm is installed", async () => {
      const installed = await isPackageManagerInstalled("npm");
      assert.equal(installed, true);
    });

    it("should return false for nonexistent tool", async () => {
      const installed = await isPackageManagerInstalled(
        "nonexistent-tool-xyz" as any
      );
      assert.equal(installed, false);
    });
  });
});
