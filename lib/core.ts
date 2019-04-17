import { Entities, Entity, addEntity, ShapeType } from "./components/entities"
import render from "./render"
import update from "./update"
import * as wasm from '../crate/Cargo.toml'
import { CGroup } from "../crate/Cargo.toml";

const es: Entities = new Map<number, Entity>()

addEntity(es, {
  transform: {x: 0, y: 0, angle: 0},
  movable: {
    speed: 100,
    rotSpeed: 0.1,
  },
  shape: {
    color: 'green',
    shape: {
      type: ShapeType.Box,
      w: 10,
      h: 20,
    }
    // shape: {
    //   type: ShapeType.Circle,
    //   radius: 12,
    // }
  },
  collider: {
    cgroup: CGroup.Player,
  },
  localController: true,
})

addEntity(es, {
  transform: {x: 100, y: 100, angle: 0},
  shape: {
    color: 'red',
    shape: {
      type: ShapeType.Circle,
      radius: 30,
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

const frame = () => {
  update(es)
  render(es)

  requestAnimationFrame(frame)
}
frame()

// wasm.take_enum(wasm.MyEnum.Zot)