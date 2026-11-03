import { Command } from "commander";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getProvidedOptions, parseTools } from "../dist/cli/commands/init.js";

describe("CLI Option Parsing", () => {
  describe("parseTools", () => {
    it("should parse comma-separated tools", () => {
      const tools = parseTools("eslint,prettier");
      assert.deepEqual(tools, ["eslint", "prettier"]);
    });

    it("should parse space-separated tools", () => {
      const tools = parseTools("eslint prettier husky");
      assert.deepEqual(tools, ["eslint", "prettier", "husky"]);
    });

    it("should deduplicate tools and handle case-insensitivity", () => {
      const tools = parseTools("ESLint, prettier, eslint, PRETTIER");
      assert.deepEqual(tools, ["eslint", "prettier"]);
    });

    it("should throw error on unknown tool", () => {
      assert.throws(
        () => parseTools("eslint,webpack,prettier"),
        /Unknown tools: webpack/
      );
    });
  });

  describe("getProvidedOptions", () => {
    it("should extract CLI provided options accurately", () => {
      const cmd = new Command();
      cmd
        .option("-f, --framework <framework>")
        .option("-d, --database <database>")
        .option("--auth <provider>")
        .option("--shadcn")
        .option("-p, --package-manager <manager>");

      cmd.parse([
        "node",
        "craft",
        "--framework",
        "next",
        "--database",
        "postgres",
        "--auth",
        "better-auth",
        "--shadcn",
        "--package-manager",
        "pnpm",
      ]);

      const opts = getProvidedOptions(cmd);
      assert.equal(opts.framework, "next");
      assert.equal(opts.database, "postgres");
      assert.equal(opts.auth, "better-auth");
      assert.equal(opts.uiLibrary, "shadcn");
      assert.equal(opts.packageManager, "pnpm");
    });
  });
});
