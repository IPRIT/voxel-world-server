import { revertObject } from "../../utils/common-utils";

export const CharactersMap = {
  MYSTIC: 1,
  WARRIOR: 2,
  ARCHER: 3
};

export const CharactersMapReverted = revertObject( CharactersMap );