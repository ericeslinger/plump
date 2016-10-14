'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ValenceChildren = exports.Children = exports.TestType = undefined;

var _relationship = require('./relationship');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } // import { Model } from '../model';


// export class TestType extends Model {}
var TestType = exports.TestType = function TestType() {
  _classCallCheck(this, TestType);
};

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RUeXBlLmpzIl0sIm5hbWVzIjpbIlRlc3RUeXBlIiwiQ2hpbGRyZW4iLCJWYWxlbmNlQ2hpbGRyZW4iLCIkc2lkZXMiLCJwYXJlbnRzIiwidHlwZSIsImZpZWxkIiwiY2hpbGRyZW4iLCIkbmFtZSIsInZhbGVuY2VQYXJlbnRzIiwidmFsZW5jZUNoaWxkcmVuIiwiJGV4dHJhcyIsIiRpZCIsIiRmaWVsZHMiLCJpZCIsIm5hbWUiLCJleHRlbmRlZCIsInJlbGF0aW9uc2hpcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOzs7Ozs7MEpBREE7OztBQUdBO0lBQ2FBLFEsV0FBQUEsUTs7OztJQUVBQyxRLFdBQUFBLFE7Ozs7Ozs7Ozs7OztJQUNBQyxlLFdBQUFBLGU7Ozs7Ozs7Ozs7OztBQUViRCxTQUFTRSxNQUFULEdBQWtCO0FBQ2hCQyxXQUFTO0FBQ1BDLFVBQU1MLFFBREM7QUFFUE0sV0FBTztBQUZBLEdBRE87QUFLaEJDLFlBQVU7QUFDUkYsVUFBTUwsUUFERTtBQUVSTSxXQUFPO0FBRkM7QUFMTSxDQUFsQjtBQVVBTCxTQUFTTyxLQUFULEdBQWlCLFVBQWpCOztBQUVBTixnQkFBZ0JDLE1BQWhCLEdBQXlCO0FBQ3ZCTSxrQkFBZ0I7QUFDZEosVUFBTUwsUUFEUTtBQUVkTSxXQUFPO0FBRk8sR0FETztBQUt2QkksbUJBQWlCO0FBQ2ZMLFVBQU1MLFFBRFM7QUFFZk0sV0FBTztBQUZRO0FBTE0sQ0FBekI7O0FBV0FKLGdCQUFnQlMsT0FBaEIsR0FBMEIsQ0FBQyxNQUFELENBQTFCO0FBQ0FULGdCQUFnQk0sS0FBaEIsR0FBd0Isa0JBQXhCOztBQUVBUixTQUFTUSxLQUFULEdBQWlCLE9BQWpCO0FBQ0FSLFNBQVNZLEdBQVQsR0FBZSxJQUFmO0FBQ0FaLFNBQVNhLE9BQVQsR0FBbUI7QUFDakJDLE1BQUk7QUFDRlQsVUFBTTtBQURKLEdBRGE7QUFJakJVLFFBQU07QUFDSlYsVUFBTTtBQURGLEdBSlc7QUFPakJXLFlBQVU7QUFDUlgsVUFBTTtBQURFLEdBUE87QUFVakJFLFlBQVU7QUFDUkYsVUFBTSxTQURFO0FBRVJZLGtCQUFjaEI7QUFGTixHQVZPO0FBY2pCUyxtQkFBaUI7QUFDZkwsVUFBTSxTQURTO0FBRWZZLGtCQUFjZjtBQUZDLEdBZEE7QUFrQmpCRSxXQUFTO0FBQ1BDLFVBQU0sU0FEQztBQUVQWSxrQkFBY2hCO0FBRlAsR0FsQlE7QUFzQmpCUSxrQkFBZ0I7QUFDZEosVUFBTSxTQURRO0FBRWRZLGtCQUFjZjtBQUZBO0FBdEJDLENBQW5CIiwiZmlsZSI6InRlc3RUeXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9tb2RlbCc7XG5pbXBvcnQgeyBSZWxhdGlvbnNoaXAgfSBmcm9tICcuL3JlbGF0aW9uc2hpcCc7XG5cbi8vIGV4cG9ydCBjbGFzcyBUZXN0VHlwZSBleHRlbmRzIE1vZGVsIHt9XG5leHBvcnQgY2xhc3MgVGVzdFR5cGUge31cblxuZXhwb3J0IGNsYXNzIENoaWxkcmVuIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5leHBvcnQgY2xhc3MgVmFsZW5jZUNoaWxkcmVuIGV4dGVuZHMgUmVsYXRpb25zaGlwIHt9XG5cbkNoaWxkcmVuLiRzaWRlcyA9IHtcbiAgcGFyZW50czoge1xuICAgIHR5cGU6IFRlc3RUeXBlLFxuICAgIGZpZWxkOiAncGFyZW50X2lkJyxcbiAgfSxcbiAgY2hpbGRyZW46IHtcbiAgICB0eXBlOiBUZXN0VHlwZSxcbiAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgfSxcbn07XG5DaGlsZHJlbi4kbmFtZSA9ICdjaGlsZHJlbic7XG5cblZhbGVuY2VDaGlsZHJlbi4kc2lkZXMgPSB7XG4gIHZhbGVuY2VQYXJlbnRzOiB7XG4gICAgdHlwZTogVGVzdFR5cGUsXG4gICAgZmllbGQ6ICdwYXJlbnRfaWQnLFxuICB9LFxuICB2YWxlbmNlQ2hpbGRyZW46IHtcbiAgICB0eXBlOiBUZXN0VHlwZSxcbiAgICBmaWVsZDogJ2NoaWxkX2lkJyxcbiAgfSxcbn07XG5cblZhbGVuY2VDaGlsZHJlbi4kZXh0cmFzID0gWydwZXJtJ107XG5WYWxlbmNlQ2hpbGRyZW4uJG5hbWUgPSAndmFsZW5jZV9jaGlsZHJlbic7XG5cblRlc3RUeXBlLiRuYW1lID0gJ3Rlc3RzJztcblRlc3RUeXBlLiRpZCA9ICdpZCc7XG5UZXN0VHlwZS4kZmllbGRzID0ge1xuICBpZDoge1xuICAgIHR5cGU6ICdudW1iZXInLFxuICB9LFxuICBuYW1lOiB7XG4gICAgdHlwZTogJ3N0cmluZycsXG4gIH0sXG4gIGV4dGVuZGVkOiB7XG4gICAgdHlwZTogJ29iamVjdCcsXG4gIH0sXG4gIGNoaWxkcmVuOiB7XG4gICAgdHlwZTogJ2hhc01hbnknLFxuICAgIHJlbGF0aW9uc2hpcDogQ2hpbGRyZW4sXG4gIH0sXG4gIHZhbGVuY2VDaGlsZHJlbjoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IFZhbGVuY2VDaGlsZHJlbixcbiAgfSxcbiAgcGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IENoaWxkcmVuLFxuICB9LFxuICB2YWxlbmNlUGFyZW50czoge1xuICAgIHR5cGU6ICdoYXNNYW55JyxcbiAgICByZWxhdGlvbnNoaXA6IFZhbGVuY2VDaGlsZHJlbixcbiAgfSxcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
