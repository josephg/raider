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
    rotSpeed: 0.1,
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

addEntity(es, {
  // transform: {x: 1.57, y: 0, angle: 0, ...stationary},
  transform: {x: 2.5, y: 1, angle: 0, ...stationary},
  shape: {
    color: 'red',
    shape: {
      type: ShapeType.Circle,
      radius: 1,
    }
  },
  collider: {
    cgroup: CGroup.Static,
  },
})
addEntity(es, {
  transform: {x: 4.5, y: 0, angle: 0, ...stationary},
  shape: {
    color: 'red',
    shape: {
      type: ShapeType.Circle,
      radius: 1,
    }
  },
  collider: {
    cgroup: CGroup.Static,
  },
})
addEntity(es, {
  transform: {x: 8, y: -2, angle: 1, ...stationary},
  shape: {
    color: 'red',
    shape: {
      type: ShapeType.Box,
      w: 5,
      h: 5,
    }
  },
  collider: {
    cgroup: CGroup.Static,
  },
})

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

document.onblur = () => {
  running = false
  console.log('paused')
}
document.onfocus = () => {
  running = true
  console.log('resumed')
  frame()
}

// wasm.take_enum(wasm.MyEnum.Zot)