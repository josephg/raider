import { Entities, Entity } from "../components/entities";
import { localController, behaviour } from "./behaviour";
import System from './system'
import {collisionSystem, simpleMovement} from "./space";
import lifetime from "./lifetime";

const systems: System[] = [
  localController,
  behaviour,

  // These must be after behaviour, so dx/dy can be applied.
  simpleMovement,
  collisionSystem,
  lifetime,
]

export default systems