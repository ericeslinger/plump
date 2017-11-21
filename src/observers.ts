import { ModelData, ModelReference } from './dataTypes';
import { Plump } from './plump';
import { Observable } from 'rxjs';
import * as deepEqual from 'deep-equal';

export function observeAttribute<T>(
  o: Observable<ModelData>,
  attr: string,
): Observable<T> {
  return o
    .filter(v => !!v)
    .map(v => v.attributes[attr])
    .distinctUntilChanged<T>(deepEqual);
}

export function observeChild(
  o: Observable<ModelData>,
  rel: string,
  plump: Plump,
): Observable<ModelData[]> {
  return observeList(o.filter(v => !!v).map(v => v.relationships[rel]), plump);
}

export function observeList(
  list: Observable<ModelReference[]>,
  plump: Plump,
): Observable<(ModelData)[]> {
  const cache = {};
  return list
    .distinctUntilChanged(deepEqual)
    .map(children => {
      return children.map(item => {
        if (!cache[item.id]) {
          cache[item.id] = plump.find(item);
        }
        cache[item.id].meta = item.meta;
        return cache[item.id];
      });
    })
    .map(refs => {
      return refs.map(ref => {
        return {
          model: ref,
          meta: ref.meta,
        };
      });
    })
    .switchMap(coms => {
      if (!coms || coms.length === 0) {
        return Observable.of([]);
      } else {
        return Observable.combineLatest(
          coms.map(ed =>
            ed.model
              .asObservable(['attributes'])
              .catch(() => Observable.of(ed.model.empty()))
              .map(v => {
                return Object.assign(v, { meta: ed.meta });
              }),
          ),
        ).map(children => children.filter(child => !child.empty));
      }
    })
    .startWith([])
    .shareReplay(1);
}
