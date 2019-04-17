import { Entities, eachEntity, getSingleton, ShapeType } from "./components/entities";

const TAU = Math.PI * 2
declare const ctx: CanvasRenderingContext2D
declare const width: number
declare const height: number

const circle = (cx: number, cy: number, r: number) => {
  ctx.arc(cx, cy, r, 0, TAU)
}

export default function render(es: Entities) {
  ctx.fillStyle = '#150505'
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  const {x: cameraX, y: cameraY} = getSingleton(es, e => e.camera && e.transform).transform!
  ctx.translate(width/2 - cameraX, height/2 - cameraY)

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
}