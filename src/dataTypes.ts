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
  meta?: StringIndexed<number | string | boolean>;
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

export interface GenericSchemaFieldSchema {
  type: any;
  default?: any;
  readOnly?: boolean;
}

export interface GenericAttributeFieldSchema extends GenericSchemaFieldSchema {
  type: string;
}

export interface NumberAttributeFieldSchema extends GenericAttributeFieldSchema {
  type: 'number';
  default?: number;
}

export interface StringAttributeFieldSchema extends GenericAttributeFieldSchema {
  type: 'string';
  default?: string;
}

export interface BooleanAttributeFieldSchema extends GenericAttributeFieldSchema {
  type: 'boolean';
  default?: boolean;
}

export interface DateAttributeFieldSchema extends GenericAttributeFieldSchema {
  type: 'date';
  default?: Date;
}

export interface ArrayAttributeFieldSchema extends GenericAttributeFieldSchema {
  type: 'array';
  default?: string[] | number[];
}

export interface ObjectAttributeFieldSchema extends GenericAttributeFieldSchema {
  type: 'object';
  default?: object;
}

export type AttributeFieldSchema =
  NumberAttributeFieldSchema |
  StringAttributeFieldSchema |
  BooleanAttributeFieldSchema |
  DateAttributeFieldSchema |
  ArrayAttributeFieldSchema |
  ObjectAttributeFieldSchema;

export interface RelationshipFieldSchema extends GenericSchemaFieldSchema {
  type: RelationshipSchema;
}

export interface ReadOnlyFieldSchema extends GenericSchemaFieldSchema {
  readOnly: true;
}

export type ModelRelationshipsSchema = StringIndexed<RelationshipFieldSchema>;
export type ModelAttributesSchema = StringIndexed<AttributeFieldSchema>

export interface ModelSchema {
  idAttribute: string;
  name: string;
  attributes: ModelAttributesSchema;
  relationships: ModelRelationshipsSchema;
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
