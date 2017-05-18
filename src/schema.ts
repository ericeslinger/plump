import { ModelSchema, ModelData } from './dataTypes';
export function Schema(s: ModelSchema) {
  return function annotate(target: any) {
    target.typeName = s.name;
    target.schema = s;
    return target;
  };
}
