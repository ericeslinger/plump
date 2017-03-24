import * as mergeOptions from 'merge-options';

import { ModelData, IndefiniteModelData, ModelSchema } from './dataTypes';

export function validateInput(schema: ModelSchema, value: IndefiniteModelData): ModelData {
  const retVal = { typeName: value.typeName, id: value.id, attributes: {}, relationships: {} };
  const typeAttrs = Object.keys(schema.attributes || {});
  const valAttrs = Object.keys(value.attributes || {});
  const typeRels = Object.keys(schema.relationships || {});
  const valRels = Object.keys(value.relationships || {});

  const invalidAttrs = valAttrs.filter(item => typeAttrs.indexOf(item) < 0);
  const invalidRels = valRels.filter(item => typeRels.indexOf(item) < 0);

  if (invalidAttrs.length > 0) {
    throw new Error(`Invalid attributes on value object: ${JSON.stringify(invalidAttrs)}`);
  }

  if (invalidRels.length > 0) {
    throw new Error(`Invalid relationships on value object: ${JSON.stringify(invalidRels)}`);
  }


  for (const attrName in schema.attributes) {
    if (!value.attributes[attrName] && (schema.attributes[attrName].default !== undefined)) {
      if (Array.isArray(schema.attributes[attrName].default)) {
        retVal.attributes[attrName] = schema.attributes[attrName].default.concat();
      } else if (typeof schema.attributes[attrName].default === 'object') {
        retVal.attributes[attrName] = Object.assign({}, schema.attributes[attrName].default);
      } else {
        retVal.attributes[attrName] = schema.attributes[attrName].default;
      }
    }
  }

  for (const relName in schema.relationships) {
    if (value.relationships && value.relationships[relName] && !Array.isArray(value.relationships[relName])) {
      throw new Error(`relation ${relName} is not an array`);
    }
  }
  return mergeOptions({}, value, retVal);
}
