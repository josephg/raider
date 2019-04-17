use wasm_bindgen::prelude::*;
// use nalgebra as na;
use ncollide2d::world::*;
use ncollide2d::shape::*;
use ncollide2d::math::*;
use ncollide2d::query::*;
use ncollide2d::events::*;
use ncollide2d::bounding_volume;

// use web_sys::console;
// use na::{Vector2};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

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

    pub fn add(&mut self, x: f64, y: f64, shape: LocalShapeHandle, cgroup: CGroup) -> usize {
        let pos = Isometry::new(Vector::new(x, y), 0.0);

        let cg = match cgroup {
            CGroup::Static => self.static_groups,
            CGroup::Player => self.player_groups,
        };

        let obj = self.world.add(
            pos,
            shape.0,
            cg,
            GeometricQueryType::Contacts(0.0, 0.0),
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

    pub fn update(&mut self) {
        self.world.update();
    }

    pub fn contact_events(&self) -> Box<[u32]> {
        let mut result = Vec::<u32>::new();

        // I'm sure there's a more idiomatic way to write this...
        for evt in self.world.contact_events() {
            let (t, h1, h2) = match evt {
                ContactEvent::Started(h1, h2) => (0, h1, h2),
                ContactEvent::Stopped(h1, h2) => (1, h1, h2),
            };

            result.push(t);
            result.push(h1.0 as u32);
            result.push(h2.0 as u32);
        }
        
        result.into_boxed_slice()
    }

    pub fn get_contact(&self, h1: usize, h2: usize) {
        let c1 = self.world.collision_object(CollisionObjectHandle(h1)).unwrap();
        let c2 = self.world.collision_object(CollisionObjectHandle(h2)).unwrap();

        let c = contact(
            c1.position(),
            c1.shape().as_ref(),
            c2.position(),
            c2.shape().as_ref(),
            0.0
        );

        console_log!("contact {:?}", c);
    }
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