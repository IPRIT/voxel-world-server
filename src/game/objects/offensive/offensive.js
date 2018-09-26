import { LivingObject } from "../living-object";
import { LivingObjectType } from "../../dictionary";

export class Offensive extends LivingObject {

  constructor () {
    super();

    this.setLivingObjectType( LivingObjectType.OFFENSIVE );
  }
}