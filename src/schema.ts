import { ModelSchema } from './dataTypes';
export function schema(s: ModelSchema) {
  return function annotate(target: any) {
    target.typeName = s.name;
    target.schema = s;
    return target;
  };
};
