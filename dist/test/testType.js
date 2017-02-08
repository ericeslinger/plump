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

Children.$name = 'children';
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdGVzdFR5cGUuanMiXSwibmFtZXMiOlsiVGVzdFR5cGUiLCJDaGlsZHJlbiIsIlZhbGVuY2VDaGlsZHJlbiIsIkxpa2VzIiwiQWdyZWVzIiwiUXVlcnlDaGlsZHJlbiIsIiRuYW1lIiwiJHNpZGVzIiwicGFyZW50cyIsInNlbGYiLCJmaWVsZCIsInR5cGUiLCJvdGhlciIsInRpdGxlIiwiY2hpbGRyZW4iLCJsaWtlcnMiLCJsaWtlZXMiLCIkcmVzdHJpY3QiLCJyZWFjdGlvbiIsInZhbHVlIiwiYWdyZWVycyIsImFncmVlZXMiLCJ2YWxlbmNlUGFyZW50cyIsInZhbGVuY2VDaGlsZHJlbiIsIiRleHRyYXMiLCJwZXJtIiwicXVlcnlQYXJlbnRzIiwicXVlcnkiLCJsb2dpYyIsInJlcXVpcmVMb2FkIiwicXVlcnlDaGlsZHJlbiIsIiRpZCIsIiRwYWNrYWdlSW5jbHVkZXMiLCIkZmllbGRzIiwiaWQiLCJuYW1lIiwiZXh0ZW5kZWQiLCJkZWZhdWx0IiwicmVsYXRpb25zaGlwIiwicmVhZG9ubHkiLCIkaW5jbHVkZSIsImF0dHJpYnV0ZXMiLCJyZWxhdGlvbnNoaXBzIiwiZGVwdGgiLCJJbmZpbml0eSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7OztJQUVhQSxRLFdBQUFBLFE7Ozs7Ozs7Ozs7OztJQUVBQyxRLFdBQUFBLFE7Ozs7Ozs7Ozs7OztJQUNBQyxlLFdBQUFBLGU7Ozs7Ozs7Ozs7OztJQUNBQyxLLFdBQUFBLEs7Ozs7Ozs7Ozs7OztJQUNBQyxNLFdBQUFBLE07Ozs7Ozs7Ozs7OztJQUNBQyxhLFdBQUFBLGE7Ozs7Ozs7Ozs7OztBQUViSixTQUFTSyxLQUFULEdBQWlCLFVBQWpCO0FBQ0FMLFNBQVNNLE1BQVQsR0FBa0I7QUFDaEJDLFdBQVM7QUFDUEMsVUFBTTtBQUNKQyxhQUFPLFVBREg7QUFFSkMsWUFBTTtBQUZGLEtBREM7QUFLUEMsV0FBTztBQUNMRixhQUFPLFdBREY7QUFFTEMsWUFBTSxPQUZEO0FBR0xFLGFB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Q05KLFVBQU0sU0FEQTtBQUVOMkIsa0JBQWNuQztBQUZSLEdBckNTO0FBeUNqQmEsVUFBUTtBQUNOTCxVQUFNLFNBREE7QUFFTjJCLGtCQUFjbkM7QUFGUixHQXpDUztBQTZDakJpQixXQUFTO0FBQ1BULFVBQU0sU0FEQztBQUVQMkIsa0JBQWNsQztBQUZQLEdBN0NRO0FBaURqQmlCLFdBQVM7QUFDUFYsVUFBTSxTQURDO0FBRVAyQixrQkFBY2xDO0FBRlA7QUFqRFEsQ0FBbkI7QUFzREFKLFNBQVN3QyxRQUFULEdBQW9CO0FBQ2xCMUIsWUFBVTtBQUNSMkIsZ0JBQVksQ0FBQyxNQUFELEVBQVMsVUFBVCxDQURKO0FBRVJDLG1CQUFlLENBQUMsVUFBRCxDQUZQO0FBR1JDLFdBQU9DO0FBSEM7QUFEUSxDQUFwQiIsImZpbGUiOiJ0ZXN0L3Rlc3RUeXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9tb2RlbCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuLi9yZWxhdGlvbnNoaXAnO1xuXG5leHBvcnQgY2xhc3MgVGVzdFR5cGUgZXh0ZW5kcyBNb2RlbCB7fVxuXG5leHBvcnQgY2xhc3MgQ2hpbGRyZW4gZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbmV4cG9ydCBjbGFzcyBWYWxlbmNlQ2hpbGRyZW4gZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbmV4cG9ydCBjbGFzcyBMaWtlcyBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIEFncmVlcyBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIFF1ZXJ5Q2hpbGRyZW4gZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cblxuQ2hpbGRyZW4uJG5hbWUgPSAnY2hpbGRyZW4nO1xuQ2hpbGRyZW4uJHNpZGVzID0ge1xuICBwYXJlbnRzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ2NoaWxkcmVuJyxcbiAgICB9LFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdwYXJlbnRzJyxcbiAgICB9LFxuICB9LFxufTtcblxuTGlrZXMuJHNpZGVzID0ge1xuICBsaWtlcnM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnbGlrZWVzJyxcbiAgICB9LFxuICB9LFxuICBsaWtlZXM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnbGlrZXJzJyxcbiAgICB9LFxuICB9LFxufTtcblxuTGlrZXMuJHJlc3RyaWN0ID0ge1xuICByZWFjdGlvbjoge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIHZhbHVlOiAnbGlrZScsXG4gIH0sXG59O1xuTGlrZXMuJG5hbWUgPSAncmVhY3Rpb25zJztcbkFncmVlcy4kc2lkZXMgPSB7XG4gIGFncmVlcnM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnYWdyZWVlcycsXG4gICAgfSxcbiAgfSxcbiAgYWdyZWVlczoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdhZ3JlZXJzJyxcbiAgICB9LFxuICB9LFxufTtcblxuQWdyZWVzLiRyZXN0cmljdCA9IHtcbiAgcmVhY3Rpb246IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB2YWx1ZTogJ2FncmVlJyxcbiAgfSxcbn07XG5BZ3JlZXMuJG5hbWUgPSAncmVhY3Rpb25zJztcblxuXG5WYWxlbmNlQ2hpbGRyZW4uJHNpZGVzID0ge1xuICB2YWxlbmNlUGFyZW50czoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICd2YWxlbmNlQ2hpbGRyZW4nLFxuICAgIH0sXG4gIH0sXG4gIHZhbGVuY2VDaGlsZHJlbjoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICd2YWxlbmNlUGFyZW50cycsXG4gICAgfSxcbiAgfSxcbn07XG5cblZhbGVuY2VDaGlsZHJlbi4kZXh0cmFzID0ge1xuICBwZXJtOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuVmFsZW5jZUNoaWxkcmVuLiRuYW1lID0gJ3ZhbGVuY2VfY2hpbGRyZW4nO1xuXG5RdWVyeUNoaWxkcmVuLiRzaWRlcyA9IHtcbiAgcXVlcnlQYXJlbnRzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgcXVlcnk6IHtcbiAgICAgICAgbG9naWM6IFsnd2hlcmUnLCBbJ3doZXJlJywgJ2NoaWxkX2lkJywgJz0nLCAne2lkfSddLCBbJ3doZXJlJywgJ3Blcm0nLCAnPj0nLCAyXV0sXG4gICAgICAgIHJlcXVpcmVMb2FkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdxdWVyeUNoaWxkcmVuJyxcbiAgICB9LFxuICB9LFxuICBxdWVyeUNoaWxkcmVuOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHF1ZXJ5OiB7XG4gICAgICAgIGxvZ2ljOiBbJ3doZXJlJywgWyd3aGVyZScsICdwYXJlbnRfaWQnLCAnPScsICd7aWR9J10sIFsnd2hlcmUnLCAncGVybScsICc+PScsIDJdXSxcbiAgICAgICAgcmVxdWlyZUxvYWQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAncXVlcnlQYXJlbnRzJyxcbiAgICB9LFxuICB9LFxufTtcblF1ZXJ5Q2hpbGRyZW4uJGV4dHJhcyA9IHtcbiAgcGVybToge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcblxuUXVlcnlDaGlsZHJlbi4kbmFtZSA9ICd2YWxlbmNlX2NoaWxkcmVuJztcblxuXG5UZXN0VHlwZS4kbmFtZSA9ICd0ZXN0cyc7XG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuVGVzdFR5cGUuJHBhY2thZ2VJbmNsdWRlcyA9IFsnY2hpbGRyZW4nXTtcblRlc3RUeXBlLiRmaWVsZHMgPSB7XG4gIGlkOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG4gIG5hbWU6IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgfSxcbiAgZXh0ZW5kZWQ6IHtcbiAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICBkZWZhdWx0OiB7fSxcbiAgfSxcbiAgY2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBDaGlsZHJlbixcbiAgfSxcbiAgdmFsZW5jZUNoaWxkcmVuOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogVmFsZW5jZUNoaWxkcmVuLFxuICB9LFxuICBwYXJlbnRzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQ2hpbGRyZW4sXG4gIH0sXG4gIHF1ZXJ5Q2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVhZG9ubHk6IHRydWUsXG4gICAgcmVsYXRpb25zaGlwOiBRdWVyeUNoaWxkcmVuLFxuICB9LFxuICBxdWVyeVBhcmVudHM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVhZG9ubHk6IHRydWUsXG4gICAgcmVsYXRpb25zaGlwOiBRdWVyeUNoaWxkcmVuLFxuICB9LFxuICB2YWxlbmNlUGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IFZhbGVuY2VDaGlsZHJlbixcbiAgfSxcbiAgbGlrZXJzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogTGlrZXMsXG4gIH0sXG4gIGxpa2Vlczoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IExpa2VzLFxuICB9LFxuICBhZ3JlZXJzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQWdyZWVzLFxuICB9LFxuICBhZ3JlZWVzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQWdyZWVzLFxuICB9LFxufTtcblRlc3RUeXBlLiRpbmNsdWRlID0ge1xuICBjaGlsZHJlbjoge1xuICAgIGF0dHJpYnV0ZXM6IFsnbmFtZScsICdleHRlbmRlZCddLFxuICAgIHJlbGF0aW9uc2hpcHM6IFsnY2hpbGRyZW4nXSxcbiAgICBkZXB0aDogSW5maW5pdHksXG4gIH0sXG59O1xuIl19
