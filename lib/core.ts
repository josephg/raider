import { Entities, Entity, addEntity, ShapeType } from "./components/entities"
import render from "./render"
import update from "./update"
import * as wasm from '../crate/Cargo.toml'
import { CGroup } from "../crate/Cargo.toml";

wasm.init()

const es: Entities = new Map<number, Entity>()
const stationary = {vx: 0, vy: 0, va: 0}
addEntity(es, {
  transform: {x: 0, y: 0, angle: 0, ...stationary},
  movable: {
    maxSpeed: 3,
    // maxSpeed: 30,
    rotSpeed: 2, // rads / second.
  },
  shape: {
    color: 'green',
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
  collider: {
    cgroup: CGroup.Player,
  },
  localController: true,
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

let running = document.hasFocus()
const frame = () => {
  update(es)
  render(es)
  
  if (running) requestAnimationFrame(frame)
}
frame()

// I would use document.onblur/focus but they don't do anything in chrome.
window.onblur = () => {
  running = false
  console.log('paused')
}
window.onfocus = () => {
  running = true
  console.log('resumed')
  frame()
}

// wasm.take_enum(wasm.MyEnum.Zot)