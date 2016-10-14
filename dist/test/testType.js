'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ValenceChildren = exports.Children = exports.TestType = undefined;

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

Children.$sides = {
  parents: {
    type: TestType,
    field: 'parent_id'
  },
  children: {
    type: TestType,
    field: 'child_id'
  }
};
Children.$name = 'children';

ValenceChildren.$sides = {
  valenceParents: {
    type: TestType,
    field: 'parent_id'
  },
  valenceChildren: {
    type: TestType,
    field: 'child_id'
  }
};

ValenceChildren.$extras = ['perm'];
ValenceChildren.$name = 'valence_children';

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
  valenceParents: {
    type: 'hasMany',
    relationship: ValenceChildren
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdGVzdFR5cGUuanMiXSwibmFtZXMiOlsiVGVzdFR5cGUiLCJDaGlsZHJlbiIsIlZhbGVuY2VDaGlsZHJlbiIsIiRzaWRlcyIsInBhcmVudHMiLCJ0eXBlIiwiZmllbGQiLCJjaGlsZHJlbiIsIiRuYW1lIiwidmFsZW5jZVBhcmVudHMiLCJ2YWxlbmNlQ2hpbGRyZW4iLCIkZXh0cmFzIiwiJGlkIiwiJGZpZWxkcyIsImlkIiwibmFtZSIsImV4dGVuZGVkIiwicmVsYXRpb25zaGlwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7O0lBRWFBLFEsV0FBQUEsUTs7Ozs7Ozs7Ozs7O0lBRUFDLFEsV0FBQUEsUTs7Ozs7Ozs7Ozs7O0lBQ0FDLGUsV0FBQUEsZTs7Ozs7Ozs7Ozs7O0FBRWJELFNBQVNFLE1BQVQsR0FBa0I7QUFDaEJDLFdBQVM7QUFDUEMsVUFBTUwsUUFEQztBQUVQTSxXQUFPO0FBRkEsR0FETztBQUtoQkMsWUFBVTtBQUNSRixVQUFNTCxRQURFO0FBRVJNLFdBQU87QUFGQztBQUxNLENBQWxCO0FBVUFMLFNBQVNPLEtBQVQsR0FBaUIsVUFBakI7O0FBRUFOLGdCQUFnQkMsTUFBaEIsR0FBeUI7QUFDdkJNLGtCQUFnQjtBQUNkSixVQUFNTCxRQURRO0FBRWRNLFdBQU87QUFGTyxHQURPO0FBS3ZCSSxtQkFBaUI7QUFDZkwsVUFBTUwsUUFEUztBQUVmTSxXQUFPO0FBRlE7QUFMTSxDQUF6Qjs7QUFXQUosZ0JBQWdCUyxPQUFoQixHQUEwQixDQUFDLE1BQUQsQ0FBMUI7QUFDQVQsZ0JBQWdCTSxLQUFoQixHQUF3QixrQkFBeEI7O0FBRUFSLFNBQVNRLEtBQVQsR0FBaUIsT0FBakI7QUFDQVIsU0FBU1ksR0FBVCxHQUFlLElBQWY7QUFDQVosU0FBU2EsT0FBVCxHQUFtQjtBQUNqQkMsTUFBSTtBQUNGVCxVQUFNO0FBREosR0FEYTtBQUlqQlUsUUFBTTtBQUNKVixVQUFNO0FBREYsR0FKVztBQU9qQlcsWUFBVTtBQUNSWCxVQUFNO0FBREUsR0FQTztBQVVqQkUsWUFBVTtBQUNSRixVQUFNLFNBREU7QUFFUlksa0JBQWNoQjtBQUZOLEdBVk87QUFjakJTLG1CQUFpQjtBQUNmTCxVQUFNLFNBRFM7QUFFZlksa0JBQWNmO0FBRkMsR0FkQTtBQWtCakJFLFdBQVM7QUFDUEMsVUFBTSxTQURDO0FBRVBZLGtCQUFjaEI7QUFGUCxHQWxCUTtBQXNCakJRLGtCQUFnQjtBQUNkSixVQUFNLFNBRFE7QUFFZFksa0JBQWNmO0FBRkE7QUF0QkMsQ0FBbkIiLCJmaWxlIjoidGVzdC90ZXN0VHlwZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi4vcmVsYXRpb25zaGlwJztcblxuZXhwb3J0IGNsYXNzIFRlc3RUeXBlIGV4dGVuZHMgTW9kZWwge31cblxuZXhwb3J0IGNsYXNzIENoaWxkcmVuIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5leHBvcnQgY2xhc3MgVmFsZW5jZUNoaWxkcmVuIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5cbkNoaWxkcmVuLiRzaWRlcyA9IHtcbiAgcGFyZW50czoge1xuICAgIHR5cGU6IFRlc3RUeXBlLFxuICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgfSxcbiAgY2hpbGRyZW46IHtcbiAgICB0eXBlOiBUZXN0VHlwZSxcbiAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgfSxcbn07XG5DaGlsZHJlbi4kbmFtZSA9ICdjaGlsZHJlbic7XG5cblZhbGVuY2VDaGlsZHJlbi4kc2lkZXMgPSB7XG4gIHZhbGVuY2VQYXJlbnRzOiB7XG4gICAgdHlwZTogVGVzdFR5cGUsXG4gICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICB9LFxuICB2YWxlbmNlQ2hpbGRyZW46IHtcbiAgICB0eXBlOiBUZXN0VHlwZSxcbiAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgfSxcbn07XG5cblZhbGVuY2VDaGlsZHJlbi4kZXh0cmFzID0gWydwZXJtJ107XG5WYWxlbmNlQ2hpbGRyZW4uJG5hbWUgPSAndmFsZW5jZV9jaGlsZHJlbic7XG5cblRlc3RUeXBlLiRuYW1lID0gJ3Rlc3RzJztcblRlc3RUeXBlLiRpZCA9ICdpZCc7XG5UZXN0VHlwZS4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxuICBuYW1lOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gIH0sXG4gIGV4dGVuZGVkOiB7XG4gICAgdHlwZTogJ29iamVjdCcsXG4gIH0sXG4gIGNoaWxkcmVuOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQ2hpbGRyZW4sXG4gIH0sXG4gIHZhbGVuY2VDaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IFZhbGVuY2VDaGlsZHJlbixcbiAgfSxcbiAgcGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IENoaWxkcmVuLFxuICB9LFxuICB2YWxlbmNlUGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IFZhbGVuY2VDaGlsZHJlbixcbiAgfSxcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
