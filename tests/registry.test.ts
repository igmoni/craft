import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  frameworks,
  getCategories,
  getFramework,
  getFrameworkChoices,
  getFrameworksByCategory,
  isFrameworkSupported,
} from "../dist/core/registry/framework.js";
import type { FrameworkType } from "../dist/core/types/framework.js";

describe("Framework Registry", () => {
  const expectedFrameworks: FrameworkType[] = [
    "angular",
    "vue",
    "react",
    "nestjs",
    "express",
    "fastify",
    "hono",
    "next",
  ];

  it("should contain all 8 required frameworks", () => {
    for (const fw of expectedFrameworks) {
      assert.ok(
        isFrameworkSupported(fw),
        `Framework ${fw} should be supported`
      );
      const def = getFramework(fw);
      assert.equal(def.id, fw);
      assert.ok(def.name);
      assert.ok(def.category);
    }
  });

  it("should enforce Angular capability constraints", () => {
    const angular = getFramework("angular");
    assert.equal(angular.category, "frontend");
    assert.equal(angular.capabilities.typescript, true);
    assert.equal(
      angular.capabilities.javascript,
      false,
      "Angular does not support JS"
    );
    assert.equal(
      angular.capabilities.database,
      false,
      "Angular does not support DB"
    );
    assert.equal(angular.capabilities.authProviders.length, 0);
    assert.equal(angular.capabilities.tailwind, true);
    assert.equal(angular.capabilities.shadcn, false);
  });

  it("should enforce Vue capability constraints", () => {
    const vue = getFramework("vue");
    assert.equal(vue.category, "frontend");
    assert.equal(vue.capabilities.typescript, true);
    assert.equal(vue.capabilities.javascript, true);
    assert.equal(vue.capabilities.database, false);
    assert.equal(vue.capabilities.authProviders.length, 0);
    assert.equal(vue.capabilities.tailwind, true);
    assert.equal(vue.capabilities.shadcn, false);
  });

  it("should enforce React (Vite) capability constraints", () => {
    const react = getFramework("react");
    assert.equal(react.category, "frontend");
    assert.equal(react.capabilities.typescript, true);
    assert.equal(react.capabilities.javascript, true);
    assert.equal(react.capabilities.database, false);
    assert.deepEqual(react.capabilities.authProviders, [
      "better-auth",
      "clerk",
    ]);
    assert.equal(react.capabilities.tailwind, true);
    assert.equal(react.capabilities.shadcn, true);
  });

  it("should enforce Backend frameworks capability constraints", () => {
    const backendFws: FrameworkType[] = [
      "nestjs",
      "express",
      "fastify",
      "hono",
    ];
    for (const id of backendFws) {
      const fw = getFramework(id);
      assert.equal(fw.category, "backend");
      assert.equal(
        fw.capabilities.database,
        true,
        `${id} should support database`
      );
      assert.equal(
        fw.capabilities.tailwind,
        false,
        `${id} should not support tailwind`
      );
      assert.equal(
        fw.capabilities.shadcn,
        false,
        `${id} should not support shadcn`
      );
    }

    // Express supports better-auth and clerk
    assert.deepEqual(getFramework("express").capabilities.authProviders, [
      "better-auth",
      "clerk",
    ]);

    // NestJS, Fastify, Hono do not support auth in Craft V2
    assert.deepEqual(getFramework("nestjs").capabilities.authProviders, []);
    assert.deepEqual(getFramework("fastify").capabilities.authProviders, []);
    assert.deepEqual(getFramework("hono").capabilities.authProviders, []);

    // NestJS does not support Bun in official CLI
    assert.deepEqual(getFramework("nestjs").capabilities.packageManagers, [
      "npm",
      "pnpm",
      "yarn",
    ]);
  });

  it("should declare centralized databases, styling, tools, and packageManagers", () => {
    for (const fw of expectedFrameworks) {
      const def = getFramework(fw);
      assert.ok(Array.isArray(def.capabilities.databases));
      assert.ok(Array.isArray(def.capabilities.styling));
      assert.ok(Array.isArray(def.capabilities.packageManagers));
      assert.ok(Array.isArray(def.capabilities.tools));
    }

    // Angular has prettier, husky, commitlint (ESLint is configured via angular-eslint if desired)
    assert.deepEqual(getFramework("angular").capabilities.tools, [
      "prettier",
      "husky",
      "commitlint",
    ]);

    // Other 7 frameworks include eslint
    for (const fw of expectedFrameworks.filter((f) => f !== "angular")) {
      assert.deepEqual(getFramework(fw).capabilities.tools, [
        "eslint",
        "prettier",
        "husky",
        "commitlint",
      ]);
    }

    // Frontend databases must be empty
    assert.deepEqual(getFramework("angular").capabilities.databases, []);
    assert.deepEqual(getFramework("vue").capabilities.databases, []);
    assert.deepEqual(getFramework("react").capabilities.databases, []);

    // Backend styling must be empty
    assert.deepEqual(getFramework("nestjs").capabilities.styling, []);
    assert.deepEqual(getFramework("express").capabilities.styling, []);
    assert.deepEqual(getFramework("fastify").capabilities.styling, []);
    assert.deepEqual(getFramework("hono").capabilities.styling, []);
  });

  it("should enforce Next.js capability constraints", () => {
    const next = getFramework("next");
    assert.equal(next.category, "fullstack");
    assert.equal(next.capabilities.typescript, true);
    assert.equal(next.capabilities.javascript, true);
    assert.equal(next.capabilities.database, true);
    assert.equal(next.capabilities.tailwind, true);
    assert.equal(next.capabilities.shadcn, true);
    assert.deepEqual(next.capabilities.authProviders, [
      "better-auth",
      "authjs",
      "clerk",
    ]);
  });

  it("should filter frameworks by category correctly", () => {
    const frontend = getFrameworksByCategory("frontend");
    assert.deepEqual(
      frontend.map((f) => f.id).sort(),
      ["angular", "react", "vue"].sort()
    );

    const backend = getFrameworksByCategory("backend");
    assert.deepEqual(
      backend.map((f) => f.id).sort(),
      ["express", "fastify", "hono", "nestjs"].sort()
    );

    const fullstack = getFrameworksByCategory("fullstack");
    assert.deepEqual(
      fullstack.map((f) => f.id),
      ["next"]
    );
  });

  it("should return categories and framework choices", () => {
    const categories = getCategories();
    assert.equal(categories.length, 3);
    assert.ok(categories.some((c) => c.value === "frontend"));
    assert.ok(categories.some((c) => c.value === "backend"));
    assert.ok(categories.some((c) => c.value === "fullstack"));

    const frontendChoices = getFrameworkChoices("frontend");
    assert.equal(frontendChoices.length, 3);
  });
});
