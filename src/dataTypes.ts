export interface StringIndexed<T> {
  [index: string]: T;
}

export type Attribute = number | string | boolean | Date | string[] | number[] | object;

export interface RelationshipSchema {
  sides: StringIndexed<{otherType: string, otherName: string}>;
  extras?: StringIndexed<any>;
  storeData?: {
    sql?: {
      tableName: string;
      joinFields: StringIndexed<string>,
      joinQuery?: StringIndexed<string>,
      where?: StringIndexed<string>,
    },
  } & StringIndexed<any>;
}

export interface RelationshipItem {
  id: number | string;
  meta?: StringIndexed<number | string>;
}

export interface RelationshipDelta {
  op: 'add' | 'modify' | 'remove';
  data: RelationshipItem;
}

export interface ModelSchema {
  idAttribute: string;
  name: string;
  attributes: {
    [attrName: string]:
      // prepending this with {readOnly?: boolean} & also works
      // but it depends on AFAIK-undocumented order-of-operations
      // stuff in typescript, so I'm leaving it more verbose
      // for now
      { type: 'number', default?: number, readOnly?: boolean} |
      { type: 'string', default?: string, readOnly?: boolean} |
      { type: 'boolean', default?: boolean, readOnly?: boolean} |
      { type: 'date', default?: Date, readOnly?: boolean} |
      { type: 'array', default?: string[] | number[], readOnly?: boolean } |
      { type: 'object', default?: object, readOnly?: boolean}
  };
  relationships: {
    [relName: string]: {
      type: RelationshipSchema,
      readOnly?: boolean,
    },
  };
  storeData?: StringIndexed<any> & {
    sql?: {
      bulkQuery?: string;
      tableName: string;
      singleQuery?: string;
    },
  };
}

export interface ModelReference {
  typeName: string;
  id: number | string;
}

export interface IndefiniteModelData {
  typeName: string;
  id?: number | string;
  attributes?: StringIndexed<Attribute>;
  relationships?: StringIndexed<RelationshipItem[]>;
}

export interface ModelData extends IndefiniteModelData {
  id: number | string;
}

export interface ModelDelta extends ModelData {
  invalidate: string[];
}

export interface DirtyValues {
  attributes?: StringIndexed<Attribute>;
  relationships?: StringIndexed<RelationshipDelta[]>;
}

export interface DirtyModel extends DirtyValues {
  id?: string | number;
  typeName: string;
}
