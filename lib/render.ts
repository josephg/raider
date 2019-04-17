import { Entities, eachEntity, getSingleton, ShapeType } from "./components/entities";
import systems from "./systems";

const TAU = Math.PI * 2

const canvas = document.getElementsByTagName('canvas')[0]
let width: number, height: number
const ctx = canvas.getContext('2d')!

const resize = window.onresize = () => {
  canvas.width = (width = canvas.clientWidth) * devicePixelRatio;
  canvas.height = (height = canvas.clientHeight) * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio) // For high dpi display support
}
resize()

const circle = (cx: number, cy: number, r: number) => {
  ctx.arc(cx, cy, r, 0, TAU)
}

const PIXELS_PER_UNIT = 30
export function worldToScreen(x: number, y: number) {
  return {x: x * PIXELS_PER_UNIT + width/2, y: y * PIXELS_PER_UNIT + height/2}
}

export function screenToWorld(x: number, y: number) {
  // const {x: cameraX, y: cameraY} = getSingleton(es, e => e.camera && e.transform).transform!
  return {x: (x - width/2) / PIXELS_PER_UNIT, y: (y - height/2) / PIXELS_PER_UNIT}
}

export default function render(es: Entities) {
  ctx.fillStyle = '#150505'
  ctx.fillRect(0, 0, width, height)
  ctx.save()

  const {x: sx, y: sy} = worldToScreen(0, 0)
  ctx.translate(sx, sy)
  ctx.scale(PIXELS_PER_UNIT, PIXELS_PER_UNIT)
  ctx.lineWidth = 1/PIXELS_PER_UNIT

  // const {x: cameraX, y: cameraY} = getSingleton(es, e => e.camera && e.transform).transform!
  // ctx.translate(width/2 - cameraX, height/2 - cameraY)

  for (const e of eachEntity(es, e => e.shape && e.transform)) {
    const {x, y, angle} = e.transform!
    const {shape, color} = e.shape!

    if (shape.type === ShapeType.Circle) {
      ctx.beginPath()
      let {radius} = shape
      circle(x, y, radius)

      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.stroke()
    } else if (shape.type === ShapeType.Box) {
      const {w, h} = shape
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillStyle = color
      ctx.fillRect(-w/2, -h/2, w, h)
      ctx.strokeStyle = 'white'
      ctx.strokeRect(-w/2, -h/2, w, h)
      ctx.restore()
    }
  }
  ctx.restore()

  for (const s of systems) if (s.renderDebug) s.renderDebug(ctx, width, height)
}