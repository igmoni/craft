import type { GeneratorOptions } from "../../dist/core/types/config.js";
import type { FrameworkType } from "../../dist/core/types/framework.js";

export type CheckStatus = "passed" | "failed" | "skipped";

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message?: string;
  durationMs?: number;
}

export interface FrameworkPackageExpectations {
  requiredDependencies?: string[];
  requiredDevDependencies?: string[];
  requiredScripts?: string[];
  validateFields?: (pkg: Record<string, unknown>) => string | true;
}

export interface FrameworkIntegrationExpectations {
  prisma?: boolean;
  tailwind?: boolean;
  shadcn?: boolean;
  eslint?: boolean;
  prettier?: boolean;
  husky?: boolean;
  commitlint?: boolean;
  git?: boolean;
}

export interface FrameworkBuildExpectations {
  command?: string;
  args?: string[];
  preBuildCommands?: { command: string; args: string[] }[];
  timeoutMs?: number;
  skip?: boolean;
  reason?: string;
}

export interface FrameworkExpectations {
  files: string[];
  directories?: string[];
  packageJson: FrameworkPackageExpectations;
  integrations: FrameworkIntegrationExpectations;
  build: FrameworkBuildExpectations;
}

export interface FrameworkTestTarget {
  id: string;
  framework: FrameworkType;
  name: string;
  description: string;
  config: GeneratorOptions;
  expectations: FrameworkExpectations;
}

export interface FrameworkTestResult {
  targetId: string;
  framework: FrameworkType;
  title: string;
  generation: CheckResult;
  directoryValidation: CheckResult;
  integrationValidation: Record<string, CheckResult>;
  buildValidation: CheckResult;
  overallStatus: "passed" | "failed";
  failureReason?: string;
  durationMs: number;
  logs: string[];
}

export interface TestSuiteSummary {
  results: FrameworkTestResult[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export interface RunnerCliOptions {
  frameworks?: FrameworkType[];
  skipBuild?: boolean;
  withIntegrations?: boolean;
  keepTemp?: boolean;
  verbose?: boolean;
}
