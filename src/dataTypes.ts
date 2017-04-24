import { Observable } from 'rxjs/Rx';

export interface StringIndexed<T> {
  [index: string]: T;
}

export type Attribute = number | string | boolean | Date | string[] | number[] | any;

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

export interface StorageOptions {
  terminal?: boolean;
}

export interface BaseStore {
  terminal: boolean;
  read$: Observable<ModelData>;
  write$: Observable<ModelDelta>;
  readRelationship(value: ModelReference, relName: string): Promise<ModelData>;
  readAttributes(value: ModelReference): Promise<ModelData>;
  getSchema(t: {schema: ModelSchema} | ModelSchema | string): ModelSchema;
  addSchema(t: {typeName: string, schema: ModelSchema}): Promise<void>;
  addSchemas(t: {typeName: string, schema: ModelSchema}[]): Promise<void>;
  validateInput(value: ModelData | IndefiniteModelData): typeof value;
  read(item: ModelReference, opts: string | string[]): Promise<ModelData>;
}


export interface CacheStore extends BaseStore {
  cache(value: ModelData): Promise<ModelData>;
  cacheAttributes(value: ModelData): Promise<ModelData>;
  cacheRelationship(value: ModelData): Promise<ModelData>;
  wipe(value: ModelReference, key?: string | string[]): void;
  hot(value: ModelReference): boolean;
}

export interface TerminalStore extends BaseStore {
  writeAttributes(value: IndefiniteModelData): Promise<ModelData>;
  delete(value: ModelReference): Promise<void>;
  fireReadUpdate(val: ModelData);
  fireWriteUpdate(val: ModelDelta);
  writeRelationshipItem( value: ModelReference, relName: string, child: {id: string | number} ): Promise<ModelData>;
  deleteRelationshipItem( value: ModelReference, relName: string, child: {id: string | number} ): Promise<ModelData>;
  query(q: any): Promise<ModelReference[]>;
  bulkRead(value: ModelReference): Promise<ModelData>;
}
export interface AllocatingStore extends TerminalStore {
  allocateId(typeName: string): Promise<string | number>;
}

export interface ModelAttributesSchema {
  [attrName: string]:
    // prepending this with {readOnly?: boolean} & also works
    // but it depends on AFAIK-undocumented order-of-operations
    // stuff in typescript, so I'm leaving it more verbose
    // for now
    { type: 'number', default?: number, readOnly?: boolean } |
    { type: 'string', default?: string, readOnly?: boolean } |
    { type: 'boolean', default?: boolean, readOnly?: boolean } |
    { type: 'date', default?: Date, readOnly?: boolean } |
    { type: 'array', default?: string[] | number[], readOnly?: boolean  } |
    { type: 'object', default?: object, readOnly?: boolean }
}

export interface ModelSchema {
  idAttribute: string;
  name: string;
  attributes: ModelAttributesSchema;
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
  included?: ModelData[];
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
