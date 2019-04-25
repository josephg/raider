# Game

At the moment this is just a little proof-of-concept for an ECS-style game environment.

[Play](https://home.seph.codes/public/game/) (WASD controls).

- Behaviour is handled by ES6 generator functions. One yield = one frame, which makes for a much more programatic way to implement decision trees
- Collision detection is handled using by the rust [ncollide](https://www.ncollide.org/) library, compiled via wasm.

# License

ISC