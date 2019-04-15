// I want to trial an ECS for this codebase, but there's so many ways to
// implement it.


// import { TransformC } from "./transform";

export interface TransformC {
  x: number, y: number,
  angle: number, // In radians from the azimuth.
}

export interface MovableC {
  speed: number, // Pixels / second
  rotSpeed: number
}

export interface VisibilityC { // Requires transform
  color: string,
  size: number,
}

export interface EntityComponents {
  // Then all the components. There's a bunch of ways this could work, but
  // simplest is usually best in JS land.
  transform?: TransformC,
  movable?: MovableC,
  localController?: boolean,
  behaviourController?: any, // Iterable | null or something.
  visibility?: VisibilityC,
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
  return e
}

// This isn't ideal... but ok for now.
export function *eachEntity(es: Entities, pred: (e: Entity) => any): IterableIterator<Entity> {
  for (const e of es.values()) {
    if (pred(e)) yield e
  }
}

export function getSingleton(es: Entities, pred: (e: Entity) => any): Entity {
  for (const e of es.values()) { // This is a hillariously inefficient implementation.
    if (pred(e)) return e
  }
  throw new Error('Missing singleton')
}
