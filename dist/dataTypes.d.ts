export declare namespace Interfaces {
    interface StringIndexed<T> {
        [index: string]: T;
    }
    interface NumericIDed {
        $id: number;
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
        type: string | RelationshipSchema;
        readOnly: boolean;
        default?: any;
    }
    interface ModelSchema {
        idAttribute: string;
        name: string;
        attributes: {
            [attrName: string]: {
                type: string;
                readOnly: boolean;
                default?: any;
            };
        };
        relationships: {
            [relName: string]: {
                type: {
                    schema: RelationshipSchema;
                };
                readOnly?: boolean;
            };
        };
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
