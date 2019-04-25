use std::f64;
use wasm_bindgen::prelude::*;
use ncollide2d::world::*;
use ncollide2d::shape::*;
use ncollide2d::math::*;
use ncollide2d::query;
use std::convert::From;
// use ncollide2d::events::*;
// use ncollide2d::bounding_volume;

// use web_sys::console;
// use na::{Vector2};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

type N = f64;

fn v_perp(v: Vector<N>) -> Vector<N> {
    Vector::new(v.y, -v.x)
}

fn v_d2(v: Vector<N>) -> N {
    v.x*v.x + v.y*v.y
}

fn v_dist(v: Vector<N>) -> N {
    v_d2(v).sqrt()
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn warn(s: &str);
}

fn noop(_s: &String) {}

macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
    // ($($t:tt)*) => (noop(&format_args!($($t)*).to_string()))
}

macro_rules! console_warn {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (warn(&format_args!($($t)*).to_string()))
}

// #[wasm_bindgen(start)]
#[wasm_bindgen]
pub fn init() {
    // Adds 30k to bundle size
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct LocalShapeHandle(ShapeHandle<f64>);

#[wasm_bindgen]
pub fn make_circle(r: f64) -> LocalShapeHandle {
    LocalShapeHandle(ShapeHandle::new(Ball::new(r)))
}

#[wasm_bindgen]
pub fn make_box(w: f64, h: f64) -> LocalShapeHandle {
    LocalShapeHandle(ShapeHandle::new(Cuboid::new(Vector::new(w/2.0, h/2.0))))
}

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq)]
pub enum CGroup {
    Static,
    Unit,
    Projectile,
}

// This stores data thats associated with each collision object on the rust side.
#[derive(Debug)]
struct EntityData {
    id: u32,
    e_type: CGroup,
}

#[wasm_bindgen]
pub struct World {
    world: CollisionWorld<f64, EntityData>,

    static_groups: CollisionGroups,
    unit_groups: CollisionGroups,
    projectile_groups: CollisionGroups,
}

const STATIC_GROUP: usize = 0;
const UNIT_GROUP: usize = 1;
const PROJECTILES_GROUP: usize = 2;
const EPSILON: f64 = 0.000001;

#[wasm_bindgen]
impl World {
    pub fn new() -> World {
        World {
            world: CollisionWorld::<_, _>::new(0.02),
            static_groups: CollisionGroups::new()
                .with_membership(&[STATIC_GROUP])
                .with_blacklist(&[STATIC_GROUP]),
            unit_groups: CollisionGroups::new()
                .with_membership(&[UNIT_GROUP])
                .with_blacklist(&[UNIT_GROUP]), // Players don't self-collide.
            projectile_groups: CollisionGroups::new()
                .with_membership(&[PROJECTILES_GROUP])
                .with_whitelist(&[STATIC_GROUP, UNIT_GROUP]),
        }
    }

    pub fn add(&mut self, id: u32, x: f64, y: f64, a: f64, shape: LocalShapeHandle, cgroup: CGroup, linear_speed: f64) -> usize {
        let pos = Isometry::new(Vector::new(x, y), a);

        let cg = match cgroup {
            CGroup::Static => self.static_groups,
            CGroup::Unit => self.unit_groups,
            CGroup::Projectile => self.projectile_groups,
        };
        let prox = match cgroup {
            // CGroup::Static => GeometricQueryType::Proximity(0.0),
            CGroup::Static => GeometricQueryType::Contacts(0.0, 0.0),
            // CGroup::Unit => GeometricQueryType::Contacts(linear_speed, 0.0),
            CGroup::Unit => GeometricQueryType::Contacts(linear_speed, linear_speed),
            CGroup::Projectile => GeometricQueryType::Proximity(0.0), // We don't care how a bullet hits you.
        };

        let obj = self.world.add(
            pos,
            shape.0,
            cg,
            prox,
            EntityData { id, e_type: cgroup }
        );

        obj.handle().0
    }

    pub fn remove(&mut self, handle: usize) {
        // TODO: world.remove takes an array. It might make sense to pass an
        // array of removed entities from javascript.
        let handle = CollisionObjectHandle(handle);
        self.world.remove(&[handle]);
    }

    pub fn set_position(&mut self, handle: usize, x: f64, y: f64, a: f64) {
        self.world.set_position(
            CollisionObjectHandle(handle),
            Isometry::new(Vector::new(x, y), a)
        );
    }

    pub fn try_move(&mut self, handle: usize, vx: f64, vy: f64, va: f64) -> Box<[f64]> {
        // console_log!("try move {} {} {}", handle, vx, vy);
        let handle = CollisionObjectHandle(handle);
        let orig_vel = Vector::new(vx, vy);
        let mut vel = orig_vel.clone();
        let co = self.world.collision_object(handle).unwrap();
        let mut pos = Isometry::new(co.position().translation.vector, co.position().rotation.angle() + va);

        let shape = co.shape();
        let mut t_remaining = 1.0;

        let mut deflect_sign: Option<bool> = None;
        
        let mut max_neg_vdot = 0.0;
        let mut min_pos_vdot = 0.0;

        // We're going to allow the angular change no matter what. This might
        // make us overlap with something. Maybe we should do this later? Not sure.
        // pos.append_rotation_wrt_center_mut(&na::UnitComplex::from_angle(va));
        
        if let Some(iter) = self.world.contacts_with(handle, false) {
            // We need to run through the proximities a few times. This is a bit
            // inefficient - the list will almost always only have one element.
            // As always, it'd be nice to have a vec-ish type which has a hot
            // path for 1 element.
            let other_handles = iter.map(|(h1, h2, _alg, manifold)| {
                let (h_other, m) = if h1 == handle {(h2, 1.0)} else {(h1, -1.0)};
                let contact = manifold.deepest_contact().map(|c| (c.contact.normal.into_inner() * m, c.contact.depth));
                // console_log!("contact {:?}", contact);
                (h_other, contact)
            }).collect::<Vec<_>>();

            // I also really wish I didn't need to do this. We need to tag off
            // which edges we've collided with.
            let mut marked = Vec::with_capacity(other_handles.len());
            marked.resize(other_handles.len(), false);

            // if other_handles.len() > 0 {
            //     console_log!("velocity {}", v_dist(orig_vel));
            //     console_log!("checking against other handles {:?}", other_handles);
            //     for (h, _) in other_handles.iter() {
            //         let co2 = self.world.collision_object(*h).unwrap();
            //         let pos2 = co2.position();
            //         let shape2 = co2.shape();
            //         console_log!("distance to {}: {:?}", h.0, query::distance(
            //             &pos, shape.as_ref(),
            //             pos2, shape2.as_ref()
            //         ));

            //     }
            // }

            // First we'll go through and pre-process all the existing contacts.
            // TODO: Clean this up - move this code above.
            for (_other_handle, contact) in other_handles.iter() {
                if let Some((normal, depth)) = contact {
                    if *depth > -EPSILON {
                        let tangent = v_perp(*normal);
                        if normal.dot(&orig_vel) <= 0.0 { // same as &vel here.
                            // Moving away.
                            let vel_dot = -tangent.dot(&orig_vel);
                            if vel_dot > 0.0 { min_pos_vdot = vel_dot.max(min_pos_vdot); }
                            else { max_neg_vdot = vel_dot.min(max_neg_vdot); }
                            // console_log!("moving away from {} +:{} -:{}", other_handle.0, min_pos_vdot, max_neg_vdot);
                        }
                    }
                }
            }
            for (_other_handle, contact) in other_handles.iter() {
                if let Some((normal, depth)) = contact {
                    if *depth > -EPSILON {
                        // The normal points in to the object.
                        // console_log!("2: normal {:?} depth {}", normal, depth);

                        let tangent = v_perp(*normal);
                        let vel_dot = tangent.dot(&orig_vel);
                        
                        // We're moving toward the object.
                        if normal.dot(&vel) >= 0.0 { // vel or orig_vel??
                            // console_log!("moving toward {}", normal.dot(&vel));
                            if vel_dot > 0.0 && vel_dot < min_pos_vdot {
                            // if vel_dot > 0.0 && vel_dot > -min_pos_vdot {
                                // console_log!("x {} {}", vel_dot, min_pos_vdot);
                                vel = Vector::zeros();
                                break;
                            } else if vel_dot < 0.0 && vel_dot > max_neg_vdot {
                            // } else if vel_dot < 0.0 && vel_dot < -max_neg_vdot {
                                // console_log!("y {} {}", vel_dot, min_pos_vdot);
                                vel = Vector::zeros();
                                break;
                            } else {
                                vel = tangent * vel_dot;
                                // console_log!("->    : pos {:?} vel {:?} t {:?}", pos, vel, t_remaining);

                                // console_log!("deflect_sign {:?} {}", deflect_sign, vel_dot);
                                if let Some(deflect_sign) = deflect_sign {
                                    if deflect_sign != (vel_dot < 0.0) {
                                        // We've hit the bottom of a V wall. Stop.
                                        // console_log!("bottom of v well. Stopping movement");
                                        vel = Vector::zeros();
                                        break;
                                    }
                                } else {
                                    deflect_sign = Some(vel_dot < 0.0);
                                }
                            }
                        }
                    }
                }
            }



            let mut iterations = 0;

            // TODO: Consider also adding a max iteration count here.
            while t_remaining > 0.001 && v_d2(vel) > EPSILON { // And non-zero velocity?
                // 1. Find the first object we collide with.
                let mut first_collide = None;
                let mut collide_at = t_remaining;
                let mut idx = 0;

                for (i, (other_handle, contact)) in other_handles.iter().enumerate() {
                // for (other_handle, contact) in other_handles.iter() {
                    if marked[i] { continue; }
                    if let Some((_normal, depth)) = contact {
                        if *depth >= -EPSILON { continue; } // Looked at these above.
                    }

                    let co2 = self.world.collision_object(*other_handle).unwrap();
                    let pos2 = co2.position();
                    let shape2 = co2.shape();

                    // For now, everything we might collide with is static. So
                    // we'll predict off that assumption.
                    if let Some(time) = query::time_of_impact(
                        &pos, &vel, shape.as_ref(),
                        pos2, &Vector::zeros(), shape2.as_ref())
                    {
                        if time < collide_at {
                            collide_at = time;
                            first_collide = Some((other_handle, contact));
                            idx = i;
                        }
                    }
                }
                // console_log!("first collide {:?} at {}", first_collide, collide_at);

                match first_collide {
                    None => {
                        // Great! No collision. We can just move forward by the requested amount.
                        // pos = pos * Isometry::new(vel, 0.0);
                        pos.append_translation_mut(&Translation::from(vel));
                        break;
                    },
                    Some((other_handle, contact)) => {
                        // other_handles[idx] = other_handles.pop().unwrap();
                        marked[idx] = true;

                        let co2 = self.world.collision_object(*other_handle).unwrap();
                        let pos2 = co2.position();
                        let shape2 = co2.shape();
                        // We're going to hit this object. First we need the
                        // collision normal. Sadly time_of_impact doesn't return
                        // it, so we'll need to recaculate the collision.
                        
                        // Also for some reason the final parameter of contact
                        // is ignored in some situations - hence * 1.001 to make
                        // sure we intersect.
                        if let Some((normal, _depth)) = contact /*query::contact(
                            &(Isometry::new(vel * (collide_at * 1.001), 0.0) * pos), shape.as_ref(),
                            pos2, shape2.as_ref(),
                            0.01)*/
                        {
                            // Let the object move forward to this point. Trim t_remaining. Project velocity.
                            // console_log!("before: pos {:?} vel {:?} t {} ct {} norm {:?} depth {}", pos.translation, vel, t_remaining, collide_at, normal, depth);

                            // Move to the contact
                            let delta_pos = vel * collide_at; //- contact.normal.as_ref() * 0.001;
                            pos.append_translation_mut(&Translation::from(delta_pos));
                            t_remaining -= collide_at;

                            // Figure out where to go from here
                            let tangent = v_perp(*normal);
                            let vel_dot = tangent.dot(&orig_vel);

                            if vel_dot > 0.0 && vel_dot < min_pos_vdot { vel = Vector::zeros(); }
                            else if vel_dot < 0.0 && vel_dot > max_neg_vdot { vel = Vector::zeros(); }
                            else { vel = tangent * vel_dot; }
                            // console_log!("->    : pos {:?} vel {:?} t {:?}", pos.translation, vel, t_remaining);

                            if let Some(deflect_sign) = deflect_sign {
                                if deflect_sign != (vel_dot < 0.0) {
                                    // We've hit the bottom of a V wall. Stop.
                                    // console_log!("bottom of v well. Stopping movement");
                                    break;
                                    // vel = Vector::zeros();
                                }
                            } else {
                                deflect_sign = Some(vel_dot < 0.0);
                            }
                        } else {
                            // What happens? Should we quietly ignore this?
                            console_warn!("Else pos {:?} vel {:?} pos2 {:?} t {}", pos.translation, vel, pos2.translation, collide_at);
                            console_warn!("distance {:?}", query::distance(
                                &(Isometry::new(vel * collide_at, 0.0) * pos), shape.as_ref(),
                                pos2, shape2.as_ref()
                            ));
                            console_warn!("time of impact {:?}", query::time_of_impact(
                                &pos, &vel, shape.as_ref(),
                                pos2, &Vector::zeros(), shape2.as_ref()));
                            panic!("No contact found");
                        }
                    }
                }
                // console_log!("t_remaining -> {}", t_remaining);

                // if other_handles.len() > 0 {
                //     console_log!("v {:?} -> ({:?})", vel, pos);
                // }

                iterations += 1;
                if iterations > 20 {
                    // This can happen if two objects are epsilon apart - we jitter forever between them, trying to move.
                    // console_log!("pos {:?} v {:?} t {} collide_at {}", pos.translation, vel, t_remaining, collide_at);
                    // panic!("Cannot figure out a good object position")
                    console_log!("Stuck - cannot figure out a good object position");
                    break
                }

                // marked[idx] = true;
            }
        } else {
            // We never seem to get here. Should be fine, but not tested.
            console_log!("B");
            pos.append_translation_mut(&Translation::from(vel));
        }

        self.world.set_position(handle, pos);

        // TODO: Return result, and return the normal
        vec![pos.translation.x, pos.translation.y, pos.rotation.angle()].into_boxed_slice()
    }

    pub fn update(&mut self) -> Box<[f64]> {
        self.world.update();

        // And fix any objects which are actually intersecting. This should only
        // be possible if the moving object is not a circle.
        let mut result = Vec::<f64>::new();

        let pairs = self.world.contact_pairs(true).filter_map(|(h1, h2, _a, manifold)| {
            let c1 = self.world.collision_object(h1).unwrap();
            let c2 = self.world.collision_object(h2).unwrap();

            let (h, id, mut pos, m) = if c1.data().e_type == CGroup::Static {
                (h2, c2.data().id, c2.position().clone(), 1.0)
            } else {
                (h1, c1.data().id, c1.position().clone(), -1.0)
            };
            let deepest = manifold.deepest_contact().unwrap();

            // This is the delta we need to move by to make the object no longer
            // colliding. This teleports it straight out - but it might be
            // better to move it by a small amount each frame instead.
            let depth = deepest.contact.depth;
            if depth > EPSILON {
                let delta = (deepest.contact.depth + 0.01) * m * deepest.contact.normal.into_inner();
                pos.append_translation_mut(&Translation::from(delta));
                Some((h, id, pos))
            } else { None }
        }).collect::<Vec<_>>(); // I hate making this copy.

        for (h, id, new_pos) in pairs.iter() {
            self.world.set_position(*h, *new_pos);

            // And tell the JS code about the change.
            result.push(*id as f64);
            result.push(new_pos.translation.x);
            result.push(new_pos.translation.y);
        }

        result.into_boxed_slice()
    }

    // This is edge triggering collisions. There are some instances where this
    // isn't ideal - but I'll cross that bridge when I get to it.
    pub fn proximity_events(&self) -> Box<[u32]> {
        let mut result = Vec::<u32>::new();

        for evt in self.world.proximity_events() {
            if evt.new_status == query::Proximity::Intersecting {
                let c1 = self.world.collision_object(evt.collider1).unwrap();
                let c2 = self.world.collision_object(evt.collider2).unwrap();

                result.push(c1.data().id as u32);
                result.push(c2.data().id as u32);
            }
        }

        result.into_boxed_slice()
    }

    pub fn print_events(&self) {
        for evt in self.world.proximity_events() {
            console_log!("Prox event {:?}", evt);
        }
        for evt in self.world.contact_events() {
            console_log!("Contact event {:?}", evt);
        }
    }
}