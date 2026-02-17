import type { GamePackage, RuntimeTemplate } from "../../core/types";
import { createRpgTopdownWorld, stepRpgTopdown } from "./systems";
import { validateRpgTopdownPackage } from "./validator";

function createWorld(pkg: GamePackage, seed: number) {
  return createRpgTopdownWorld(pkg, seed);
}

export const rpgTopdownTemplate: RuntimeTemplate = {
  id: "rpg-topdown",
  createWorld,
  step: stepRpgTopdown,
  validate: validateRpgTopdownPackage
};
