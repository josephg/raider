import { Entities } from "./components/entities";
import systems from "./systems";

export default function update(es: Entities) {
  const dt = 1/60 // TODO.

  for (const system of systems) {
    system(es)
  }
}