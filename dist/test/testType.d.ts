import { Model } from '../src/model';
import { Relationship } from '../src/relationship';
export declare class Children extends Relationship {
    static schema: {
        sides: {
            parents: {
                otherType: string;
                otherName: string;
            };
            children: {
                otherType: string;
                otherName: string;
            };
        };
        storeData: {
            sql: {
                tableName: string;
                joinFields: {
                    parents: string;
                    children: string;
                };
            };
        };
    };
}
export declare class ValenceChildren extends Relationship {
    static schema: {
        sides: {
            valenceParents: {
                otherType: string;
                otherName: string;
            };
            valenceChildren: {
                otherType: string;
                otherName: string;
            };
        };
        storeData: {
            sql: {
                tableName: string;
                joinFields: {
                    valenceParents: string;
                    valenceChildren: string;
                };
            };
        };
        extras: {
            perm: {
                type: string;
            };
        };
    };
}
export declare class QueryChildren extends Relationship {
    static schema: {
        sides: {
            queryParents: {
                otherType: string;
                otherName: string;
            };
            queryChildren: {
                otherType: string;
                otherName: string;
            };
        };
        storeData: {
            sql: {
                tableName: string;
                joinFields: {
                    queryParents: string;
                    queryChildren: string;
                };
                joinQuery: {
                    queryParents: string;
                    queryChildren: string;
                };
                where: {
                    queryParents: string;
                    queryChildren: string;
                };
            };
        };
        $extras: {
            perm: {
                type: string;
            };
        };
    };
}
export declare class TestType extends Model {
    static typeName: string;
    static schema: {
        name: string;
        idAttribute: string;
        attributes: {
            id: {
                type: string;
                readOnly: boolean;
            };
            name: {
                type: string;
                readOnly: boolean;
            };
            otherName: {
                type: string;
                default: string;
                readOnly: boolean;
            };
            extended: {
                type: string;
                default: {};
                readOnly: boolean;
            };
        };
        relationships: {
            children: {
                type: typeof Children;
            };
            parents: {
                type: typeof Children;
            };
            valenceChildren: {
                type: typeof ValenceChildren;
            };
            valenceParents: {
                type: typeof ValenceChildren;
            };
            queryChildren: {
                type: typeof QueryChildren;
                readOnly: boolean;
            };
            queryParents: {
                type: typeof QueryChildren;
                readOnly: boolean;
            };
        };
        storeData: {
            sql: {
                tableName: string;
                bulkQuery: string;
            };
        };
    };
}
