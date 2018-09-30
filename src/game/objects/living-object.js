import { EventEmitter } from "events";
import * as THREE from 'three';
import { ObjectGravity } from "../physic";
import { warp } from "../../utils/game-utils";
import { LivingObjectType, LivingObjectTypeReverted } from "../dictionary";
import { WORLD_MAP_BLOCK_SIZE, WORLD_MAP_SIZE } from "../vars";

export class LivingObject extends EventEmitter {

  /**
   * @type {number}
   * @private
   */
  _livingObjectType = LivingObjectType.UNKNOWN;

  /**
   * @type {THREE.Vector3}
   * @private
   */
  _position = new THREE.Vector3(
    WORLD_MAP_SIZE / 2 * WORLD_MAP_BLOCK_SIZE,
    510,
    WORLD_MAP_SIZE / 2 * WORLD_MAP_BLOCK_SIZE
  );

  /**
   * @type {string}
   * @private
   */
  _name = 'Unknown';

  /**
   * @type {THREE.Vector3}
   * @private
   */
  _targetLocation = null;

  /**
   * @type {boolean}
   * @private
   */
  _targetLocationInfinite = false;

  /**
   * @type {LivingObject}
   * @private
   */
  _targetObject = null;

  /**
   * @type {boolean}
   * @private
   */
  _isComing = false;

  /**
   * @type {boolean}
   * @private
   */
  _isJumping = false;

  /**
   * @type {boolean}
   * @private
   */
  _needsVerticalUpdate = true;

  /**
   * @type {number}
   * @private
   */
  _velocityScalar = .2;

  /**
   * @type {THREE.Vector3}
   * @private
   */
  _velocityDirection = new THREE.Vector3( 0, 0, 0 );

  /**
   * @type {number}
   * @private
   */
  _objectBlocksHeight = 1;

  /**
   * @type {number}
   * @private
   */
  _objectBlocksRadius = 1;

  /**
   * @type {number}
   * @private
   */
  _objectJumpVelocity = 25;

  /**
   * @type {ObjectGravity}
   * @private
   */
  _gravity = new ObjectGravity();

  /**
   * @param {number} deltaTime
   */
  update (deltaTime) {
    if (this._isComing) {
      if (this.getTargetLocationDistance() > warp( this._velocityScalar, deltaTime )) {
        this._nextPosition( deltaTime );
      } else {
        this.setComingState( false );
      }
    }

    if (this._needsVerticalUpdate) {
      this._updateVerticalPosition( deltaTime );
    }
  }

  /**
   * @param {number} objectType
   */
  setLivingObjectType (objectType) {
    this._livingObjectType = objectType;
  }

  /**
   * @param {string} name
   */
  setName (name) {
    this._name = name;
  }

  /**
   * @param {Vector3|Object} targetLocation
   * @param {boolean} isInfinite
   */
  setTargetLocation (targetLocation, isInfinite = false) {
    this._targetLocation = new THREE.Vector3( targetLocation.x, targetLocation.y, targetLocation.z );
    this._targetLocationInfinite = isInfinite;
    this._updateVelocityDirection();

    this.setComingState();

    console.log( `[LivingObject#setTargetLocation] [${this._name}] changed target location.` );
  }

  /**
   * @param {LivingObject} livingObject
   */
  setTargetObject (livingObject) {
    if (livingObject) {
      this._targetObject = livingObject;
    }
  }

  /**
   * Resets target object to null
   */
  resetTargetObject () {
    this._targetObject = null;
  }

  /**
   * @param {boolean} coming
   */
  setComingState (coming = true) {
    this._isComing = coming;
  }

  /**
   * @param {number} blocksHeight
   */
  setObjectBlocksHeight (blocksHeight) {
    this._objectBlocksHeight = blocksHeight;
  }

  /**
   * @param {number} blocksRadius
   */
  setObjectBlocksRadius (blocksRadius) {
    this._objectBlocksRadius = blocksRadius;
  }

  /**
   * @param {number} jumpVelocity
   */
  setObjectJumpVelocity (jumpVelocity) {
    this._objectJumpVelocity = jumpVelocity;
  }

  /**
   * @param {number} velocityScalar
   */
  setVelocityScalar (velocityScalar) {
    this._velocityScalar = velocityScalar;
  }

  /**
   * @param {number} acceleration
   */
  setGravityAcceleration (acceleration) {
    this._gravity.setAcceleration( acceleration );
  }

  /**
   * @returns {number}
   */
  getTargetLocationDistance () {
    let targetLocation = this._targetLocation.clone();
    return targetLocation && targetLocation.setY( 0 )
      .distanceTo(
        this._position.clone().setY( 0 )
      ) || 0;
  }

  /**
   * Jump with object gravity
   */
  jump () {
    if (!this._needsVerticalUpdate) {
      this._resumeVerticalUpdate();
    }

    this._isJumping = true;
    this._gravity.setVelocity( -this._objectJumpVelocity );

    console.log( `[LivingObject#jump] [${this._name}] jumped.` );
  }

  /**
   * @returns {number}
   */
  get livingObjectType () {
    return this._livingObjectType;
  }

  /**
   * @returns {string}
   */
  get livingObjectTypeName () {
    return LivingObjectTypeReverted[ this._livingObjectType ];
  }

  /**
   * @returns {string}
   */
  get name () {
    return this._name;
  }

  /**
   * @returns {Vector3}
   */
  get position () {
    return this._position;
  }

  /**
   * @returns {Vector3}
   */
  get targetLocation () {
    return this._targetLocation;
  }

  /**
   * @returns {LivingObject|null}
   */
  get targetObject () {
    return this._targetObject;
  }

  /**
   * @returns {boolean}
   */
  get isComing () {
    return this._isComing;
  }

  /**
   * @returns {boolean}
   */
  get isJumping () {
    return this._isJumping;
  }

  /**
   * @returns {number}
   */
  get velocityScalar () {
    return this._velocityScalar;
  }

  /**
   * @returns {Vector3}
   */
  get velocityDirection () {
    return this._velocityDirection;
  }

  /**
   * @returns {number}
   */
  get objectBlocksHeight () {
    return this._objectBlocksHeight;
  }

  /**
   * @returns {number}
   */
  get objectHeight () {
    return this._objectBlocksHeight * WORLD_MAP_BLOCK_SIZE;
  }

  /**
   * @returns {number}
   */
  get objectBlocksRadius () {
    return this._objectBlocksRadius;
  }

  /**
   * @returns {number}
   */
  get objectRadius () {
    return this._objectBlocksRadius * WORLD_MAP_BLOCK_SIZE;
  }

  /**
   * @returns {number}
   */
  get objectJumpVelocity () {
    return this._objectJumpVelocity;
  }

  /**
   * @return {boolean}
   */
  get isPlayer () {
    return this._livingObjectType === LivingObjectType.PLAYER;
  }

  /**
   * @return {boolean}
   */
  get isAnimal () {
    return this._livingObjectType === LivingObjectType.ANIMAL;
  }

  /**
   * @return {boolean}
   */
  get isOffensive () {
    return this._livingObjectType === LivingObjectType.OFFENSIVE;
  }

  /**
   * @param {number} deltaTime
   * @private
   */
  _nextPosition ( deltaTime ) {
    let shiftVector = this._velocityDirection.clone()
      .normalize()
      .multiplyScalar(
        warp( this._velocityScalar, deltaTime )
      );

    // + remove
    let oldPosition = this.position.clone();
    this.position.add( shiftVector );
    let distancePassed = oldPosition.distanceTo( this.position );
    if (distancePassed < .01 && !this._targetLocationInfinite) {
      this.setComingState( false );
    }

    if (!this._needsVerticalUpdate) {
      this._resumeVerticalUpdate();
    }

    console.log( this.name, this._position.toArray(), this._isComing );
    // - remove



    /*let { shiftPosition, changed } = this.map.collisions.clampNextPosition(
      this.position, shiftVector, {
        objectBlocksRadius: this._objectBlocksRadius,
        objectBlocksHeight: this._objectBlocksHeight
      }
    );*/

    /*if (changed) {
      this._updateVelocityDirection();
    }*/

    /*let oldPosition = this.position.clone();
    this.position.add( shiftPosition );
    let distancePassed = oldPosition.distanceTo( this.position );
    if (distancePassed < .01 && !this._targetLocationInfinite) {
      this.setComingState( false );
    }

    if (!this._needsVerticalUpdate) {
      this._resumeVerticalUpdate();
    }*/
  }

  /**
   * @private
   */
  _updateVerticalPosition ( deltaTime ) {
    let shiftY = -this._gravity.update( deltaTime );
    let falling = shiftY < 0;

    // + remove
    let changed = this.position.y + shiftY < 0;

    this.position.y = changed
      ? 0 : this.position.y + shiftY;

    if (changed) {
      this._gravity.resetVelocity();

      if (falling) {
        !this._isComing && this._stopVerticalUpdate();
        this._isJumping && (this._isJumping = false);
      }
    }
    // - remove

    // let shiftY = -this._gravity.update( deltaTime );
    // let falling = shiftY < 0;

    /*let result = this.map.collisions.clampVerticalPosition(
      this.position, shiftY, {
        objectBlocksRadius: this._objectBlocksRadius,
        objectBlocksHeight: this._objectBlocksHeight
      }
    );
    shiftY = result.shiftY;
    this.position.y += shiftY;

    if (result.changed) {
      // this._gravity.resetVelocity();

      if (falling) {
        !this._isComing && this._stopVerticalUpdate();
        this._isJumping && (this._isJumping = false);
      }
    }*/
  }

  /**
   * @private
   */
  _stopVerticalUpdate () {
    this._gravity.stopUpdatingVelocity();
    this._gravity.resetVelocity();
    this._needsVerticalUpdate = false;
  }

  /**
   * @private
   */
  _resumeVerticalUpdate () {
    this._gravity.resumeUpdatingVelocity();
    this._needsVerticalUpdate = true;
  }

  /**
   * @private
   */
  _updateVelocityDirection () {
    const target = this._targetLocation.clone().setY( 0 );
    const current = this._position.clone().setY( 0 );
    this._velocityDirection = target.sub( current ).normalize();
  }
}