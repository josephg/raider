use wasm_bindgen::prelude::*;
// use nalgebra as na;
use ncollide2d::world::*;
use ncollide2d::shape::*;
use ncollide2d::math::*;
use ncollide2d::query;
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

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    console_log!("Hello, {}!", name);
    // alert(&format!("Hello, {}!", name));
}

// #[wasm_bindgen(start)]
#[wasm_bindgen]
pub fn init() {
    // Adds 30k to bundle size
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}


#[wasm_bindgen]
#[derive(Debug)]
pub enum MyEnum {
    Bar, Zot
}

#[wasm_bindgen]
pub fn take_enum(f: MyEnum) {
    console_log!("f {:?}", f);
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
pub enum CGroup {
    Static,
    Player,
}

#[wasm_bindgen]
pub struct World {
    world: CollisionWorld<f64, ()>,

    static_groups: CollisionGroups,
    player_groups: CollisionGroups,
}

const STATIC_GROUP: usize = 0;
const PLAYERS_GROUP: usize = 1;

#[wasm_bindgen]
impl World {
    pub fn new() -> World {
        World {
            world: CollisionWorld::<f64, ()>::new(0.02),
            static_groups: CollisionGroups::new()
                .with_membership(&[STATIC_GROUP])
                .with_blacklist(&[STATIC_GROUP]),
            player_groups: CollisionGroups::new()
                .with_membership(&[PLAYERS_GROUP])
                .with_whitelist(&[STATIC_GROUP]) // Players don't self-collide.
        }
    }

    pub fn add(&mut self, x: f64, y: f64, a: f64, shape: LocalShapeHandle, cgroup: CGroup, linear_speed: f64) -> usize {
        let pos = Isometry::new(Vector::new(x, y), a);

        let cg = match cgroup {
            CGroup::Static => self.static_groups,
            CGroup::Player => self.player_groups,
        };
        let prox = match cgroup {
            CGroup::Static => GeometricQueryType::Proximity(0.0),
            // CGroup::Static => GeometricQueryType::Contacts(0.0, 0.0),
            CGroup::Player => GeometricQueryType::Contacts(linear_speed, 0.0),
        };

        let obj = self.world.add(
            pos,
            shape.0,
            cg,
            prox,
            ()
        );

        obj.handle().0
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
        let mut vel = Vector::new(vx, vy);
        // let mut vnorm = vel.normalize();
        // let velIso = Isometry::new(vel, va);
        let co = self.world.collision_object(handle).unwrap();
        let mut pos = co.position().clone();
        let shape = co.shape();
        let mut t_remaining = 1.0;
        if let Some(iter) = self.world.proximities_with(handle, false) {
            // We need to run through the proximities a few times. This is a bit
            // inefficient - the list will almost always only have one element.
            // As always, it'd be nice to have a vec-ish type which has a hot
            // path for 1 element.
            let other_handles = iter.map(|(h1, h2, _alg)| {
                if h1 == handle {h2} else {h1}
            }).collect::<Vec<_>>();

            // if other_handles.len() > 0 {
            //     console_log!("checking against other handles {:?}", other_handles);
            // }

            while t_remaining > 0.001 { // And non-zero velocity?
                // 1. Find the first object we collide with.
                let mut first_collide = None;
                let mut collide_at = t_remaining;

                for other_handle in other_handles.iter() {
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
                            first_collide = Some(other_handle);
                        }
                    }
                }

                match first_collide {
                    None => {
                        // Great! No collision. We can just move forward by the requested amount.
                        pos = pos * Isometry::new(vel, va);
                        break;
                    },
                    Some(other_handle) => {
                        let co2 = self.world.collision_object(*other_handle).unwrap();
                        let pos2 = co2.position();
                        let shape2 = co2.shape();
                        // We're going to hit this object. First we need the
                        // collision normal. Sadly time_of_impact doesn't return
                        // it, so we'll need to recaculate the collision.
                        if let Some(contact) = query::contact(
                            &(pos * Isometry::new(vel * (collide_at * 1.001), 0.0)), shape.as_ref(),
                            pos2, shape2.as_ref(),
                            0.01)
                        {
                            // Let the object move forward to this point. Trim t_remaining. Project velocity.
                            // console_log!("before: pos {:?} vel {:?} t {} ct {} norm {:?}", pos, vel, t_remaining, collide_at, contact.normal);
                            pos = pos * Isometry::new(vel * collide_at - contact.normal.as_ref() * 0.001, 0.0);
                            t_remaining -= collide_at;
                            let tangent = v_perp(contact.normal.into_inner());
                            vel = tangent * tangent.dot(&vel);
                            // console_log!("->    : pos {:?} vel {:?} t {:?}", pos, vel, t_remaining);
                        } else {
                            // What happens? Should we quietly ignore this?
                            console_log!("Else pos {:?} vel {:?} pos2 {:?} t {}", pos, vel, pos2, collide_at);
                            console_log!("distance {:?}", query::distance(
                                &(pos * Isometry::new(vel * collide_at, 0.0)), shape.as_ref(),
                                pos2, shape2.as_ref()
                            ));
                            panic!("No contact found");
                        }
                    }
                }
                // console_log!("t_remaining -> {}", t_remaining);

                // if other_handles.len() > 0 {
                //     console_log!("v {:?} -> ({:?})", vel, pos);
                // }
            }
        } else {
            pos = pos * Isometry::new(vel, 0.0);
        }

        self.world.set_position(handle, pos);

        // TODO: Return result, and return the normal
        vec![pos.translation.x, pos.translation.y].into_boxed_slice()
    }

    pub fn update(&mut self) {
        self.world.update();
    }

    pub fn contact_pairs(&self) -> Box<[f64]> {
        let mut result = Vec::<f64>::new();

        for (h1, h2, _algorithm, manifold) in self.world.contact_pairs(true) {
            let deepest = manifold.deepest_contact().unwrap();
            result.push(h1.0 as f64);
            result.push(h2.0 as f64);

            result.push(deepest.contact.normal[0]);
            result.push(deepest.contact.normal[1]);
            result.push(deepest.contact.depth);
        }

        result.into_boxed_slice()
    }

    pub fn prox_events(&self) {
        for evt in self.world.proximity_events() {
            console_log!("Prox event {:?}", evt);
        }
    }

    // pub fn contact_events(&self) -> Box<[u32]> {
    //     let mut result = Vec::<u32>::new();

    //     // I'm sure there's a more idiomatic way to write this...
    //     for evt in self.world.contact_events() {
    //         let (t, h1, h2) = match evt {
    //             ContactEvent::Started(h1, h2) => (0, h1, h2),
    //             ContactEvent::Stopped(h1, h2) => (1, h1, h2),
    //         };

    //         result.push(t);
    //         result.push(h1.0 as u32);
    //         result.push(h2.0 as u32);
    //     }
        
    //     result.into_boxed_slice()
    // }

    // pub fn get_contact(&self, h1: usize, h2: usize) -> Box<[f64]> {
    //     let c1 = self.world.collision_object(CollisionObjectHandle(h1)).unwrap();
    //     let c2 = self.world.collision_object(CollisionObjectHandle(h2)).unwrap();

    //     let c = contact(
    //         c1.position(),
    //         c1.shape().as_ref(),
    //         c2.position(),
    //         c2.shape().as_ref(),
    //         0.0
    //     );

    //     // console_log!("contact {:?}", c);
    //     if let Some(c) = c {
    //         vec![
    //             c.world1[0], c.world1[1],
    //             c.world2[0], c.world2[1],
    //             c.normal[0], c.normal[1],
    //             c.depth
    //         ].into_boxed_slice()
    //     } else {
    //         Box::new([])
    //     }

    // }
}


// #[wasm_bindgen]
// pub fn list() -> Box<[JsValue]> {
//     vec![JsValue::NULL, JsValue::from_f64(123.0)].into_boxed_slice()
// }

// #[wasm_bindgen]
// pub fn stuff() {
//     let mut world = CollisionWorld::<f64, ()>::new(0.02);
//     let b1 = Ball::new(1.0);
//     let b2 = Ball::new(1.0);
//     let b1_pos = Isometry::new(Vector::new(0.5, 1.0), 0.0);
//     let b2_pos = Isometry::new(Vector::new(0.0, 0.0), 0.0);

//     let aabb1 = bounding_volume::aabb::aabb(&b1, &b1_pos);
//     console_log!("{:?}", aabb1);

//     world.add(b1_pos, ShapeHandle::new(b1), CollisionGroups::new(), GeometricQueryType::Contacts(0.0, 0.0), ());
//     let co = world.add(b2_pos, ShapeHandle::new(b2), CollisionGroups::new(), GeometricQueryType::Contacts(0.0, 0.0), ()).handle();

//     world.update();
//     for evt in world.contact_events() {
//         console_log!("c {:?}", evt);
//         if let ContactEvent::Started(h1, h2) = evt {
//             let c1 = world.collision_object(h1.clone()).unwrap();
//             let c2 = world.collision_object(h2.clone()).unwrap();
//             // let s1 = c1.shape().as_shape::<Ball<f64>>().unwrap();
//             // let c = contact(c1.position(), &Ball::new(1.0), c2.position(), &Ball::new(1.0), 0.0);
//             let c = contact(
//                 c1.position(),
//                 c1.shape().as_ref(),
//                 c2.position(),
//                 c2.shape().as_ref(),
//                 0.0
//             );
//             console_log!("contact {:?}", c);
//         }
//     }
//     for evt in world.proximity_events() {
//         console_log!("p {:?}", evt);
//     }

//     // let x = world.collision_object(co).unwrap().data();
//     world.set_position(co, Isometry::new(Vector::new(-1.0, 0.0), 0.0));

//     world.update();
//     for evt in world.contact_events() {
//         console_log!("c {:?}", evt);
//     }
//     for evt in world.proximity_events() {
//         console_log!("p {:?}", evt);
//     }
// }