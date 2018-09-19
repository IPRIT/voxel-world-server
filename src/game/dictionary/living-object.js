import { revertObject } from "../../utils/game-utils";

export const LivingObjectType = {
  PLAYER: 1,
  ANIMAL: 2,
  OFFENSIVE: 3,
  NPC: 4
};

export const LivingObjectTypeReverted = revertObject( LivingObjectType );