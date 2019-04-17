import { Entities, Entity } from "../components/entities";
import { localController, behaviour } from "./behaviour";
import System from './system'
import spaceSystem from "./space";

const systems: System[] = [
  localController,
  behaviour,
  spaceSystem,
]

export default systems