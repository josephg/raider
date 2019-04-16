/* Based on code from ChipmunkJS:
 *
 * Copyright (c) 2007 Scott Lembcke
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { Vec, min, max } from "./vec";

/// Chipmunk's axis-aligned 2D bounding box type along with a few handy routines.
/**
 * Bounding boxes are JS arrays with [l, b, r, t] = left, bottom, right, top, respectively.
 */
export type BB = {l:number, b:number, r:number, t:number}

export const bbNew = (l: number, b: number, r: number, t: number): BB => ({l,b,r,t})

export const bbForCircle = ({x, y}: Vec, r: number): BB => ({
  l: x - r,
  b: y - r,
  r: x + r,
  t: y + r
})

/// Returns true if @c a and @c b intersect.
export const bbIntersects = (a: BB, b: BB) => (a.l <= b.r && b.l <= a.r && a.b <= b.t && b.b <= a.t)
export const bbIntersects2 = (bb: BB, l: number, b: number, r: number, t: number) => (
  bb.l <= r && l <= bb.r && bb.b <= t && b <= bb.t
)

/// Returns true if @c other lies completely within @c bb.
export const bbContainsBB = (bb: BB, other: BB) => (
  bb.l <= other.l && bb.r >= other.r && bb.b <= other.b && bb.t >= other.t
)

/// Returns true if @c bb contains @c v.
export const bbContainsVect = (bb: BB, {x, y}: Vec) => (
  bb.l <= x && bb.r >= x && bb.b <= y && bb.t >= y
)

export const bbContainsVect2 = (l: number, b: number, r: number, t: number, {x, y}: Vec) => (
  l <= x && r >= x && b <= y && t >= y
)

/// Returns a bounding box that holds both bounding boxes.
export const bbMerge = (a: BB, b: BB) => ({
  l: min(a.l, b.l),
  b: min(a.b, b.b),
  r: max(a.r, b.r),
  t: max(a.t, b.t)
})

export const bbMergeInto = (target: BB, a: BB, b: BB) => {
  target.l = min(a.l, b.l)
  target.b = min(a.b, b.b)
  target.r = max(a.r, b.r)
  target.t = max(a.t, b.t)
}

/// Returns a bounding box that holds both @c bb and @c v.
export const bbExpand = (bb: BB, v: Vec) => ({
  l: min(bb.l, v.x),
  b: min(bb.b, v.y),
  r: max(bb.r, v.x),
  t: max(bb.t, v.y)
})

/// Returns the area of the bounding box.
export const bbArea = (bb: BB) => (bb.r - bb.l)*(bb.t - bb.b)

/// Merges @c a and @c b and returns the area of the merged bounding box.
export const bbMergedArea = (a: BB, b: BB) => (
  (max(a.r, b.r) - min(a.l, b.l))*(max(a.t, b.t) - min(a.b, b.b))
)

export const bbMergedArea2 = (bb: BB, l: number, b: number, r: number, t: number) => (
  (max(bb.r, r) - min(bb.l, l))*(max(bb.t, t) - min(bb.b, b))
)

/// Returns the fraction along the segment query the bb is hit. Returns INFINITY if it doesn't hit.
export const bbSegmentQuery = (bb: BB, a: Vec, b: Vec) => {
  const deltaX = b.x - a.x, deltaY = b.y - a.y
  let tmin = -Infinity, tmax = Infinity
  
  if (deltaX === 0.0) {
    if(a.x < bb.l || bb.r < a.x) return Infinity
  } else {
    const t1 = (bb.l - a.x)/deltaX
    const t2 = (bb.r - a.x)/deltaX
    tmin = max(tmin, min(t1, t2))
    tmax = min(tmax, max(t1, t2))
  }
  
  if (deltaY === 0.0){
    if (a.y < bb.b || bb.t < a.y) return Infinity
  } else {
    let t1 = (bb.b - a.y)/deltaY
    let t2 = (bb.t - a.y)/deltaY
    tmin = max(tmin, min(t1, t2))
    tmax = min(tmax, max(t1, t2))
  }
  
  return (tmin <= tmax && 0.0 <= tmax && tmin <= 1.0)
    ? max(tmin, 0.0)
    : Infinity
}

/// Clamp a vector to a bounding box.
export const bbClampVect = (bb: BB, v: Vec): Vec => ({
  x: min(max(bb.l, v.x), bb.r),
  y: min(max(bb.b, v.y), bb.t)
})

// TODO edge case issue
/// Wrap a vector to a bounding box.
export const bbWrapVect = (bb: BB, v: Vec) => {
  const ix = Math.abs(bb.r - bb.l)
  const modx = (v.x - bb.l) % ix
  const x = (modx > 0) ? modx : modx + ix
  
  const iy = Math.abs(bb.t - bb.b)
  const mody = (v.y - bb.b) % iy
  const y = (mody > 0) ? mody : mody + iy
  
  return {
    x: x + bb.l,
    y: y + bb.b
  }
}
