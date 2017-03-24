
export interface StringIndexed<T> {
  [index: string]: T;
}

export interface NumericIDed {
  $id: number;
}

export type Attribute = number | string | boolean | Date | string[];
export type Attributes = StringIndexed<Attribute>;

export interface RelationshipSchema {
  sides: StringIndexed<{otherType: string, otherName: string}>;
  extras?: StringIndexed<any>;
  storeData?: {
    sql?: {
      tableName: string;
      joinFields: StringIndexed<string>,
    },
  } & StringIndexed<any>;
}

export interface RelationshipItem {
  id: number | string;
  meta?: StringIndexed<number | string>;
}

export interface RelationshipDelta {
  op: 'add' | 'modify' | 'remove';
  data: {
    id: number | string,
    meta: StringIndexed<number | string>,
  };
}

export interface FieldMeta {
  type: string | RelationshipSchema;
  readOnly: boolean;
  default?: any;
}

export interface ModelSchema {
  idAttribute: string;
  name: string;
  attributes: {
    [attrName: string]: {
      // type: 'number' | 'string' | 'boolean' | 'date' | 'array' | 'object';
      type: string;
      readOnly: boolean;
      default?: any;
      // default?: number | string | boolean | Date | string[];
    }
  };
  relationships: {
    [relName: string]: {
      type: {schema: RelationshipSchema},
      readOnly?: boolean,
    },
  };
  storeData?: StringIndexed<any> & {
    sql?: {
      bulkQuery: string;
      tableName: string;
    },
  };
}

export interface ModelReference {
  type: string;
  id: number | string;
}

export interface ModelData {
  type: string;
  id?: number | string;
  attributes?: StringIndexed<Attribute>;
  relationships?: StringIndexed<RelationshipItem[]>;
}

export interface ModelDelta extends ModelData {
  invalidate: string[];
}

export interface DirtyValues {
  attributes?: StringIndexed<Attribute>;
  relationships?: StringIndexed<RelationshipDelta[]>;
}
