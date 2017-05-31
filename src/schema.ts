import { ModelSchema } from './dataTypes';
export function Schema(s: ModelSchema) {
  return function annotate(target: any) {
    target.type = s.name;
    target.schema = s;
    return target;
  };
}
