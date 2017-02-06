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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdGVzdFR5cGUuanMiXSwibmFtZXMiOlsiVGVzdFR5cGUiLCJDaGlsZHJlbiIsIlZhbGVuY2VDaGlsZHJlbiIsIkxpa2VzIiwiQWdyZWVzIiwiUXVlcnlDaGlsZHJlbiIsIiRuYW1lIiwiJHNpZGVzIiwicGFyZW50cyIsInNlbGYiLCJmaWVsZCIsInR5cGUiLCJvdGhlciIsInRpdGxlIiwiY2hpbGRyZW4iLCJsaWtlcnMiLCJsaWtlZXMiLCIkcmVzdHJpY3QiLCJyZWFjdGlvbiIsInZhbHVlIiwiYWdyZWVycyIsImFncmVlZXMiLCJ2YWxlbmNlUGFyZW50cyIsInZhbGVuY2VDaGlsZHJlbiIsIiRleHRyYXMiLCJwZXJtIiwicXVlcnlQYXJlbnRzIiwicXVlcnkiLCJsb2dpYyIsInJlcXVpcmVMb2FkIiwicXVlcnlDaGlsZHJlbiIsIiRpZCIsIiRwYWNrYWdlSW5jbHVkZXMiLCIkZmllbGRzIiwiaWQiLCJuYW1lIiwiZXh0ZW5kZWQiLCJkZWZhdWx0IiwicmVsYXRpb25zaGlwIiwicmVhZG9ubHkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7SUFFYUEsUSxXQUFBQSxROzs7Ozs7Ozs7Ozs7SUFFQUMsUSxXQUFBQSxROzs7Ozs7Ozs7Ozs7SUFDQUMsZSxXQUFBQSxlOzs7Ozs7Ozs7Ozs7SUFDQUMsSyxXQUFBQSxLOzs7Ozs7Ozs7Ozs7SUFDQUMsTSxXQUFBQSxNOzs7Ozs7Ozs7Ozs7SUFDQUMsYSxXQUFBQSxhOzs7Ozs7Ozs7Ozs7QUFFYkosU0FBU0ssS0FBVCxHQUFpQixVQUFqQjtBQUNBTCxTQUFTTSxNQUFULEdBQWtCO0FBQ2hCQyxXQUFTO0FBQ1BDLFVBQU07QUFDSkMsYUFBTyxVQURIO0FBRUpDLFlBQU07QUFGRixLQURDO0FBS1BDLFdBQU87QUFDTEYsYUFBTyxXQURGO0FBRUxDLFlBQU0sT0FGRDtBQUdMRSxhQUFPO0FBSEY7QUFMQSxHQURPO0FBWWhCQyxZQUFVO0FBQ1JMLFVBQU07QUFDSkMsYUFBTyxXQURIO0FB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VUFBTSxTQURBO0FBRU4yQixrQkFBY25DO0FBRlIsR0F6Q1M7QUE2Q2pCaUIsV0FBUztBQUNQVCxVQUFNLFNBREM7QUFFUDJCLGtCQUFjbEM7QUFGUCxHQTdDUTtBQWlEakJpQixXQUFTO0FBQ1BWLFVBQU0sU0FEQztBQUVQMkIsa0JBQWNsQztBQUZQO0FBakRRLENBQW5CIiwiZmlsZSI6InRlc3QvdGVzdFR5cGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4uL21vZGVsJztcbmltcG9ydCB7IFJlbGF0aW9uc2hpcCB9IGZyb20gJy4uL3JlbGF0aW9uc2hpcCc7XG5cbmV4cG9ydCBjbGFzcyBUZXN0VHlwZSBleHRlbmRzIE1vZGVsIHt9XG5cbmV4cG9ydCBjbGFzcyBDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIFZhbGVuY2VDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIExpa2VzIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5leHBvcnQgY2xhc3MgQWdyZWVzIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5leHBvcnQgY2xhc3MgUXVlcnlDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuXG5DaGlsZHJlbi4kbmFtZSA9ICdjaGlsZHJlbic7XG5DaGlsZHJlbi4kc2lkZXMgPSB7XG4gIHBhcmVudHM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnY2hpbGRyZW4nLFxuICAgIH0sXG4gIH0sXG4gIGNoaWxkcmVuOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ3BhcmVudHMnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5MaWtlcy4kc2lkZXMgPSB7XG4gIGxpa2Vyczoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdsaWtlZXMnLFxuICAgIH0sXG4gIH0sXG4gIGxpa2Vlczoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdsaWtlcnMnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5MaWtlcy4kcmVzdHJpY3QgPSB7XG4gIHJlYWN0aW9uOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgdmFsdWU6ICdsaWtlJyxcbiAgfSxcbn07XG5MaWtlcy4kbmFtZSA9ICdyZWFjdGlvbnMnO1xuQWdyZWVzLiRzaWRlcyA9IHtcbiAgYWdyZWVyczoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdhZ3JlZWVzJyxcbiAgICB9LFxuICB9LFxuICBhZ3JlZWVzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ2FncmVlcnMnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5BZ3JlZXMuJHJlc3RyaWN0ID0ge1xuICByZWFjdGlvbjoge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIHZhbHVlOiAnYWdyZWUnLFxuICB9LFxufTtcbkFncmVlcy4kbmFtZSA9ICdyZWFjdGlvbnMnO1xuXG5cblZhbGVuY2VDaGlsZHJlbi4kc2lkZXMgPSB7XG4gIHZhbGVuY2VQYXJlbnRzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ3ZhbGVuY2VDaGlsZHJlbicsXG4gICAgfSxcbiAgfSxcbiAgdmFsZW5jZUNoaWxkcmVuOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ3ZhbGVuY2VQYXJlbnRzJyxcbiAgICB9LFxuICB9LFxufTtcblxuVmFsZW5jZUNoaWxkcmVuLiRleHRyYXMgPSB7XG4gIHBlcm06IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbn07XG5WYWxlbmNlQ2hpbGRyZW4uJG5hbWUgPSAndmFsZW5jZV9jaGlsZHJlbic7XG5cblF1ZXJ5Q2hpbGRyZW4uJHNpZGVzID0ge1xuICBxdWVyeVBhcmVudHM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICBxdWVyeToge1xuICAgICAgICBsb2dpYzogWyd3aGVyZScsIFsnd2hlcmUnLCAnY2hpbGRfaWQnLCAnPScsICd7aWR9J10sIFsnd2hlcmUnLCAncGVybScsICc+PScsIDJdXSxcbiAgICAgICAgcmVxdWlyZUxvYWQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ3F1ZXJ5Q2hpbGRyZW4nLFxuICAgIH0sXG4gIH0sXG4gIHF1ZXJ5Q2hpbGRyZW46IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgcXVlcnk6IHtcbiAgICAgICAgbG9naWM6IFsnd2hlcmUnLCBbJ3doZXJlJywgJ3BhcmVudF9pZCcsICc9JywgJ3tpZH0nXSwgWyd3aGVyZScsICdwZXJtJywgJz49JywgMl1dLFxuICAgICAgICByZXF1aXJlTG9hZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdxdWVyeVBhcmVudHMnLFxuICAgIH0sXG4gIH0sXG59O1xuUXVlcnlDaGlsZHJlbi4kZXh0cmFzID0ge1xuICBwZXJtOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuXG5RdWVyeUNoaWxkcmVuLiRuYW1lID0gJ3ZhbGVuY2VfY2hpbGRyZW4nO1xuXG5cblRlc3RUeXBlLiRuYW1lID0gJ3Rlc3RzJztcblRlc3RUeXBlLiRpZCA9ICdpZCc7XG5UZXN0VHlwZS4kcGFja2FnZUluY2x1ZGVzID0gWydjaGlsZHJlbiddO1xuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBleHRlbmRlZDoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICAgIGRlZmF1bHQ6IHt9LFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IENoaWxkcmVuLFxuICB9LFxuICB2YWxlbmNlQ2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBWYWxlbmNlQ2hpbGRyZW4sXG4gIH0sXG4gIHBhcmVudHM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBDaGlsZHJlbixcbiAgfSxcbiAgcXVlcnlDaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWFkb25seTogdHJ1ZSxcbiAgICByZWxhdGlvbnNoaXA6IFF1ZXJ5Q2hpbGRyZW4sXG4gIH0sXG4gIHF1ZXJ5UGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWFkb25seTogdHJ1ZSxcbiAgICByZWxhdGlvbnNoaXA6IFF1ZXJ5Q2hpbGRyZW4sXG4gIH0sXG4gIHZhbGVuY2VQYXJlbnRzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogVmFsZW5jZUNoaWxkcmVuLFxuICB9LFxuICBsaWtlcnM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBMaWtlcyxcbiAgfSxcbiAgbGlrZWVzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogTGlrZXMsXG4gIH0sXG4gIGFncmVlcnM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBBZ3JlZXMsXG4gIH0sXG4gIGFncmVlZXM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBBZ3JlZXMsXG4gIH0sXG59O1xuIl19
