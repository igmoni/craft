import { Command } from "commander";
import type { PartialProjectConfig, ToolType } from "../../core/types/config.js";
export declare const parseTools: (value: string) => ToolType[];
export declare const getProvidedOptions: (command: Command) => PartialProjectConfig;
export declare const registerInitCommand: (program: Command) => void;
