'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QueryChildren = exports.Agrees = exports.Likes = exports.ValenceChildren = exports.Children = exports.TestType = undefined;

var _model = require('../model');

var _relationship = require('../relationship');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TestType = exports.TestType = function (_Model) {
  _inherits(TestType, _Model);

  function TestType() {
    _classCallCheck(this, TestType);

    return _possibleConstructorReturn(this, (TestType.__proto__ || Object.getPrototypeOf(TestType)).apply(this, arguments));
  }

  return TestType;
}(_model.Model);

var Children = exports.Children = function (_Relationship) {
  _inherits(Children, _Relationship);

  function Children() {
    _classCallCheck(this, Children);

    return _possibleConstructorReturn(this, (Children.__proto__ || Object.getPrototypeOf(Children)).apply(this, arguments));
  }

  return Children;
}(_relationship.Relationship);

var ValenceChildren = exports.ValenceChildren = function (_Relationship2) {
  _inherits(ValenceChildren, _Relationship2);

  function ValenceChildren() {
    _classCallCheck(this, ValenceChildren);

    return _possibleConstructorReturn(this, (ValenceChildren.__proto__ || Object.getPrototypeOf(ValenceChildren)).apply(this, arguments));
  }

  return ValenceChildren;
}(_relationship.Relationship);

var Likes = exports.Likes = function (_Relationship3) {
  _inherits(Likes, _Relationship3);

  function Likes() {
    _classCallCheck(this, Likes);

    return _possibleConstructorReturn(this, (Likes.__proto__ || Object.getPrototypeOf(Likes)).apply(this, arguments));
  }

  return Likes;
}(_relationship.Relationship);

var Agrees = exports.Agrees = function (_Relationship4) {
  _inherits(Agrees, _Relationship4);

  function Agrees() {
    _classCallCheck(this, Agrees);

    return _possibleConstructorReturn(this, (Agrees.__proto__ || Object.getPrototypeOf(Agrees)).apply(this, arguments));
  }

  return Agrees;
}(_relationship.Relationship);

var QueryChildren = exports.QueryChildren = function (_Relationship5) {
  _inherits(QueryChildren, _Relationship5);

  function QueryChildren() {
    _classCallCheck(this, QueryChildren);

    return _possibleConstructorReturn(this, (QueryChildren.__proto__ || Object.getPrototypeOf(QueryChildren)).apply(this, arguments));
  }

  return QueryChildren;
}(_relationship.Relationship);

Children.$name = 'parent_child_relationship';
Children.$sides = {
  parents: {
    self: {
      field: 'child_id',
      type: 'tests'
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'children'
    }
  },
  children: {
    self: {
      field: 'parent_id',
      type: 'tests'
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'parents'
    }
  }
};

Likes.$sides = {
  likers: {
    self: {
      field: 'child_id',
      type: 'tests'
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'likees'
    }
  },
  likees: {
    self: {
      field: 'parent_id',
      type: 'tests'
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'likers'
    }
  }
};

Likes.$restrict = {
  reaction: {
    type: 'string',
    value: 'like'
  }
};
Likes.$name = 'reactions';
Agrees.$sides = {
  agreers: {
    self: {
      field: 'child_id',
      type: 'tests'
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'agreees'
    }
  },
  agreees: {
    self: {
      field: 'parent_id',
      type: 'tests'
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'agreers'
    }
  }
};

Agrees.$restrict = {
  reaction: {
    type: 'string',
    value: 'agree'
  }
};
Agrees.$name = 'reactions';

ValenceChildren.$sides = {
  valenceParents: {
    self: {
      field: 'child_id',
      type: 'tests'
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'valenceChildren'
    }
  },
  valenceChildren: {
    self: {
      field: 'parent_id',
      type: 'tests'
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'valenceParents'
    }
  }
};

ValenceChildren.$extras = {
  perm: {
    type: 'number'
  }
};
ValenceChildren.$name = 'valence_children';

QueryChildren.$sides = {
  queryParents: {
    self: {
      field: 'child_id',
      type: 'tests',
      query: {
        logic: ['where', ['where', 'child_id', '=', '{id}'], ['where', 'perm', '>=', 2]],
        requireLoad: true
      }
    },
    other: {
      field: 'parent_id',
      type: 'tests',
      title: 'queryChildren'
    }
  },
  queryChildren: {
    self: {
      field: 'parent_id',
      type: 'tests',
      query: {
        logic: ['where', ['where', 'parent_id', '=', '{id}'], ['where', 'perm', '>=', 2]],
        requireLoad: true
      }
    },
    other: {
      field: 'child_id',
      type: 'tests',
      title: 'queryParents'
    }
  }
};
QueryChildren.$extras = {
  perm: {
    type: 'number'
  }
};

QueryChildren.$name = 'query_children';

TestType.$name = 'tests';
TestType.$id = 'id';
TestType.$packageIncludes = ['children'];
TestType.$fields = {
  id: {
    type: 'number'
  },
  name: {
    type: 'string'
  },
  extended: {
    type: 'object',
    default: {}
  },
  children: {
    type: 'hasMany',
    relationship: Children
  },
  valenceChildren: {
    type: 'hasMany',
    relationship: ValenceChildren
  },
  parents: {
    type: 'hasMany',
    relationship: Children
  },
  queryChildren: {
    type: 'hasMany',
    readonly: true,
    relationship: QueryChildren
  },
  queryParents: {
    type: 'hasMany',
    readonly: true,
    relationship: QueryChildren
  },
  valenceParents: {
    type: 'hasMany',
    relationship: ValenceChildren
  },
  likers: {
    type: 'hasMany',
    relationship: Likes
  },
  likees: {
    type: 'hasMany',
    relationship: Likes
  },
  agreers: {
    type: 'hasMany',
    relationship: Agrees
  },
  agreees: {
    type: 'hasMany',
    relationship: Agrees
  }
};
TestType.$include = {
  children: {
    attributes: ['name', 'extended'],
    relationships: ['children'],
    depth: Infinity
  }
};