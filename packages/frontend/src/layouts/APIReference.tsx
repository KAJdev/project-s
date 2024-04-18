import { ApiReference as VueComponent } from "@scalar/api-reference";
import { applyVueInReact } from "veaury";

export const ApiReference = applyVueInReact(VueComponent) as any;
