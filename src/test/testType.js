import { Model } from '../model';
import { Relationship } from '../relationship';

export class TestType extends Model {}

export class Children extends Relationship {}
export class ValenceChildren extends Relationship {}
export class Reactions extends Relationship {}

Children.$name = 'children';
Children.$sides = {
  parents: {
    self: {
      field: 'child_id',
      type: 'tests',
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'children',
    },
  },
  children: {
    self: {
      field: 'parent_id',
      type: 'tests',
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'parents',
    },
  },
};

Reactions.$sides = {
  reactors: {
    self: {
      field: 'child_id',
      type: 'tests',
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'reactees',
    },
  },
  reactees: {
    self: {
      field: 'parent_id',
      type: 'tests',
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'reactors',
    },
  },
};

Reactions.$restrict = { reaction: 'reeeeact' };
Reactions.$name = 'reactions';


ValenceChildren.$sides = {
  valenceParents: {
    self: {
      field: 'child_id',
      type: 'tests',
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'valenceChildren',
    },
  },
  valenceChildren: {
    self: {
      field: 'parent_id',
      type: 'tests',
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'valenceParents',
    },
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
  reactors: {
    type: 'hasMany',
    relationship: Reactions,
  },
  reactees: {
    type: 'hasMany',
    relationship: Reactions,
  },
};
