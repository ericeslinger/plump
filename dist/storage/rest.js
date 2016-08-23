"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var axios = require('axios');

var RestStorage = function () {
    function RestStorage() {
        var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, RestStorage);

        var options = Object.assign({}, {
            baseURL: 'http://localhost/api'
        }, opts);
        this._axios = axios.create(options);
    }

    _createClass(RestStorage, [{
        key: 'create',
        value: function create(t, v) {
            return this._axios.post('/' + t, v);
        }
    }, {
        key: 'read',
        value: function read(t, id) {
            return this._axios.get('/' + t + '/' + id).then(function (response) {
                return response.data;
            });
        }
    }, {
        key: 'update',
        value: function update(t, id, v) {
            return this._axios.put('/' + t + '/' + id, v).then(function (response) {
                return response.data;
            });
        }
    }, {
        key: 'delete',
        value: function _delete(t, id) {
            return this._axios.delete('/' + t + '/' + id).then(function (response) {
                return response.data;
            });
        }
    }, {
        key: 'query',
        value: function query(q) {
            return this._axios.get('/' + q.type, { params: q.query }).then(function (response) {
                return response.data;
            });
        }
    }]);

    return RestStorage;
}();

exports.RestStorage = RestStorage;