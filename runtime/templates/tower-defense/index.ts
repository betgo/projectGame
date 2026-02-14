import { createBaseWorld } from "../../core/world";
import type { GamePackage, RuntimeTemplate } from "../../core/types";
import { stepTowerDefense } from "./systems";
import { validateTowerDefensePackage } from "./validator";

function createWorld(pkg: GamePackage, seed: number) {
  return createBaseWorld(pkg, seed);
}

export const towerDefenseTemplate: RuntimeTemplate = {
  id: "tower-defense",
  createWorld,
  step: stepTowerDefense,
  validate: validateTowerDefensePackage
};
