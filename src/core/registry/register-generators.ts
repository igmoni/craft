import { expressGenerator } from "../../generators/backend/express.js";
import { fastifyGenerator } from "../../generators/backend/fastify.js";
import { honoGenerator } from "../../generators/backend/hono.js";
import { nestjsGenerator } from "../../generators/backend/nestjs.js";
import { angularGenerator } from "../../generators/frontend/angular.js";
import { reactGenerator } from "../../generators/frontend/react.js";
import { vueGenerator } from "../../generators/frontend/vue.js";
import { nextGenerator } from "../../generators/fullstack/next.js";
import { registerGenerator } from "./generators.js";

registerGenerator("react", reactGenerator);
registerGenerator("vue", vueGenerator);
registerGenerator("angular", angularGenerator);
registerGenerator("next", nextGenerator);
registerGenerator("express", expressGenerator);
registerGenerator("nestjs", nestjsGenerator);
registerGenerator("fastify", fastifyGenerator);
registerGenerator("hono", honoGenerator);
