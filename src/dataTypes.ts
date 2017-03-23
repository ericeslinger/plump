
export interface StringIndexed<T> {
  [index: string]: T,
}

export interface NumericIDed {
  $id: number,
}

export type Attribute = number | string | boolean | Date | string[];
export type Attributes = StringIndexed<Attribute>;

export interface RelationshipSchema {
  sides: StringIndexed<{otherType: string, otherName: string}>,
  storeData: any,
  extras: StringIndexed<any>,
}

export interface RelationshipItem {
  id: number | string,
  meta?: StringIndexed<number | string>,
}

export interface RelationshipDelta {
  op: 'add' | 'modify' | 'remove',
  data: {
    id: number | string,
    meta: StringIndexed<number | string>,
  }
}

export interface FieldMeta {
  type: string | RelationshipSchema,
  readOnly: boolean,
  default?: any,
}

export interface AttributeMeta extends FieldMeta {
  type: 'number' | 'string' | 'boolean' | 'date' | 'array',
  default?: number | string | boolean | Date | string[],
}

export interface RelationshipMeta extends FieldMeta {
  type: RelationshipSchema,
}

export interface ModelSchema {
  $id: string,
  attributes: StringIndexed<AttributeMeta>,
  relationships: StringIndexed<RelationshipMeta>,
}

export interface ModelReference {
  type: string,
  id: number | string,
}

export interface ModelData {
  type: string,
  id?: number | string,
  attributes?: StringIndexed<Attribute>,
  relationships?: StringIndexed<RelationshipItem[]>,
}

export interface ModelDelta extends ModelData {
  invalidate: string[],
}

export interface DirtyValues {
  attributes?: StringIndexed<Attribute>,
  relationships?: StringIndexed<RelationshipDelta[]>
}
