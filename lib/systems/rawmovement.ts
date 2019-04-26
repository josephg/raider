import { Entity } from "../components/entities";
import { Vec, v_dist } from "../vec";

// Raw movement functions
const TAU = Math.PI * 2
const normAngle = (a: number) => (a + TAU + TAU) % TAU // 0 to TAU.
export const getAV = (currentAngle: number, budget: number, targetAngle: number, turnspeed: number): {da: number, budget: number} => {
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

export const lookTowardA = (e: Entity, budget: number, angle: number) => {
  // Entity must have transform + movable.
  const {da, budget: budgetRemaining} = getAV(e.transform!.angle, budget, angle, e.movable!.rotSpeed)
  e.transform!.va = da
  return budgetRemaining
}
export const lookTowardXY = (e: Entity, budget: number, target: Vec) => {
  const angle = Math.atan2(target.y - e.transform!.y, target.x - e.transform!.x)
  return lookTowardA(e, budget, angle)
}


export const moveRaw = (e: Entity, speed: number) => {
  const {angle} = e.transform!
  // e.transform!.x += Math.cos(angle) * dist
  // e.transform!.y += Math.sin(angle) * dist
  e.transform!.vx += Math.cos(angle) * speed
  e.transform!.vy += Math.sin(angle) * speed
}

export const moveForward = (e: Entity, budget: number, desiredDist: number): number => {
  const maxDist = budget * e.movable!.maxSpeed
  if (maxDist < desiredDist) {
    moveRaw(e, maxDist)
    return 0
  } else {
    moveRaw(e, desiredDist)
    return budget - desiredDist / maxDist
  }
}

export const moveToward = (e: Entity, budget: number, target: Vec, desiredRange: number = 0): number => {
  // debugger
  budget = lookTowardXY(e, budget, target)
  if (budget <= 0) return 0

  const dist = Math.max(v_dist(e.transform!, target) - desiredRange, 0)
  // const dist = vec.dist(e, target) - desiredRange
  return moveForward(e, budget, dist)
}
