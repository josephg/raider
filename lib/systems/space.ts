// This handles interacting with the collision space.
// This is used for boss abilities and walls.
import {World, make_circle, CGroup, LocalShapeHandle, make_box} from '../../crate/Cargo.toml'
import System from './system'
import { eachEntity, Entity, ShapeType } from '../components/entities'

// So much for there being no state in systems. I guess if this were blizzard
// they'd make an entity which owns the world space.
const world = World.new()

// This might not be the best way to do this.
// const entityByRef = new Map<number, Entity>()

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
      // console.log('adding entity to space', e.id, cgroup)

      const shapeDesc = e.shape!.shape

      const shape: LocalShapeHandle =
        (shapeDesc.type === ShapeType.Circle) ? make_circle(shapeDesc.radius)
        : (shapeDesc.type === ShapeType.Box) ? make_box(shapeDesc.w, shapeDesc.h)
        : null as any

      const speed = e.movable ? e.movable.maxSpeed : 0
      const handle = e.collider!.handle = world.add(e.id, x, y, angle, shape, cgroup, Math.SQRT2 * speed / 60)
      // console.log('added handle', handle, cgroup)
      // entityByRef.set(handle, e)
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
      // e.transform!.va = 0
      const {x, y, angle, vx, vy, va} = e.transform!
      if (vx !== 0 || vy !== 0 || va !== 0) {
        // console.log(vx, vy, va)
        const [newx, newy, newa] = world.try_move(e.collider!.handle!, vx * dt, vy * dt, va * dt)
        ;[e.transform!.x, e.transform!.y, e.transform!.angle] = [newx, newy, newa]
        // e.transform!.angle += e.transform!.va * dt
        e.transform!.vx = e.transform!.vy = e.transform!.va = 0
      }
    }

    // console.log('update')
    const fixes = world.update()
    // if (fixes.length) console.log('fixes', fixes)

    for (let i = 0; i < fixes.length; i += 3) {
      const id = fixes[i]
      const x = fixes[i+1]
      const y = fixes[i+2]
      const e = es.get(id)!
      e.transform!.x = x
      e.transform!.y = y
    }

    // world.print_events()

    const prox = world.proximity_events()

    for (let i = 0; i < prox.length; i += 2) {
      const e1 = es.get(prox[i])!
      const e2 = es.get(prox[i+1])!
      console.log('collide', e1, e2)
    }
  },

  onRemoved(es, e) {
    // console.log('onremoved', e.collider!.handle!)
    world.remove(e.collider!.handle!)
  }
}

