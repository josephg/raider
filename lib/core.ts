import { Entities, Entity, addEntity } from "./components/entities";
import render from "./render";
import update from "./update";


const es: Entities = new Map<number, Entity>()

addEntity(es, {
  transform: {x: 0, y: 0, angle: 0},
  localController: true,
  movable: {
    speed: 100,
    rotSpeed: 0.1,
  },
  visibility: {
    color: 'red',
    size: 12,
  }
})

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