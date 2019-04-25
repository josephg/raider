import System from './system'
import { eachEntity } from '../components/entities';

const lifetime: System = {
  pred: e => e.lifetime != null,
  update(es) {
    for (const e of eachEntity(es, this.pred)) {
      if (--e.lifetime! <= 0) e.reap = true
    }
  },
}
export default lifetime