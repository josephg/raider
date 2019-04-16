export const min = (a: number, b: number) => a < b ? a : b
export const max = (a: number, b: number) => a > b ? a : b

export type Vec = {x: number, y: number}
export const vecNew = (x: number, y: number): Vec => ({x, y})

export const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b)
export const vlen = (x: number, y: number) => Math.sqrt(x*x + y*y)
export const dist2 = ({x:x0, y:y0}: Vec, {x:x1, y:y1}: Vec) => Math.sqrt((x0-x1)*(x0-x1) + (y0-y1)*(y0-y1))
export const distSq = ({x:x0, y:y0}: Vec, {x:x1, y:y1}: Vec) => (x0-x1)*(x0-x1) + (y0-y1)*(y0-y1)

// It would be more efficient to do a manhatten distance test first, but eh.
export const isWithinDist = (p0: Vec, p1: Vec, dist: number) => distSq(p0, p1) < dist*dist
// export const isVeryClose = (p0: Vec, p1: Vec) => isWithinDist(p0, p1, 0.1)

// export const vdot2 = (x1, y1, x2, y2) => x1*x2 + y1*y2

export const lerp = (z: number, a: number, b: number) => (1-z)*a + z*b
export const lerpVec = (z: number, {x:x0, y:y0}: Vec, {x:x1, y:y1}: Vec) => [lerp(z, x0, x1), lerp(z, y0, y1)]

export const vAdd = ({x:x0, y:y0}: Vec, {x:x1, y:y1}: Vec) => ({x: x0+x1, y: y0+y1})
export const vSub = ({x:x0, y:y0}: Vec, {x:x1, y:y1}: Vec) => ({x: x0-x1, y: y0-y1})
export const vMul = ({x:x0, y:y0}: Vec, m: number) => ({x: m * x0, y: m * y0})