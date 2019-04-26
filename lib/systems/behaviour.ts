import { Entities, eachEntity, TransformC, Entity } from "../components/entities";
import System from './system'
import { screenToWorld } from "../render";
import * as vec from '../vec'
import { lookTowardXY, lookTowardA, moveRaw, moveToward } from "./rawmovement";

const keysHeld = new Set()
const keysPressedThisFrame = []

const mouse = {x: 0, y: 0}

window.onkeydown = e => {
  //console.log(e.code)
  keysHeld.add(e.code)
  keysPressedThisFrame.push(e.code)
  // 1 key == keyCode 49.
  //console.log(e)
}

window.onkeyup = e => {
  keysHeld.delete(e.code)
}

window.onblur = () => {
  keysHeld.clear()
}

window.onmousemove = e => {
  const {x, y} = screenToWorld(e.offsetX, e.offsetY)
  mouse.x = x; mouse.y = y
}

export const localController: System = {
  pred: e => e.localController && e.transform && e.movable,
  update(es: Entities) {
    for (const e of eachEntity(es, localController.pred)) {

      const playerSpeed = e.movable!.maxSpeed
      let dx = 0, dy = 0
      if (keysHeld.has('KeyA')) dx--
      if (keysHeld.has('KeyD')) dx++
      if (keysHeld.has('KeyW')) dy--
      if (keysHeld.has('KeyS')) dy++

      if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2 }

      e.transform!.vx = dx * playerSpeed
      e.transform!.vy = dy * playerSpeed

      // Look at the mouse
      lookTowardXY(e, 1, {x: mouse.x, y:mouse.y})
    }

    keysPressedThisFrame.length = 0
  }
}


export function *moveTo(e: Entity, target: vec.Vec, range: number = 0) {
  while (moveToward(e, 1, target, range) === 0) yield
}

export function *turnTo(e: Entity, angle: number) {
  while (lookTowardA(e, 1, angle) === 0) yield
}

// Run iterator so long as predicate remains true
export function *iwhile<T>(pred: () => boolean, iter: (() => IterableIterator<T>) | Iterator<T>) {
  if (typeof iter === 'function') iter = iter() // Avoids some awkward syntax

  while (pred()) {
    const {value, done} = iter.next()
    if (done) break
    else yield value
  }
}

export function *stall(framecount: number) {
  while (framecount--) yield
}

export function *moveForwardBehaviour(e: Entity) {
  while (true) {
    moveRaw(e, e.movable!.maxSpeed)
    yield
  }
}

export const behaviour: System = {
  pred: e => e.aiController && e.transform && e.movable,

  // onAdded(e: Entity) {
  //   if (this.pred(e)) e.aiControllerInstance = e.aiController!(e)
  // },

  update(es: Entities) {
    for (const e of eachEntity(es, behaviour.pred)) {
      if (e.aiControllerInstance == null) e.aiControllerInstance = e.aiController!(e)
      if (e.aiControllerInstance!.next().done) e.aiControllerInstance = undefined
    }
  }
}