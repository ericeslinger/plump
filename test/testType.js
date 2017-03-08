import { Model } from '../src/model';
import { Relationship } from '../src/relationship';

export class TestType extends Model {}

export class Children extends Relationship {}
export class ValenceChildren extends Relationship {}
export class Likes extends Relationship {}
export class Agrees extends Relationship {}
export class QueryChildren extends Relationship {}

Children.$name = 'parent_child_relationship';
Children.$sides = {
  parents: { otherType: 'tests', otherName: 'children' },
  children: { otherType: 'tests', otherName: 'parents' },
};
Children.$storeData = {
  sql: {
    joinFields: {
      parents: 'child_id',
      children: 'parent_id',
    },
  },
};

ValenceChildren.$sides = {
  valenceParents: { otherType: 'tests', otherName: 'valenceChildren' },
  valenceChildren: { otherType: 'tests', otherName: 'valenceParents' },
};
ValenceChildren.$storeData = {
  sql: {
    joinFields: {
      valenceParents: 'child_id',
      valenceChildren: 'parent_id',
    },
  },
};
ValenceChildren.$extras = {
  perm: {
    type: 'number',
  },
};
ValenceChildren.$name = 'valence_children';

QueryChildren.$sides = {
  queryParents: { otherType: 'tests', otherName: 'queryChildren' },
  queryChildren: { otherType: 'tests', otherName: 'queryParents' },
};
QueryChildren.$storeData = {
  sql: {
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
};
QueryChildren.$extras = {
  perm: {
    type: 'number',
  },
};

QueryChildren.$name = 'query_children';


TestType.$name = 'tests';
TestType.$id = 'id';
TestType.$packageIncludes = ['children'];
TestType.$storeData = {
  sql: {
    bulkQuery: 'where "tests"."id" >= ?',
  },
};
TestType.$schema = {
  $id: 'id',
  attributes: {
    id: { type: 'number' },
    name: { type: 'string' },
    otherName: { type: 'string', default: '' },
    extended: { type: 'object', default: {} },
  },
  relationships: {
    children: { type: Children },
    parents: { type: Children },
    valenceChildren: { type: ValenceChildren },
    valenceParents: { type: ValenceChildren },
    queryChildren: { type: QueryChildren, readOnly: true },
    queryParents: { type: QueryChildren, readOnly: true },
  },
};
TestType.$include = {
  children: {
    attributes: ['name', 'extended'],
    relationships: ['children'],
  },
};
