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

QueryChildren.$name = 'valence_children';

TestType.$name = 'tests';
TestType.$id = 'id';
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdGVzdFR5cGUuanMiXSwibmFtZXMiOlsiVGVzdFR5cGUiLCJDaGlsZHJlbiIsIlZhbGVuY2VDaGlsZHJlbiIsIkxpa2VzIiwiQWdyZWVzIiwiUXVlcnlDaGlsZHJlbiIsIiRuYW1lIiwiJHNpZGVzIiwicGFyZW50cyIsInNlbGYiLCJmaWVsZCIsInR5cGUiLCJvdGhlciIsInRpdGxlIiwiY2hpbGRyZW4iLCJsaWtlcnMiLCJsaWtlZXMiLCIkcmVzdHJpY3QiLCJyZWFjdGlvbiIsInZhbHVlIiwiYWdyZWVycyIsImFncmVlZXMiLCJ2YWxlbmNlUGFyZW50cyIsInZhbGVuY2VDaGlsZHJlbiIsIiRleHRyYXMiLCJwZXJtIiwicXVlcnlQYXJlbnRzIiwicXVlcnkiLCJsb2dpYyIsInJlcXVpcmVMb2FkIiwicXVlcnlDaGlsZHJlbiIsIiRpZCIsIiRmaWVsZHMiLCJpZCIsIm5hbWUiLCJleHRlbmRlZCIsImRlZmF1bHQiLCJyZWxhdGlvbnNoaXAiLCJyZWFkb25seSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7OztJQUVhQSxRLFdBQUFBLFE7Ozs7Ozs7Ozs7OztJQUVBQyxRLFdBQUFBLFE7Ozs7Ozs7Ozs7OztJQUNBQyxlLFdBQUFBLGU7Ozs7Ozs7Ozs7OztJQUNBQyxLLFdBQUFBLEs7Ozs7Ozs7Ozs7OztJQUNBQyxNLFdBQUFBLE07Ozs7Ozs7Ozs7OztJQUNBQyxhLFdBQUFBLGE7Ozs7Ozs7Ozs7OztBQUViSixTQUFTSyxLQUFULEdBQWlCLDJCQUFqQjtBQUNBTCxTQUFTTSxNQUFULEdBQWtCO0FBQ2hCQyxXQUFTO0FBQ1BDLFVBQU07QUFDSkMsYUFBTyxVQURIO0FBRUpDLFlBQU07QUFGRixLQURDO0FBS1BDLFdBQU87QUFDTEYsYUFBTyxXQURGO0FBRUxDLFlBQU0sT0FGRDtBQUdMRSxhQUFPO0FBSEY7QUFMQSxHQURPO0FBWWhCQyxZQUFVO0FBQ1JMLFVBQU07QUFDSkMsYUFBTyxXQURIO0FBRUpDLFlBQU07QUFGRixLQURF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LFNBREM7QUFFUDBCLGtCQUFjakM7QUFGUCxHQTdDUTtBQWlEakJpQixXQUFTO0FBQ1BWLFVBQU0sU0FEQztBQUVQMEIsa0JBQWNqQztBQUZQO0FBakRRLENBQW5CIiwiZmlsZSI6InRlc3QvdGVzdFR5cGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uL21vZGVsJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4uL3JlbGF0aW9uc2hpcCc7XG5cbmV4cG9ydCBjbGFzcyBUZXN0VHlwZSBleHRlbmRzIE1vZGVsIHt9XG5cbmV4cG9ydCBjbGFzcyBDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIFZhbGVuY2VDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIExpa2VzIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5leHBvcnQgY2xhc3MgQWdyZWVzIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5leHBvcnQgY2xhc3MgUXVlcnlDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuXG5DaGlsZHJlbi4kbmFtZSA9ICdwYXJlbnRfY2hpbGRfcmVsYXRpb25zaGlwJztcbkNoaWxkcmVuLiRzaWRlcyA9IHtcbiAgcGFyZW50czoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdjaGlsZHJlbicsXG4gICAgfSxcbiAgfSxcbiAgY2hpbGRyZW46IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAncGFyZW50cycsXG4gICAgfSxcbiAgfSxcbn07XG5cbkxpa2VzLiRzaWRlcyA9IHtcbiAgbGlrZXJzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ2xpa2VlcycsXG4gICAgfSxcbiAgfSxcbiAgbGlrZWVzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ2xpa2VycycsXG4gICAgfSxcbiAgfSxcbn07XG5cbkxpa2VzLiRyZXN0cmljdCA9IHtcbiAgcmVhY3Rpb246IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB2YWx1ZTogJ2xpa2UnLFxuICB9LFxufTtcbkxpa2VzLiRuYW1lID0gJ3JlYWN0aW9ucyc7XG5BZ3JlZXMuJHNpZGVzID0ge1xuICBhZ3JlZXJzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ2FncmVlZXMnLFxuICAgIH0sXG4gIH0sXG4gIGFncmVlZXM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnYWdyZWVycycsXG4gICAgfSxcbiAgfSxcbn07XG5cbkFncmVlcy4kcmVzdHJpY3QgPSB7XG4gIHJlYWN0aW9uOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgdmFsdWU6ICdhZ3JlZScsXG4gIH0sXG59O1xuQWdyZWVzLiRuYW1lID0gJ3JlYWN0aW9ucyc7XG5cblxuVmFsZW5jZUNoaWxkcmVuLiRzaWRlcyA9IHtcbiAgdmFsZW5jZVBhcmVudHM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAndmFsZW5jZUNoaWxkcmVuJyxcbiAgICB9LFxuICB9LFxuICB2YWxlbmNlQ2hpbGRyZW46IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAndmFsZW5jZVBhcmVudHMnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5WYWxlbmNlQ2hpbGRyZW4uJGV4dHJhcyA9IHtcbiAgcGVybToge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcblZhbGVuY2VDaGlsZHJlbi4kbmFtZSA9ICd2YWxlbmNlX2NoaWxkcmVuJztcblxuUXVlcnlDaGlsZHJlbi4kc2lkZXMgPSB7XG4gIHF1ZXJ5UGFyZW50czoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHF1ZXJ5OiB7XG4gICAgICAgIGxvZ2ljOiBbJ3doZXJlJywgWyd3aGVyZScsICdjaGlsZF9pZCcsICc9JywgJ3tpZH0nXSwgWyd3aGVyZScsICdwZXJtJywgJz49JywgMl1dLFxuICAgICAgICByZXF1aXJlTG9hZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAncXVlcnlDaGlsZHJlbicsXG4gICAgfSxcbiAgfSxcbiAgcXVlcnlDaGlsZHJlbjoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICBxdWVyeToge1xuICAgICAgICBsb2dpYzogWyd3aGVyZScsIFsnd2hlcmUnLCAncGFyZW50X2lkJywgJz0nLCAne2lkfSddLCBbJ3doZXJlJywgJ3Blcm0nLCAnPj0nLCAyXV0sXG4gICAgICAgIHJlcXVpcmVMb2FkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ3F1ZXJ5UGFyZW50cycsXG4gICAgfSxcbiAgfSxcbn07XG5RdWVyeUNoaWxkcmVuLiRleHRyYXMgPSB7XG4gIHBlcm06IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG5cblF1ZXJ5Q2hpbGRyZW4uJG5hbWUgPSAndmFsZW5jZV9jaGlsZHJlbic7XG5cblxuVGVzdFR5cGUuJG5hbWUgPSAndGVzdHMnO1xuVGVzdFR5cGUuJGlkID0gJ2lkJztcblRlc3RUeXBlLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG4gIG5hbWU6IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgfSxcbiAgZXh0ZW5kZWQ6IHtcbiAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICBkZWZhdWx0OiB7fSxcbiAgfSxcbiAgY2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBDaGlsZHJlbixcbiAgfSxcbiAgdmFsZW5jZUNoaWxkcmVuOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogVmFsZW5jZUNoaWxkcmVuLFxuICB9LFxuICBwYXJlbnRzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQ2hpbGRyZW4sXG4gIH0sXG4gIHF1ZXJ5Q2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVhZG9ubHk6IHRydWUsXG4gICAgcmVsYXRpb25zaGlwOiBRdWVyeUNoaWxkcmVuLFxuICB9LFxuICBxdWVyeVBhcmVudHM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVhZG9ubHk6IHRydWUsXG4gICAgcmVsYXRpb25zaGlwOiBRdWVyeUNoaWxkcmVuLFxuICB9LFxuICB2YWxlbmNlUGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IFZhbGVuY2VDaGlsZHJlbixcbiAgfSxcbiAgbGlrZXJzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogTGlrZXMsXG4gIH0sXG4gIGxpa2Vlczoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IExpa2VzLFxuICB9LFxuICBhZ3JlZXJzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQWdyZWVzLFxuICB9LFxuICBhZ3JlZWVzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQWdyZWVzLFxuICB9LFxufTtcbiJdfQ==
