export type Vec = {x: number, y: number}
export const v_sq = (x: number) => x*x
export const v_dist2 = (a: Vec, b: Vec) => v_sq(a.x - b.x) + v_sq(a.y - b.y)
export const v_dist = (a: Vec, b: Vec) => Math.sqrt(v_dist2(a, b))
