import { Entities, eachEntity, getSingleton } from "./components/entities";

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

  for (const e of eachEntity(es, e => e.visibility && e.transform)) {
    const {x, y, angle} = e.transform!
    const {size} = e.visibility!
    ctx.beginPath()
    circle(x, y, size)

    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size)

    ctx.fillStyle = e.visibility!.color
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.stroke()
  }
  ctx.restore()
}