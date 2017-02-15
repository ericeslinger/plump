'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JSONApi = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mergeOptions = require('merge-options');

var _mergeOptions2 = _interopRequireDefault(_mergeOptions);

var _model = require('./model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $types = Symbol('$types');

var JSONApi = exports.JSONApi = function () {
  function JSONApi() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, JSONApi);

    var options = Object.assign({}, {
      storage: [],
      types: []
    }, opts);

    this[$types] = {};

    if (!Array.isArray(options.schema)) {
      options.schema = [options.schema];
    }
    this.$$addTypesFromSchema(options.schema);
  }

  _createClass(JSONApi, [{
    key: 'parse',
    value: function parse(json) {
      var _this = this;

      var data = typeof json === 'string' ? JSON.parse(json) : json;
      var type = this.type(data.data.type);
      var relationships = this.$$parseRelationships(data.relationships);

      var requested = Object.assign(_defineProperty({}, type.$id, data.id), data.attributes, relationships);
      this.save();

      data.included.forEach(function (inclusion) {
        var childType = _this.type(inclusion.type);
        var childId = inclusion.id;
        var childData = Object.assign({}, inclusion.attributes, _this.parseRelationships(inclusion.relationships));
        var updatedFields = [_model.$self].concat(Object.keys(inclusion.relationships));

        _this.notifyUpdate(childType, childId, childData, updatedFields);
      });

      return requested;
    }
  }, {
    key: 'encode',
    value: function encode(_ref, opts) {
      var root = _ref.root,
          extended = _ref.extended;

      var type = this.$$type(root.type);
      var options = Object.assign({}, {
        domain: 'https://example.com',
        path: '/api'
      }, opts);
      var prefix = '' + (options.domain || '') + (options.path || '');

      var includedPkg = this.$$includedPackage(extended, opts);
      var attributes = {};

      Object.keys(type.$fields).filter(function (field) {
        return field !== type.$id && type.$fields[field].type !== 'hasMany';
      }).forEach(function (key) {
        attributes[key] = root[key];
      });

      var retVal = {
        links: { self: prefix + '/' + type.$name + '/' + root.id },
        data: { type: type.$name, id: root.id },
        attributes: attributes,
        included: includedPkg
      };

      var relationships = this.$$relatedPackage(root, opts);
      if (Object.keys(relationships).length > 0) {
        retVal.relationships = relationships;
      }

      return retVal;
    }
  }, {
    key: '$$addTypesFromSchema',
    value: function $$addTypesFromSchema(schema) {
      var _this3 = this;

      var ExtendingModel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _model.Model;

      Object.keys(schema).forEach(function (k) {
        var DynamicModel = function (_ExtendingModel) {
          _inherits(DynamicModel, _ExtendingModel);

          function DynamicModel() {
            _classCallCheck(this, DynamicModel);

            return _possibleConstructorReturn(this, (DynamicModel.__proto__ || Object.getPrototypeOf(DynamicModel)).apply(this, arguments));
          }

          return DynamicModel;
        }(ExtendingModel);

        DynamicModel.fromJSON(schema[k]);
        _this3.$$addType(DynamicModel);
      });
    }
  }, {
    key: '$$addType',
    value: function $$addType(T) {
      if (this[$types][T.$name] === undefined) {
        this[$types][T.$name] = T;
      } else {
        throw new Error('Duplicate Type registered: ' + T.$name);
      }
    }
  }, {
    key: '$$type',
    value: function $$type(T) {
      return this[$types][T];
    }
  }, {
    key: '$$types',
    value: function $$types() {
      return Object.keys(this[$types]);
    }
  }, {
    key: '$$parseRelationships',
    value: function $$parseRelationships(data) {
      var type = this.$$type(data.data.type);

      return Object.keys(data.relationships).map(function (relName) {
        var relationship = type.$fields[relName].relationship;
        return _defineProperty({}, relName, data.relationships[relName].data.map(function (child) {
          var _ref2;

          return _ref2 = {}, _defineProperty(_ref2, relationship.$sides[relName].self.field, data.id), _defineProperty(_ref2, relationship.$sides[relName].other.field, child.id), _ref2;
        }));
      }).reduce(function (acc, curr) {
        return (0, _mergeOptions2.default)(acc, curr);
      }, {});
    }
  }, {
    key: '$$relatedPackage',
    value: function $$relatedPackage(root) {
      var _this4 = this;

      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var type = this.$$type(root.type);
      var options = Object.assign({}, { include: this.$$type(root.type).$include }, opts);
      var prefix = '' + (options.domain || '') + (options.path || '');
      var fields = Object.keys(options.include).filter(function (rel) {
        return root[rel] && root[rel].length;
      });

      var retVal = {};
      fields.forEach(function (field) {
        var childSpec = type.$fields[field].relationship.$sides[field].other;
        retVal[field] = {
          links: {
            related: prefix + '/' + type.$name + '/' + root[type.$id] + '/' + field
          },
          data: root[field].map(function (child) {
            return { type: _this4.$$type(childSpec.type).$name, id: child[childSpec.field] };
          })
        };
      });

      return retVal;
    }
  }, {
    key: '$$packageForInclusion',
    value: function $$packageForInclusion(data) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var prefix = '' + (opts.domain || '') + (opts.path || '');
      var type = this.$$type(data.type);

      var relationships = this.$$relatedPackage(data, opts);
      var attributes = {};
      Object.keys(type.$fields).filter(function (field) {
        return field !== type.$id && type.$fields[field].type !== 'hasMany';
      }).forEach(function (field) {
        if (data[field] !== 'undefined') {
          attributes[field] = data[field];
        }
      });

      var retVal = {
        type: data.type,
        id: data.id,
        attributes: attributes,
        links: {
          self: prefix + '/' + type.$name + '/' + data.id
        }
      };

      if (Object.keys(relationships).length > 0) {
        retVal.relationships = relationships;
      }

      return retVal;
    }
  }, {
    key: '$$includedPackage',
    value: function $$includedPackage() {
      var _this5 = this;

      var extended = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var options = Object.assign({}, {
        domain: 'https://example.com',
        path: '/api'
      }, opts);
      return Object.keys(extended).map(function (relationship) {
        return extended[relationship].map(function (child) {
          return _this5.$$packageForInclusion(child, options);
        });
      }).reduce(function (acc, curr) {
        return acc.concat(curr);
      });
    }
  }]);

  return JSONApi;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzb25BcGkuanMiXSwibmFtZXMiOlsiJHR5cGVzIiwiU3ltYm9sIiwiSlNPTkFwaSIsIm9wdHMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwic3RvcmFnZSIsInR5cGVzIiwiQXJyYXkiLCJpc0FycmF5Iiwic2NoZW1hIiwiJCRhZGRUeXBlc0Zyb21TY2hlbWEiLCJqc29uIiwiZGF0YSIsIkpTT04iLCJwYXJzZSIsInR5cGUiLCJyZWxhdGlvbnNoaXBzIiwiJCRwYXJzZVJlbGF0aW9uc2hpcHMiLCJyZXF1ZXN0ZWQiLCIkaWQiLCJpZCIsImF0dHJpYnV0ZXMiLCJzYXZlIiwiaW5jbHVkZWQiLCJmb3JFYWNoIiwiY2hpbGRUeXBlIiwiaW5jbHVzaW9uIiwiY2hpbGRJZCIsImNoaWxkRGF0YSIsInBhcnNlUmVsYXRpb25zaGlwcyIsInVwZGF0ZWRGaWVsZHMiLCJjb25jYXQiLCJrZXlzIiwibm90aWZ5VXBkYXRlIiwicm9vdCIsImV4dGVuZGVkIiwiJCR0eXBlIiwiZG9tYWluIiwicGF0aCIsInByZWZpeCIsImluY2x1ZGVkUGtnIiwiJCRpbmNsdWRlZFBhY2thZ2UiLCIkZmllbGRzIiwiZmlsdGVyIiwiZmllbGQiLCJrZXkiLCJyZXRWYWwiLCJsaW5rcyIsInNlbGYiLCIkbmFtZSIsIiQkcmVsYXRlZFBhY2thZ2UiLCJsZW5ndGgiLCJFeHRlbmRpbmdNb2RlbCIsImsiLCJEeW5hbWljTW9kZWwiLCJmcm9tSlNPTiIsIiQkYWRkVHlwZSIsIlQiLCJ1bmRlZmluZWQiLCJFcnJvciIsIm1hcCIsInJlbGF0aW9uc2hpcCIsInJlbE5hbWUiLCIkc2lkZXMiLCJvdGhlciIsImNoaWxkIiwicmVkdWNlIiwiYWNjIiwiY3VyciIsImluY2x1ZGUiLCIkaW5jbHVkZSIsImZpZWxkcyIsInJlbCIsImNoaWxkU3BlYyIsInJlbGF0ZWQiLCIkJHBhY2thZ2VGb3JJbmNsdXNpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBRUE7Ozs7Ozs7Ozs7OztB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QXVCRCxHQUF2QixDQUEyQjtBQUFBLGlCQUFTLE9BQUtlLHFCQUFMLENBQTJCVixLQUEzQixFQUFrQy9ELE9BQWxDLENBQVQ7QUFBQSxTQUEzQixDQUFQO0FBQ0QsT0FGTSxFQUVKZ0UsTUFGSSxDQUVHLFVBQUNDLEdBQUQsRUFBTUMsSUFBTjtBQUFBLGVBQWVELElBQUlwQyxNQUFKLENBQVdxQyxJQUFYLENBQWY7QUFBQSxPQUZILENBQVA7QUFHRCIsImZpbGUiOiJqc29uQXBpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1lcmdlT3B0aW9ucyBmcm9tICdtZXJnZS1vcHRpb25zJztcblxuaW1wb3J0IHsgTW9kZWwsICRzZWxmIH0gZnJvbSAnLi9tb2RlbCc7XG5cbmNvbnN0ICR0eXBlcyA9IFN5bWJvbCgnJHR5cGVzJyk7XG5cbmV4cG9ydCBjbGFzcyBKU09OQXBpIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgIHN0b3JhZ2U6IFtdLFxuICAgICAgdHlwZXM6IFtdLFxuICAgIH0sIG9wdHMpO1xuXG4gICAgdGhpc1skdHlwZXNdID0ge307XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5zY2hlbWEpKSB7XG4gICAgICBvcHRpb25zLnNjaGVtYSA9IFtvcHRpb25zLnNjaGVtYV07XG4gICAgfVxuICAgIHRoaXMuJCRhZGRUeXBlc0Zyb21TY2hlbWEob3B0aW9ucy5zY2hlbWEpO1xuICB9XG5cbiAgcGFyc2UoanNvbikge1xuICAgIGNvbnN0IGRhdGEgPSB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGpzb24pIDoganNvbjtcbiAgICBjb25zdCB0eXBlID0gdGhpcy50eXBlKGRhdGEuZGF0YS50eXBlKTtcbiAgICBjb25zdCByZWxhdGlvbnNoaXBzID0gdGhpcy4kJHBhcnNlUmVsYXRpb25zaGlwcyhkYXRhLnJlbGF0aW9uc2hpcHMpO1xuXG4gICAgY29uc3QgcmVxdWVzdGVkID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgW3R5cGUuJGlkXTogZGF0YS5pZCxcbiAgICAgIH0sXG4gICAgICBkYXRhLmF0dHJpYnV0ZXMsXG4gICAgICByZWxhdGlvbnNoaXBzXG4gICAgKTtcbiAgICB0aGlzLnNhdmUoKTtcblxuICAgIGRhdGEuaW5jbHVkZWQuZm9yRWFjaChpbmNsdXNpb24gPT4ge1xuICAgICAgY29uc3QgY2hpbGRUeXBlID0gdGhpcy50eXBlKGluY2x1c2lvbi50eXBlKTtcbiAgICAgIGNvbnN0IGNoaWxkSWQgPSBpbmNsdXNpb24uaWQ7XG4gICAgICBjb25zdCBjaGlsZERhdGEgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICB7fSxcbiAgICAgICAgaW5jbHVzaW9uLmF0dHJpYnV0ZXMsXG4gICAgICAgIHRoaXMucGFyc2VSZWxhdGlvbnNoaXBzKGluY2x1c2lvbi5yZWxhdGlvbnNoaXBzKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGaWVsZHMgPSBbJHNlbGZdLmNvbmNhdChPYmplY3Qua2V5cyhpbmNsdXNpb24ucmVsYXRpb25zaGlwcykpO1xuXG4gICAgICB0aGlzLm5vdGlmeVVwZGF0ZShjaGlsZFR5cGUsIGNoaWxkSWQsIGNoaWxkRGF0YSwgdXBkYXRlZEZpZWxkcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVxdWVzdGVkO1xuICB9XG5cbiAgZW5jb2RlKHsgcm9vdCwgZXh0ZW5kZWQgfSwgb3B0cykge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLiQkdHlwZShyb290LnR5cGUpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGRvbWFpbjogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICAgICAgICBwYXRoOiAnL2FwaScsXG4gICAgICB9LFxuICAgICAgb3B0c1xuICAgICk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7b3B0aW9ucy5kb21haW4gfHwgJyd9JHtvcHRpb25zLnBhdGggfHwgJyd9YDtcblxuICAgIGNvbnN0IGluY2x1ZGVkUGtnID0gdGhpcy4kJGluY2x1ZGVkUGFja2FnZShleHRlbmRlZCwgb3B0cyk7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXModHlwZS4kZmllbGRzKS5maWx0ZXIoZmllbGQgPT4ge1xuICAgICAgcmV0dXJuIGZpZWxkICE9PSB0eXBlLiRpZCAmJiB0eXBlLiRmaWVsZHNbZmllbGRdLnR5cGUgIT09ICdoYXNNYW55JztcbiAgICB9KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBhdHRyaWJ1dGVzW2tleV0gPSByb290W2tleV07XG4gICAgfSk7XG5cbiAgICBjb25zdCByZXRWYWwgPSB7XG4gICAgICBsaW5rczogeyBzZWxmOiBgJHtwcmVmaXh9LyR7dHlwZS4kbmFtZX0vJHtyb290LmlkfWAgfSxcbiAgICAgIGRhdGE6IHsgdHlwZTogdHlwZS4kbmFtZSwgaWQ6IHJvb3QuaWQgfSxcbiAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXG4gICAgICBpbmNsdWRlZDogaW5jbHVkZWRQa2csXG4gICAgfTtcblxuICAgIGNvbnN0IHJlbGF0aW9uc2hpcHMgPSB0aGlzLiQkcmVsYXRlZFBhY2thZ2Uocm9vdCwgb3B0cyk7XG4gICAgaWYgKE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcHMpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzID0gcmVsYXRpb25zaGlwcztcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0VmFsO1xuICB9XG5cbiAgJCRhZGRUeXBlc0Zyb21TY2hlbWEoc2NoZW1hLCBFeHRlbmRpbmdNb2RlbCA9IE1vZGVsKSB7XG4gICAgT2JqZWN0LmtleXMoc2NoZW1hKS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICBjbGFzcyBEeW5hbWljTW9kZWwgZXh0ZW5kcyBFeHRlbmRpbmdNb2RlbCB7fVxuICAgICAgRHluYW1pY01vZGVsLmZyb21KU09OKHNjaGVtYVtrXSk7XG4gICAgICB0aGlzLiQkYWRkVHlwZShEeW5hbWljTW9kZWwpO1xuICAgIH0pO1xuICB9XG5cbiAgJCRhZGRUeXBlKFQpIHtcbiAgICBpZiAodGhpc1skdHlwZXNdW1QuJG5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXNbJHR5cGVzXVtULiRuYW1lXSA9IFQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIFR5cGUgcmVnaXN0ZXJlZDogJHtULiRuYW1lfWApO1xuICAgIH1cbiAgfVxuXG4gICQkdHlwZShUKSB7XG4gICAgcmV0dXJuIHRoaXNbJHR5cGVzXVtUXTtcbiAgfVxuXG4gICQkdHlwZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXNbJHR5cGVzXSk7XG4gIH1cblxuICAkJHBhcnNlUmVsYXRpb25zaGlwcyhkYXRhKSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuJCR0eXBlKGRhdGEuZGF0YS50eXBlKTtcblxuICAgIHJldHVybiBPYmplY3Qua2V5cyhkYXRhLnJlbGF0aW9uc2hpcHMpLm1hcChyZWxOYW1lID0+IHtcbiAgICAgIGNvbnN0IHJlbGF0aW9uc2hpcCA9IHR5cGUuJGZpZWxkc1tyZWxOYW1lXS5yZWxhdGlvbnNoaXA7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBbcmVsTmFtZV06IGRhdGEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5kYXRhLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFtyZWxhdGlvbnNoaXAuJHNpZGVzW3JlbE5hbWVdLnNlbGYuZmllbGRdOiBkYXRhLmlkLFxuICAgICAgICAgICAgW3JlbGF0aW9uc2hpcC4kc2lkZXNbcmVsTmFtZV0ub3RoZXIuZmllbGRdOiBjaGlsZC5pZCxcbiAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgIH07XG4gICAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IG1lcmdlT3B0aW9ucyhhY2MsIGN1cnIpLCB7fSk7XG4gIH1cblxuICAkJHJlbGF0ZWRQYWNrYWdlKHJvb3QsIG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IHR5cGUgPSB0aGlzLiQkdHlwZShyb290LnR5cGUpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB7IGluY2x1ZGU6IHRoaXMuJCR0eXBlKHJvb3QudHlwZSkuJGluY2x1ZGUgfSxcbiAgICAgIG9wdHNcbiAgICApO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke29wdGlvbnMuZG9tYWluIHx8ICcnfSR7b3B0aW9ucy5wYXRoIHx8ICcnfWA7XG4gICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmtleXMob3B0aW9ucy5pbmNsdWRlKS5maWx0ZXIocmVsID0+IHJvb3RbcmVsXSAmJiByb290W3JlbF0ubGVuZ3RoKTtcblxuICAgIGNvbnN0IHJldFZhbCA9IHt9O1xuICAgIGZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgIGNvbnN0IGNoaWxkU3BlYyA9IHR5cGUuJGZpZWxkc1tmaWVsZF0ucmVsYXRpb25zaGlwLiRzaWRlc1tmaWVsZF0ub3RoZXI7XG4gICAgICByZXRWYWxbZmllbGRdID0ge1xuICAgICAgICBsaW5rczoge1xuICAgICAgICAgIHJlbGF0ZWQ6IGAke3ByZWZpeH0vJHt0eXBlLiRuYW1lfS8ke3Jvb3RbdHlwZS4kaWRdfS8ke2ZpZWxkfWAsXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGE6IHJvb3RbZmllbGRdLm1hcChjaGlsZCA9PiB7XG4gICAgICAgICAgcmV0dXJuIHsgdHlwZTogdGhpcy4kJHR5cGUoY2hpbGRTcGVjLnR5cGUpLiRuYW1lLCBpZDogY2hpbGRbY2hpbGRTcGVjLmZpZWxkXSB9O1xuICAgICAgICB9KSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmV0VmFsO1xuICB9XG5cbiAgJCRwYWNrYWdlRm9ySW5jbHVzaW9uKGRhdGEsIG9wdHMgPSB7fSkge1xuICAgIGNvbnN0IHByZWZpeCA9IGAke29wdHMuZG9tYWluIHx8ICcnfSR7b3B0cy5wYXRoIHx8ICcnfWA7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuJCR0eXBlKGRhdGEudHlwZSk7XG5cbiAgICBjb25zdCByZWxhdGlvbnNoaXBzID0gdGhpcy4kJHJlbGF0ZWRQYWNrYWdlKGRhdGEsIG9wdHMpO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0eXBlLiRmaWVsZHMpLmZpbHRlcihmaWVsZCA9PiB7XG4gICAgICByZXR1cm4gZmllbGQgIT09IHR5cGUuJGlkICYmIHR5cGUuJGZpZWxkc1tmaWVsZF0udHlwZSAhPT0gJ2hhc01hbnknO1xuICAgIH0pLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgaWYgKGRhdGFbZmllbGRdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBhdHRyaWJ1dGVzW2ZpZWxkXSA9IGRhdGFbZmllbGRdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgcmV0VmFsID0ge1xuICAgICAgdHlwZTogZGF0YS50eXBlLFxuICAgICAgaWQ6IGRhdGEuaWQsXG4gICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgbGlua3M6IHtcbiAgICAgICAgc2VsZjogYCR7cHJlZml4fS8ke3R5cGUuJG5hbWV9LyR7ZGF0YS5pZH1gLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgaWYgKE9iamVjdC5rZXlzKHJlbGF0aW9uc2hpcHMpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldFZhbC5yZWxhdGlvbnNoaXBzID0gcmVsYXRpb25zaGlwcztcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0VmFsO1xuICB9XG5cbiAgJCRpbmNsdWRlZFBhY2thZ2UoZXh0ZW5kZWQgPSB7fSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluOiAnaHR0cHM6Ly9leGFtcGxlLmNvbScsXG4gICAgICAgIHBhdGg6ICcvYXBpJyxcbiAgICAgIH0sXG4gICAgICBvcHRzXG4gICAgKTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoZXh0ZW5kZWQpLm1hcChyZWxhdGlvbnNoaXAgPT4ge1xuICAgICAgcmV0dXJuIGV4dGVuZGVkW3JlbGF0aW9uc2hpcF0ubWFwKGNoaWxkID0+IHRoaXMuJCRwYWNrYWdlRm9ySW5jbHVzaW9uKGNoaWxkLCBvcHRpb25zKSk7XG4gICAgfSkucmVkdWNlKChhY2MsIGN1cnIpID0+IGFjYy5jb25jYXQoY3VycikpO1xuICB9XG59XG4iXX0=
