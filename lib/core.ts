import { Entities, Entity, addEntity, ShapeType, UnitType } from "./components/entities"
import render from "./render"
import update from "./update"
import * as wasm from '../crate/Cargo.toml'
import { CGroup } from '../crate/Cargo.toml'
import { turnTo, moveTo, stall, moveForwardBehaviour } from "./systems/behaviour";

wasm.init()

const dt = 1/60

const es: Entities = new Map<number, Entity>()
const stationary = {vx: 0, vy: 0, va: 0}
addEntity(es, {
  transform: {x: 0, y: 0, angle: 0, ...stationary},
  movable: {
    maxSpeed: 3*dt,
    // maxSpeed: 30,
    rotSpeed: 4*dt, // rads / second.
  },
  shape: {
    color: 'blue',
    // shape: {
    //   type: ShapeType.Box,
    //   w: 0.6,
    //   h: 5,
    // }
    shape: {
      type: ShapeType.Circle,
      radius: 0.5,
    }
  },
  unitType: UnitType.Player,
  collider: { cgroup: CGroup.Unit, },
  localController: true,
})

addEntity(es, {
  transform: {x: 0, y: -5, angle: 0, ...stationary},
  movable: {
    maxSpeed: 3*dt,
    rotSpeed: 8*dt,
  },
  shape: {
    color: 'purple',
    shape: {
      type: ShapeType.Circle,
      radius: 2,
    }
  },
  collider: {
    cgroup: CGroup.Unit,
  },
  unitType: UnitType.Enemy,
  // localController: true,
  aiController: function*(e) {
    while (true) {
      yield* turnTo(e, Math.random() * 6)
      // yield* turnTo(e, 2.2)
      yield* stall(20)
      
      const {x, y, angle} = e.transform!
      addEntity(es, {
        transform: {
          x: x + 2 * Math.cos(angle),
          y: y + 2 * Math.sin(angle),
          angle: angle,
          ...stationary,
        },
        shape: {
          color: 'hotpink',
          shape: { type: ShapeType.Circle, radius: 0.1 }
        },
        movable: { rotSpeed: 0, maxSpeed: 8*dt },
        aiController: moveForwardBehaviour,
        collider: {
          cgroup: CGroup.Projectile,
          didCollideWith(self, e) {
            // if (e.collider!.cgroup === CGroup.Static) self.reap = e.reap = true
            if (e.collider!.cgroup === CGroup.Static) self.reap = true
            else if (e.unitType === UnitType.Player) self.reap = e.reap = true
          }
        },
        lifetime: 2 * 60, // in frames, so its an integer :/
      })
      // yield* stall(100)
    }
  }
})

const patrolRoute = [
  {x:-5, y:-3}, {x:-5, y:-5}, {x:-3, y:-5}, {x:-3, y:-3}
]
addEntity(es, {
  transform: {x:-2, y:-2, angle: 0, ...stationary},
  movable: {maxSpeed: 2*dt, rotSpeed: 4*dt},
  shape: { color: 'green', shape: {
    type: ShapeType.Circle,
    radius: 0.6
  }},
  collider: { cgroup: CGroup.Unit },
  unitType: UnitType.Enemy,
  aiController: function*(e) {
    for (let i = 0;; i = (i+1) % patrolRoute.length) {
      yield* moveTo(e, patrolRoute[i])
    }
  },
})

const TAU = Math.PI * 2
// x, y, w, h, a.
const boxes: [number, number, number, number, number][] = [
  [6, 3, 1, 5, 5],
  [0.9, 4, 0.8, 5, 2],

  [-10, 0, -0.2, 1, 5],
  [-8, 2, 0.2 + TAU/4, 1, 5],
]

const circles: [number, number, number][] = [
  [2.5, -3, 1],
  [5, -3, 1],
]

circles.forEach(([x, y, radius]) => addEntity(es, {
  transform: {x, y, angle: 0, ...stationary},
  shape: {
    color: 'red',
    shape: { type: ShapeType.Circle, radius, }
  },
  collider: { cgroup: CGroup.Static, },
}))

boxes.forEach(([x, y, angle, w, h]) => addEntity(es, {
  transform: {x, y, angle, ...stationary},
  shape: {
    color: 'red',
    shape: { type: ShapeType.Box, w, h, }
  },
  collider: { cgroup: CGroup.Static },
}))

// addEntity(es, {
//   transform: {x: 100, y: 100, angle: 0},
//   collision: {
//     cgroup: CGroup.Static,
//     radius: 30,
//   },
//   visibility: {
//     color: 'red',
//     size: 30,
//   }
// })

// Singleton camera.
addEntity(es, {
  transform: {x: 0, y: 0, angle: 0, ...stationary},
  camera: true,
})

let hasFocus = document.hasFocus()
let running = true
const frame = () => {
  update(es)
  render(es)
  
  if (hasFocus) requestAnimationFrame(frame)
  else running = false
}
frame()

// I would use document.onblur/focus but they don't do anything in chrome.
window.onblur = () => {
  hasFocus = false
  console.log('paused')
}
window.onfocus = () => {
  hasFocus = true
  console.log('resumed')
  if (running == false) {
    running = true
    frame()
  }
}

// wasm.take_enum(wasm.MyEnum.Zot)