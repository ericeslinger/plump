import { Model } from '../model';
import { Relationship } from '../relationship';

export class TestType extends Model {}

export class Children extends Relationship {}
export class ValenceChildren extends Relationship {}
export class Likes extends Relationship {}
export class Agrees extends Relationship {}

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

Likes.$sides = {
  likers: {
    self: {
      field: 'child_id',
      type: 'tests',
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'likees',
    },
  },
  likees: {
    self: {
      field: 'parent_id',
      type: 'tests',
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'likers',
    },
  },
};

Likes.$restrict = {
  reaction: {
    type: 'string',
    value: 'like',
  },
};
Likes.$name = 'reactions';
Agrees.$sides = {
  agreers: {
    self: {
      field: 'child_id',
      type: 'tests',
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'agreees',
    },
  },
  agreees: {
    self: {
      field: 'parent_id',
      type: 'tests',
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'agreers',
    },
  },
};

Agrees.$restrict = {
  reaction: {
    type: 'string',
    value: 'agree',
  },
};
Agrees.$name = 'reactions';


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

ValenceChildren.$extras = {
  perm: {
    type: 'number',
  },
};
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
  likers: {
    type: 'hasMany',
    relationship: Likes,
  },
  likees: {
    type: 'hasMany',
    relationship: Likes,
  },
  agreers: {
    type: 'hasMany',
    relationship: Agrees,
  },
  agreees: {
    type: 'hasMany',
    relationship: Agrees,
  },
};
