import { Entities } from "./components/entities";
import systems from "./systems";

export default function update(es: Entities) {
  const dt = 1/60 // TODO.

  for (const system of systems) {
    system.update(es)
  }
  
  for (const e of es.values()) {
    if (e.reap) {
      for (const system of systems) {
        if (system.onRemoved && system.pred(e)) system.onRemoved(es, e)
      }
      es.delete(e.id)
    }
  }
}