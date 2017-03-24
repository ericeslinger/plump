import { Model } from '../src/model';
import { Relationship } from '../src/relationship';

export class Children extends Relationship {
  static schema = {
    sides: {
      parents: { otherType: 'tests', otherName: 'children' },
      children: { otherType: 'tests', otherName: 'parents' },
    },
    storeData: {
      sql: {
        tableName: 'parent_child_relationship',
        joinFields: {
          parents: 'child_id',
          children: 'parent_id',
        },
      },
    }
  };
}

export class ValenceChildren extends Relationship {
  static schema = {
    sides: {
      valenceParents: { otherType: 'tests', otherName: 'valenceChildren' },
      valenceChildren: { otherType: 'tests', otherName: 'valenceParents' },
    },
    storeData: {
      sql: {
        tableName: 'valence_children',
        joinFields: {
          valenceParents: 'child_id',
          valenceChildren: 'parent_id',
        },
      },
    },
    extras: {
      perm: {
        type: 'number',
      },
    },
  };
}

export class QueryChildren extends Relationship {
  static schema = {
    sides: {
      queryParents: { otherType: 'tests', otherName: 'queryChildren' },
      queryChildren: { otherType: 'tests', otherName: 'queryParents' },
    },
    storeData: {
      sql: {
        tableName: 'query_children',
        joinFields: {
          queryParents: 'child_id',
          queryChildren: 'parent_id',
        },
        joinQuery: {
          queryParents: 'on "tests"."id" = "queryParents"."child_id" and "queryParents"."perm" >= 2',
          queryChildren: 'on "tests"."id" = "queryChildren"."parent_id" and "queryChildren"."perm" >= 2',
        },
        where: {
          queryParents: 'where "queryParents"."child_id" = ? and "queryParents"."perm" >= 2',
          queryChildren: 'where "queryChildren"."parent_id" = ? and "queryChildren"."perm" >= 2',
        },
      },
    },
    $extras: {
      perm: {
        type: 'number',
      },
    },
  };
}

export class TestType extends Model {
  static typeName = 'tests';
  static schema = {
    name: 'tests',
    idAttribute: 'id',
    attributes: {
      id: { type: 'number', readOnly: true },
      // name: { type: 'string' },
      // otherName: { type: 'string', default: '' },
      // extended: { type: 'object', default: {} },
    },
    relationships: {
      children: { type: Children },
      parents: { type: Children },
      valenceChildren: { type: ValenceChildren },
      valenceParents: { type: ValenceChildren },
      queryChildren: { type: QueryChildren, readOnly: true },
      queryParents: { type: QueryChildren, readOnly: true },
    },
    storeData: {
      sql: {
        tableName: 'tests',
        bulkQuery: 'where "tests"."id" >= ?',
      },
    }
  };
}
