// This handles interacting with the collision space.
// This is used for boss abilities and walls.
import {World, make_circle, CGroup, LocalShapeHandle, make_box} from '../../crate/Cargo.toml'
import System from './system'
import { eachEntity, Entity, ShapeType } from '../components/entities';

// So much for there being no state in systems. I guess if this were blizzard
// they'd make an entity which owns the world space.
const world = World.new()

// This might not be the best way to do this.
const entityByRef = new Map<number, Entity>()

const enum ContactType {
  Added = 0,
  Removed = 1,
}

const pred = (e: Entity) => e.collider && e.transform && e.shape
const spaceSystem: System = {
  pred,

  onAdded(e) {
    if (pred(e)) {
      const {cgroup} = e.collider!
      const {x, y} = e.transform!

      const shapeDesc = e.shape!.shape

      const shape: LocalShapeHandle =
        (shapeDesc.type === ShapeType.Circle) ? make_circle(shapeDesc.radius)
        : (shapeDesc.type === ShapeType.Box) ? make_box(shapeDesc.w, shapeDesc.h)
        : null as any

      const handle = e.collider!.handle = world.add(x, y, shape, cgroup)
      entityByRef.set(handle, e)
    }
  },

  update(es) {
    for (const e of eachEntity(es, e => pred(e) && e.movable)) {
      const {x, y, angle} = e.transform!
      world.set_position(e.collider!.handle!, x, y, angle)
    }

    world.update()

    const contacts = world.contact_events()
    for (let i = 0; i < contacts.length; i += 3) {
      const type = contacts[i] as ContactType
      const a = entityByRef.get(contacts[i+1])!
      const b = entityByRef.get(contacts[i+2])!

      if (type === ContactType.Added) {
        if (a.collider!.cgroup === CGroup.Player) a!.shape!.color = 'blue'
        else b!.shape!.color = 'blue'

        world.get_contact(contacts[i+1], contacts[i+2])
      } else {
        if (a.collider!.cgroup === CGroup.Player) a!.shape!.color = 'green'
        else b!.shape!.color = 'green'
      }


    }

    if (contacts.length) console.log('contacts', contacts)
  },

  onRemoved(e) {
    throw Error('not implemented')
  }
}

export default spaceSystem