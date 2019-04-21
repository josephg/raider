// This handles interacting with the collision space.
// This is used for boss abilities and walls.
import {World, make_circle, CGroup, LocalShapeHandle, make_box} from '../../crate/Cargo.toml'
import System from './system'
import { eachEntity, Entity, ShapeType } from '../components/entities';
import update from '../update';

// So much for there being no state in systems. I guess if this were blizzard
// they'd make an entity which owns the world space.
const world = World.new()

// This might not be the best way to do this.
const entityByRef = new Map<number, Entity>()

const enum ContactType {
  Added = 0,
  Removed = 1,
}

const dt = 1/60
let debugText = ''

export const simpleMovement: System = {
  pred: (e: Entity) => !e.collider && e.transform && e.shape,
  update(es) {
    for (const e of eachEntity(es, e => this.pred(e) && e.movable)) {
      e.transform!.x += e.transform!.vx * dt
      e.transform!.y += e.transform!.vy * dt
      e.transform!.angle += e.transform!.va * dt

      e.transform!.vx = e.transform!.vy = e.transform!.va = 0
    }
  }
}

const pred = (e: Entity) => e.collider && e.transform && e.shape
export const collisionSystem: System = {
  pred,

  onAdded(e) {
    if (pred(e)) {
      const {cgroup} = e.collider!
      const {x, y, angle} = e.transform!

      const shapeDesc = e.shape!.shape

      const shape: LocalShapeHandle =
        (shapeDesc.type === ShapeType.Circle) ? make_circle(shapeDesc.radius)
        : (shapeDesc.type === ShapeType.Box) ? make_box(shapeDesc.w, shapeDesc.h)
        : null as any

      const speed = e.movable ? e.movable.maxSpeed : 0
      const handle = e.collider!.handle = world.add(x, y, angle, shape, cgroup, speed / 60)
      entityByRef.set(handle, e)
    }
  },

  renderDebug(ctx) {
    if (debugText !== '') {
      ctx.font = '14px sans-serif'
      ctx.fillStyle = 'white'
      ctx.fillText(debugText, 20, 20)
    }
  },

  update(es) {
    for (const e of eachEntity(es, e => pred(e) && e.movable)) {
      const {x, y, angle, vx, vy, va} = e.transform!
      // world.set_position(e.collider!.handle!, x, y, angle)
      if (vx !== 0 || vy !== 0 || va !== 0) {
        const [newx, newy] = world.try_move(e.collider!.handle!, vx * dt, vy * dt, va * dt)
        ;[e.transform!.x, e.transform!.y] = [newx, newy]
        e.transform!.angle += e.transform!.va
        e.transform!.vx = e.transform!.vy = e.transform!.va = 0
      }
    }

    world.update()



    // const contact_pairs = world.contact_pairs()
    // // if (contact_pairs.length) console.log('contact pairs', contact_pairs)
    // for (let i = 0; i < contact_pairs.length; i += 5) {
    //   const a = entityByRef.get(contact_pairs[i+0])!
    //   const b = entityByRef.get(contact_pairs[i+1])!
    //   const nx = contact_pairs[i+2]
    //   const ny = contact_pairs[i+3]
    //   const depth = contact_pairs[i+4]

    //   const e = (a.collider!.cgroup === CGroup.Player) ? a : b
    //   const m = (a.collider!.cgroup === CGroup.Player) ? -1 : 1
    //   e.transform!.x += (depth + 0.01) * nx * m
    //   e.transform!.y += (depth + 0.01) * ny * m

    // }

    // debugText = "last contacts: " + contact_pairs.length / 5 + ' :' + contact_pairs.join(', ')



    // world.prox_events()

    
    // const contacts = world.contact_events()
    // for (let i = 0; i < contacts.length; i += 3) {
    //   const type = contacts[i] as ContactType
    //   const a = entityByRef.get(contacts[i+1])!
    //   const b = entityByRef.get(contacts[i+2])!

    //   if (type === ContactType.Added) {
    //     const e = (a.collider!.cgroup === CGroup.Player) ? a : b
    //     e.shape!.color = 'blue'

    //     const contact = world.get_contact(contacts[i+1], contacts[i+2])
    //     if (contact.length === 0) throw Error('Huh? this is invalid')
    //     const [awx, awy, bwx, bwy, nx, ny, depth] = contact
    //     console.log('cntact', contact)

    //     // Move the object so its not colliding anymore.
    //     e.transform!.x -= depth * nx * 10
    //     e.transform!.y -= depth * ny * 10
    //   } else {
    //     if (a.collider!.cgroup === CGroup.Player) a!.shape!.color = 'green'
    //     else b!.shape!.color = 'green'
    //   }


    // }

    // if (contacts.length) console.log('contacts', contacts)
  },

  onRemoved(e) {
    throw Error('not implemented')
  }
}

