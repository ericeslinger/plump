export declare namespace Interfaces {
    interface StringIndexed<T> {
        [index: string]: T;
    }
    interface NumericIDed {
        id: number;
    }
    type Attribute = number | string | boolean | Date | string[];
    type Attributes = StringIndexed<Attribute>;
    interface RelationshipSchema {
        sides: StringIndexed<{
            otherType: string;
            otherName: string;
        }>;
        extras?: StringIndexed<any>;
        storeData?: {
            sql?: {
                tableName: string;
                joinFields: StringIndexed<string>;
            };
        } & StringIndexed<any>;
    }
    interface RelationshipItem {
        id: number | string;
        meta?: StringIndexed<number | string>;
    }
    interface RelationshipDelta {
        op: 'add' | 'modify' | 'remove';
        data: {
            id: number | string;
            meta: StringIndexed<number | string>;
        };
    }
    interface FieldMeta {
        type: string | {
            schema: RelationshipSchema;
        };
        readOnly?: boolean;
        default?: any;
    }
    interface AttributeMeta extends FieldMeta {
        type: 'number' | 'string' | 'boolean' | 'date' | 'array' | 'object';
    }
    interface RelationshipMeta extends FieldMeta {
        type: {
            schema: RelationshipSchema;
        };
    }
    interface ModelSchema {
        idAttribute: string;
        name: string;
        attributes: StringIndexed<AttributeMeta>;
        relationships: StringIndexed<RelationshipMeta>;
        storeData?: StringIndexed<any> & {
            sql?: {
                bulkQuery: string;
                tableName: string;
            };
        };
    }
    interface ModelReference {
        type: string;
        id: number | string;
    }
    interface ModelData {
        type: string;
        id?: number | string;
        attributes?: StringIndexed<Attribute>;
        relationships?: StringIndexed<RelationshipItem[]>;
    }
    interface ModelDelta extends ModelData {
        invalidate: string[];
    }
    interface DirtyValues {
        attributes?: StringIndexed<Attribute>;
        relationships?: StringIndexed<RelationshipDelta[]>;
    }
}
