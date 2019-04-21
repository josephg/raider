// I want to trial an ECS for this codebase, but there's so many ways to
// implement it.
import {CGroup} from '../../crate/Cargo.toml'
import systems from '../systems';
// import { TransformC } from "./transform";

export interface TransformC {
  x: number, y: number,
  angle: number, // In radians from the azimuth.

  // Instantaneous frame velocity
  vx: number, vy: number, va: number,
}

export interface MovableC {
  maxSpeed: number, // Linear units / second.
  rotSpeed: number
}

export const enum ShapeType {
  Circle,
  Box,
}

export type Shape = {
  type: ShapeType.Circle,
  radius: number,
} | {
  type: ShapeType.Box,
  w: number,
  h: number,
}

export interface ShapeC { // Requires transform
  color: string,
  shape: Shape
}

export interface ColliderC {
  cgroup: CGroup,
  handle?: number, // Filled in by the space system.
}

export interface EntityComponents {
  // Then all the components. There's a bunch of ways this could work, but
  // simplest is usually best in JS land.
  transform?: TransformC,
  movable?: MovableC,
  shape?: ShapeC,
  collider?: ColliderC,

  localController?: boolean,
  behaviourController?: any, // Iterable | null or something.

  camera?: boolean, // Singleton entity.
}

export interface Entity extends EntityComponents {
  id: number,
}


// export const eachTuple
export type Entities = Map<number, Entity>

let nextId = 1000
export const addEntity = (es: Entities, c: EntityComponents): Entity => {
  // TODO: Might be worth enforcing some preconditions here too - render requires transform, etc.
  const e: Entity = {id: nextId++, ...c}
  es.set(e.id, e)

  // TODO: I don't like this direct dependancy here.
  for (const s of systems) if (s.onAdded) s.onAdded(e)

  return e
}

// This isn't ideal... but ok for now.
// export function *eachEntity(es: Entities, pred: (e: Entity) => any): IterableIterator<Entity> {
//   for (const e of es.values()) {
//     if (pred(e)) yield e
//   }
// }
export function eachEntity(es: Entities, pred: (e: Entity) => any): IterableIterator<Entity> {
  return Array.from(es.values()).filter(pred).values()
  // for (const e of es.values()) {
  //   if (pred(e)) yield e
  // }
}

export function getSingleton(es: Entities, pred: (e: Entity) => any): Entity {
  for (const e of es.values()) { // This is a hillariously inefficient implementation.
    if (pred(e)) return e
  }
  throw new Error('Missing singleton')
}
