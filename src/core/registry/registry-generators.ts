import { registerGenerator } from "./generators.js";
import { reactGenerator } from "../../generators/frontend/react.js";

registerGenerator("react", reactGenerator)