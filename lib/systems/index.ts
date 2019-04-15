import { Entities } from "../components/entities";
import { localController, behaviour } from "./behaviour";

// export interface System {
//   update(): void
// }

// A system is just a function that gets called every tick on a set of entities
export type System = (entities: Entities) => void

const systems: System[] = [
  localController,
  behaviour,
]

export default systems