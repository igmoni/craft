import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeProjectName,
  validateConfig,
  validateExistingConfig,
  validateProjectName,
} from "../dist/core/engine/validate.js";
import type { GeneratorOptions } from "../dist/core/types/config.js";

describe("Configuration & Validation", () => {
  describe("validateProjectName", () => {
    it("should accept valid project names", () => {
      assert.equal(validateProjectName("my-app"), true);
      assert.equal(validateProjectName("app_123"), true);
      assert.equal(validateProjectName("craft-v2"), true);
      assert.equal(validateProjectName("."), true);
    });

    it("should reject empty names", () => {
      assert.notEqual(validateProjectName(""), true);
      assert.notEqual(validateProjectName("   "), true);
    });

    it("should reject special characters", () => {
      assert.notEqual(validateProjectName("my/app"), true);
      assert.notEqual(validateProjectName("my@app"), true);
      assert.notEqual(validateProjectName("my app"), true);
    });
  });

  describe("normalizeProjectName", () => {
    it("should preserve '.' and trim names", () => {
      assert.equal(normalizeProjectName("."), ".");
      assert.equal(normalizeProjectName("  my-app  "), "my-app");
    });
  });

  describe("validateExistingConfig", () => {
    it("should reject JavaScript on Angular", () => {
      assert.throws(
        () => validateExistingConfig({ typeScript: false }, "angular"),
        /does not support JavaScript/
      );
    });

    it("should allow TypeScript on Angular", () => {
      assert.doesNotThrow(() =>
        validateExistingConfig({ typeScript: true }, "angular")
      );
    });

    it("should reject database on Angular", () => {
      assert.throws(
        () => validateExistingConfig({ database: "postgres" }, "angular"),
        /does not support Craft database integration/
      );
    });

    it("should reject database on React", () => {
      assert.throws(
        () => validateExistingConfig({ database: "mongodb" }, "react"),
        /does not support Craft database integration/
      );
    });

    it("should reject shadcn on Express", () => {
      assert.throws(
        () => validateExistingConfig({ uiLibrary: "shadcn" }, "express"),
        /shadcn\/ui is not supported/
      );
    });

    it("should allow shadcn on React and Next", () => {
      assert.doesNotThrow(() =>
        validateExistingConfig({ uiLibrary: "shadcn" }, "react")
      );
      assert.doesNotThrow(() =>
        validateExistingConfig({ uiLibrary: "shadcn" }, "next")
      );
    });

    it("should reject unsupported auth providers", () => {
      assert.throws(
        () => validateExistingConfig({ auth: "authjs" }, "express"),
        /authjs authentication is not supported for Express/
      );
      assert.throws(
        () => validateExistingConfig({ auth: "better-auth" }, "vue"),
        /better-auth authentication is not supported for Vue/
      );
    });

    it("should allow supported auth providers", () => {
      assert.doesNotThrow(() =>
        validateExistingConfig({ auth: "better-auth" }, "next")
      );
      assert.doesNotThrow(() =>
        validateExistingConfig({ auth: "authjs" }, "next")
      );
      assert.doesNotThrow(() =>
        validateExistingConfig({ auth: "clerk" }, "react")
      );
      assert.doesNotThrow(() =>
        validateExistingConfig({ auth: "better-auth" }, "express")
      );
    });

    it("should reject Bun for NestJS", () => {
      assert.throws(
        () => validateExistingConfig({ packageManager: "bun" }, "nestjs"),
        /Unsupported package manager "bun" for NestJS/
      );
    });

    it("should reject Tailwind CSS for backend frameworks", () => {
      assert.throws(
        () => validateExistingConfig({ tailwind: true }, "express"),
        /Tailwind CSS is not supported for Express/
      );
      assert.throws(
        () => validateExistingConfig({ tailwind: true }, "nestjs"),
        /Tailwind CSS is not supported for NestJS/
      );
    });

    it("should reject shadcn when Tailwind is disabled", () => {
      assert.throws(
        () =>
          validateExistingConfig(
            { uiLibrary: "shadcn", tailwind: false },
            "next"
          ),
        /shadcn\/ui requires Tailwind CSS/
      );
    });

    it("should reject unsupported tools", () => {
      assert.throws(
        () => validateExistingConfig({ tools: ["webpack" as any] }, "next"),
        /Tool "webpack" is not supported/
      );
    });
  });

  describe("validateConfig", () => {
    const validConfig: GeneratorOptions = {
      projectName: "valid-app",
      framework: "next",
      typeScript: true,
      database: "postgres",
      auth: "better-auth",
      uiLibrary: "shadcn",
      tools: ["eslint", "prettier"],
      packageManager: "npm",
    };

    it("should accept valid fullstack config", () => {
      assert.doesNotThrow(() => validateConfig(validConfig));
    });

    it("should reject invalid package manager", () => {
      assert.throws(
        () =>
          validateConfig({
            ...validConfig,
            packageManager: "cargo" as any,
          }),
        /Unsupported package manager/
      );
    });

    it("should reject Bun on NestJS in full config", () => {
      assert.throws(
        () =>
          validateConfig({
            ...validConfig,
            framework: "nestjs",
            uiLibrary: false,
            auth: false,
            packageManager: "bun",
          }),
        /Unsupported package manager "bun" for NestJS/
      );
    });

    it("should reject shadcn when tailwind is false in full config", () => {
      assert.throws(
        () =>
          validateConfig({
            ...validConfig,
            tailwind: false,
            uiLibrary: "shadcn",
          }),
        /shadcn\/ui requires Tailwind CSS/
      );
    });

    it("should reject invalid framework", () => {
      assert.throws(
        () =>
          validateConfig({
            ...validConfig,
            framework: "django" as any,
          }),
        /Unsupported framework/
      );
    });
  });
});
