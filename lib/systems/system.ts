import {Entities, Entity} from '../components/entities'

export default interface System {
  pred(e: Entity): any,

  onAdded?(e: Entity): void,
  update(entities: Entities): void,
  onRemoved?(e: Entity): void,
}