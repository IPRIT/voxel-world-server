import { LivingObject } from "../living-object";
import { LivingObjectType } from "../../dictionary";

export class Animal extends LivingObject {

  constructor () {
    super();

    this.setLivingObjectType( LivingObjectType.ANIMAL );
  }
}