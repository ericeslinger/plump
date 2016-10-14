import { Model } from '../model';
import { Relationship } from '../relationship';

export class TestType extends Model {}

export class Children extends Relationship {}
export class ValenceChildren extends Relationship {}

Children.$sides = {
  parents: {
    type: TestType,
    field: 'parent_id',
  },
  children: {
    type: TestType,
    field: 'child_id',
  },
};
Children.$name = 'children';

ValenceChildren.$sides = {
  valenceParents: {
    type: TestType,
    field: 'parent_id',
  },
  valenceChildren: {
    type: TestType,
    field: 'child_id',
  },
};

ValenceChildren.$extras = ['perm'];
ValenceChildren.$name = 'valence_children';

TestType.$name = 'tests';
TestType.$id = 'id';
TestType.$fields = {
  id: {
    type: 'number',
  },
  name: {
    type: 'string',
  },
  extended: {
    type: 'object',
  },
  children: {
    type: 'hasMany',
    relationship: Children,
  },
  valenceChildren: {
    type: 'hasMany',
    relationship: ValenceChildren,
  },
  parents: {
    type: 'hasMany',
    relationship: Children,
  },
  valenceParents: {
    type: 'hasMany',
    relationship: ValenceChildren,
  },
};
