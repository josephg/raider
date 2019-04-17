import { Entities, eachEntity, TransformC, Entity } from "../components/entities";
import System from './system'
import { screenToWorld } from "../render";

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

const dt = 1/60


const TAU = Math.PI * 2
const normAngle = (a: number) => (a + TAU) % TAU // 0 to TAU.
const turnTowardInternal = (e: TransformC, budget: number, angle: number, turnspeed: number): number => {
  const target = normAngle(angle)
  if (e.angle === target) return budget

  const distLeft = normAngle(e.angle - target)
  const distRight = normAngle(target - e.angle)
  const maxSpeed = turnspeed * budget

  return (distLeft < distRight) ? (
    (distLeft < maxSpeed) ? (e.angle = target, budget - distLeft/maxSpeed) : (e.angle -= maxSpeed, 0)
  ) : (
    (distRight < maxSpeed) ? (e.angle = target, budget - distRight/maxSpeed) : (e.angle += maxSpeed, 0)
  )
}

const lookTowardA = (e: Entity, budget: number, angle: number) => {
  // Entity must have transform + movable.
  turnTowardInternal(e.transform!, budget, angle, e.movable!.rotSpeed)
}
const lookTowardXY = (e: Entity, budget: number, x: number, y: number) => {
  const angle = Math.atan2(mouse.y - e.transform!.y, mouse.x - e.transform!.x)
  lookTowardA(e, budget, angle)
}

export const localController: System = {
  pred: e => e.localController && e.transform && e.movable,
  update(es: Entities) {
    for (const e of eachEntity(es, localController.pred)) {
        
      const playerSpeed = e.movable!.speed
      if (keysHeld.has('KeyA')) e.transform!.x -= playerSpeed * dt
      if (keysHeld.has('KeyD')) e.transform!.x += playerSpeed * dt
      if (keysHeld.has('KeyW')) e.transform!.y -= playerSpeed * dt
      if (keysHeld.has('KeyS')) e.transform!.y += playerSpeed * dt

      // Look at the mouse
      lookTowardXY(e, 1, mouse.y - e.transform!.y, mouse.x - e.transform!.x)

      // Global movement controls
      // if (keysHeld.has('KeyA')) e.transform!.x -= playerSpeed * dt
      // if (keysHeld.has('KeyD')) e.transform!.x += playerSpeed * dt
      // if (keysHeld.has('KeyW')) e.transform!.y -= playerSpeed * dt
      // if (keysHeld.has('KeyS')) e.transform!.y += playerSpeed * dt
    }

    keysPressedThisFrame.length = 0
  }
}

export const behaviour: System = {
  pred: e => e.behaviourController && e.transform && e.movable,
  update(es: Entities) {
    for (const e of eachEntity(es, behaviour.pred)) {
      // !?
    }
  }
}