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
TestType.$fields = {
  id: {
    type: 'number'
  },
  name: {
    type: 'string'
  },
  extended: {
    type: 'object'
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdGVzdFR5cGUuanMiXSwibmFtZXMiOlsiVGVzdFR5cGUiLCJDaGlsZHJlbiIsIlZhbGVuY2VDaGlsZHJlbiIsIkxpa2VzIiwiQWdyZWVzIiwiUXVlcnlDaGlsZHJlbiIsIiRuYW1lIiwiJHNpZGVzIiwicGFyZW50cyIsInNlbGYiLCJmaWVsZCIsInR5cGUiLCJvdGhlciIsInRpdGxlIiwiY2hpbGRyZW4iLCJsaWtlcnMiLCJsaWtlZXMiLCIkcmVzdHJpY3QiLCJyZWFjdGlvbiIsInZhbHVlIiwiYWdyZWVycyIsImFncmVlZXMiLCJ2YWxlbmNlUGFyZW50cyIsInZhbGVuY2VDaGlsZHJlbiIsIiRleHRyYXMiLCJwZXJtIiwicXVlcnlQYXJlbnRzIiwicXVlcnkiLCJsb2dpYyIsInJlcXVpcmVMb2FkIiwicXVlcnlDaGlsZHJlbiIsIiRpZCIsIiRmaWVsZHMiLCJpZCIsIm5hbWUiLCJleHRlbmRlZCIsInJlbGF0aW9uc2hpcCIsInJlYWRvbmx5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7O0lBRWFBLFEsV0FBQUEsUTs7Ozs7Ozs7Ozs7O0lBRUFDLFEsV0FBQUEsUTs7Ozs7Ozs7Ozs7O0lBQ0FDLGUsV0FBQUEsZTs7Ozs7Ozs7Ozs7O0lBQ0FDLEssV0FBQUEsSzs7Ozs7Ozs7Ozs7O0lBQ0FDLE0sV0FBQUEsTTs7Ozs7Ozs7Ozs7O0lBQ0FDLGEsV0FBQUEsYTs7Ozs7Ozs7Ozs7O0FBRWJKLFNBQVNLLEtBQVQsR0FBaUIsVUFBakI7QUFDQUwsU0FBU00sTUFBVCxHQUFrQjtBQUNoQkMsV0FBUztBQUNQQyxVQUFNO0FBQ0pDLGFBQU8sVUFESDtBQUVKQyxZQUFNO0FBRkYsS0FEQztBQUtQQyxXQUFPO0FBQ0xGLGFBQU8sV0FERjtBQUVMQyxZQUFNLE9BRkQ7QUFHTEUsYUFBTztBQUhGO0FBTEEsR0FETztBQVloQkMsWUFBVTtBQUNSTCxVQUFNO0FBQ0pDLGFBQU8sV0FESDtBQUVKQyxZQUFNO0FBRkYsS0FERTtBQUtSQyxXQUFP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Q1E7QUFnRGpCaUIsV0FBUztBQUNQVixVQUFNLFNBREM7QUFFUHlCLGtCQUFjaEM7QUFGUDtBQWhEUSxDQUFuQiIsImZpbGUiOiJ0ZXN0L3Rlc3RUeXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9tb2RlbCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuLi9yZWxhdGlvbnNoaXAnO1xuXG5leHBvcnQgY2xhc3MgVGVzdFR5cGUgZXh0ZW5kcyBNb2RlbCB7fVxuXG5leHBvcnQgY2xhc3MgQ2hpbGRyZW4gZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbmV4cG9ydCBjbGFzcyBWYWxlbmNlQ2hpbGRyZW4gZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cbmV4cG9ydCBjbGFzcyBMaWtlcyBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIEFncmVlcyBleHRlbmRzIFJlbGF0aW9uc2hpcCB7fVxuZXhwb3J0IGNsYXNzIFF1ZXJ5Q2hpbGRyZW4gZXh0ZW5kcyBSZWxhdGlvbnNoaXAge31cblxuQ2hpbGRyZW4uJG5hbWUgPSAnY2hpbGRyZW4nO1xuQ2hpbGRyZW4uJHNpZGVzID0ge1xuICBwYXJlbnRzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgICB0aXRsZTogJ2NoaWxkcmVuJyxcbiAgICB9LFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdwYXJlbnRzJyxcbiAgICB9LFxuICB9LFxufTtcblxuTGlrZXMuJHNpZGVzID0ge1xuICBsaWtlcnM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnbGlrZWVzJyxcbiAgICB9LFxuICB9LFxuICBsaWtlZXM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnbGlrZXJzJyxcbiAgICB9LFxuICB9LFxufTtcblxuTGlrZXMuJHJlc3RyaWN0ID0ge1xuICByZWFjdGlvbjoge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIHZhbHVlOiAnbGlrZScsXG4gIH0sXG59O1xuTGlrZXMuJG5hbWUgPSAncmVhY3Rpb25zJztcbkFncmVlcy4kc2lkZXMgPSB7XG4gIGFncmVlcnM6IHtcbiAgICBzZWxmOiB7XG4gICAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAnYWdyZWVlcycsXG4gICAgfSxcbiAgfSxcbiAgYWdyZWVlczoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdhZ3JlZXJzJyxcbiAgICB9LFxuICB9LFxufTtcblxuQWdyZWVzLiRyZXN0cmljdCA9IHtcbiAgcmVhY3Rpb246IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICB2YWx1ZTogJ2FncmVlJyxcbiAgfSxcbn07XG5BZ3JlZXMuJG5hbWUgPSAncmVhY3Rpb25zJztcblxuXG5WYWxlbmNlQ2hpbGRyZW4uJHNpZGVzID0ge1xuICB2YWxlbmNlUGFyZW50czoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICd2YWxlbmNlQ2hpbGRyZW4nLFxuICAgIH0sXG4gIH0sXG4gIHZhbGVuY2VDaGlsZHJlbjoge1xuICAgIHNlbGY6IHtcbiAgICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgICAgIHR5cGU6ICd0ZXN0cycsXG4gICAgfSxcbiAgICBvdGhlcjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICd2YWxlbmNlUGFyZW50cycsXG4gICAgfSxcbiAgfSxcbn07XG5cblZhbGVuY2VDaGlsZHJlbi4kZXh0cmFzID0ge1xuICBwZXJtOiB7XG4gICAgdHlwZTogJ251bWJlcicsXG4gIH0sXG59O1xuVmFsZW5jZUNoaWxkcmVuLiRuYW1lID0gJ3ZhbGVuY2VfY2hpbGRyZW4nO1xuXG5RdWVyeUNoaWxkcmVuLiRzaWRlcyA9IHtcbiAgcXVlcnlQYXJlbnRzOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdjaGlsZF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgcXVlcnk6IHtcbiAgICAgICAgbG9naWM6IFsnd2hlcmUnLCBbJ3doZXJlJywgJ2NoaWxkX2lkJywgJz0nLCAne2lkfSddLCBbJ3doZXJlJywgJ3Blcm0nLCAnPj0nLCAyXV0sXG4gICAgICAgIHJlcXVpcmVMb2FkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG90aGVyOiB7XG4gICAgICBmaWVsZDogJ3BhcmVudF9pZCcsXG4gICAgICB0eXBlOiAndGVzdHMnLFxuICAgICAgdGl0bGU6ICdxdWVyeUNoaWxkcmVuJyxcbiAgICB9LFxuICB9LFxuICBxdWVyeUNoaWxkcmVuOiB7XG4gICAgc2VsZjoge1xuICAgICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHF1ZXJ5OiB7XG4gICAgICAgIGxvZ2ljOiBbJ3doZXJlJywgWyd3aGVyZScsICdwYXJlbnRfaWQnLCAnPScsICd7aWR9J10sIFsnd2hlcmUnLCAncGVybScsICc+PScsIDJdXSxcbiAgICAgICAgcmVxdWlyZUxvYWQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgb3RoZXI6IHtcbiAgICAgIGZpZWxkOiAnY2hpbGRfaWQnLFxuICAgICAgdHlwZTogJ3Rlc3RzJyxcbiAgICAgIHRpdGxlOiAncXVlcnlQYXJlbnRzJyxcbiAgICB9LFxuICB9LFxufTtcblF1ZXJ5Q2hpbGRyZW4uJGV4dHJhcyA9IHtcbiAgcGVybToge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxufTtcblxuUXVlcnlDaGlsZHJlbi4kbmFtZSA9ICd2YWxlbmNlX2NoaWxkcmVuJztcblxuXG5UZXN0VHlwZS4kbmFtZSA9ICd0ZXN0cyc7XG5UZXN0VHlwZS4kaWQgPSAnaWQnO1xuVGVzdFR5cGUuJGZpZWxkcyA9IHtcbiAgaWQ6IHtcbiAgICB0eXBlOiAnbnVtYmVyJyxcbiAgfSxcbiAgbmFtZToge1xuICAgIHR5cGU6ICdzdHJpbmcnLFxuICB9LFxuICBleHRlbmRlZDoge1xuICAgIHR5cGU6ICdvYmplY3QnLFxuICB9LFxuICBjaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IENoaWxkcmVuLFxuICB9LFxuICB2YWxlbmNlQ2hpbGRyZW46IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBWYWxlbmNlQ2hpbGRyZW4sXG4gIH0sXG4gIHBhcmVudHM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBDaGlsZHJlbixcbiAgfSxcbiAgcXVlcnlDaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWFkb25seTogdHJ1ZSxcbiAgICByZWxhdGlvbnNoaXA6IFF1ZXJ5Q2hpbGRyZW4sXG4gIH0sXG4gIHF1ZXJ5UGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWFkb25seTogdHJ1ZSxcbiAgICByZWxhdGlvbnNoaXA6IFF1ZXJ5Q2hpbGRyZW4sXG4gIH0sXG4gIHZhbGVuY2VQYXJlbnRzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogVmFsZW5jZUNoaWxkcmVuLFxuICB9LFxuICBsaWtlcnM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBMaWtlcyxcbiAgfSxcbiAgbGlrZWVzOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogTGlrZXMsXG4gIH0sXG4gIGFncmVlcnM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBBZ3JlZXMsXG4gIH0sXG4gIGFncmVlZXM6IHtcbiAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgcmVsYXRpb25zaGlwOiBBZ3JlZXMsXG4gIH0sXG59O1xuIl19
