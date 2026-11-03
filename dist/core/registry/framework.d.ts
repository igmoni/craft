import type { FrameworkCategory, FrameworkDefinition, FrameworkType } from "../types/framework.js";
export declare const frameworks: Record<FrameworkType, FrameworkDefinition>;
export declare const getFramework: (id: FrameworkType) => FrameworkDefinition;
export declare const isFrameworkSupported: (id: string) => id is FrameworkType;
export declare const getFrameworksByCategory: (category: FrameworkCategory) => FrameworkDefinition[];
export declare const getCategories: () => {
    name: string;
    value: FrameworkCategory;
    description: string;
}[];
export declare const getFrameworkChoices: (category?: FrameworkCategory) => {
    name: string;
    value: FrameworkType;
}[];
