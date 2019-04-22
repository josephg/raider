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
const normAngle = (a: number) => (a + TAU + TAU) % TAU // 0 to TAU.
const getAV = (currentAngle: number, budget: number, targetAngle: number, turnspeed: number): {da: number, budget: number} => {
  const target = normAngle(targetAngle)
  if (currentAngle === target) return {da:0, budget}

  const distLeft = normAngle(currentAngle - target)
  const distRight = normAngle(target - currentAngle)
  const maxDA = turnspeed * budget

  return (distLeft < distRight) ? (
    (distLeft < maxDA) ? {da:-distLeft, budget: budget - distLeft/maxDA} : {da: -maxDA, budget: 0}
  ) : (
    (distRight < maxDA) ? {da:distRight, budget: budget - distRight/maxDA} : {da: maxDA, budget: 0}
  )
}

const lookTowardA = (e: Entity, budget: number, angle: number) => {
  // Entity must have transform + movable.
  e.transform!.va = getAV(e.transform!.angle, budget, angle, e.movable!.rotSpeed / 60).da * 60
}
const lookTowardXY = (e: Entity, budget: number, x: number, y: number) => {
  const angle = Math.atan2(mouse.y - e.transform!.y, mouse.x - e.transform!.x)
  lookTowardA(e, budget, angle)
}

export const localController: System = {
  pred: e => e.localController && e.transform && e.movable,
  update(es: Entities) {
    for (const e of eachEntity(es, localController.pred)) {

      const playerSpeed = e.movable!.maxSpeed
      if (keysHeld.has('KeyA')) e.transform!.vx -= playerSpeed
      if (keysHeld.has('KeyD')) e.transform!.vx += playerSpeed
      if (keysHeld.has('KeyW')) e.transform!.vy -= playerSpeed
      if (keysHeld.has('KeyS')) e.transform!.vy += playerSpeed

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