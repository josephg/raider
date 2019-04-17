import { Entities, Entity, addEntity, ShapeType } from "./components/entities"
import render from "./render"
import update from "./update"
import * as wasm from '../crate/Cargo.toml'
import { CGroup } from "../crate/Cargo.toml";

const es: Entities = new Map<number, Entity>()

addEntity(es, {
  transform: {x: 0, y: 0, angle: 0},
  movable: {
    speed: 3,
    rotSpeed: 0.1,
  },
  shape: {
    color: 'green',
    shape: {
      type: ShapeType.Box,
      w: 0.6,
      h: 1,
    }
    // shape: {
    //   type: ShapeType.Circle,
    //   radius: 0.5,
    // }
  },
  collider: {
    cgroup: CGroup.Player,
  },
  localController: true,
})

addEntity(es, {
  transform: {x: 3, y: 1, angle: 0},
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
  transform: {x: 4.5, y: 0, angle: 0},
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
  transform: {x: 11, y: 0, angle: 0},
  shape: {
    color: 'red',
    shape: {
      type: ShapeType.Box,
      w: 10,
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
  transform: {x: 0, y: 0, angle: 0},
  camera: true,
})

let running = true
const frame = () => {
  if (!running) return

  update(es)
  render(es)

  requestAnimationFrame(frame)
}
frame()

window.onblur = () => {
  running = false
}
window.onfocus = () => {
  running = true
  frame()
}

// wasm.take_enum(wasm.MyEnum.Zot)