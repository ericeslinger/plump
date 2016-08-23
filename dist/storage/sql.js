"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');
var Knex = require('knex');

var SQLStorage = function () {
    function SQLStorage() {
        var dbOpts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, SQLStorage);

        var options = Object.assign({}, {
            client: 'postgres',
            debug: false,
            connection: {
                user: 'postgres',
                host: 'localhost',
                port: 5432,
                password: '',
                charset: 'utf8'
            },
            pool: {
                max: 20,
                min: 0
            }
        }, dbOpts);
        this._knex = Knex(options);
    }

    _createClass(SQLStorage, [{
        key: 'create',
        value: function create(t, v) {
            return Promise.resolve(this._knex.insert(v).into(t));
        }
    }, {
        key: 'read',
        value: function read(t, id) {
            return Promise.resolve(this._knex(t).where({ id: id }).select());
        }
    }, {
        key: 'update',
        value: function update(t, id, v) {
            return Promise.resolve(this._knex(t).where({ id: id }).update(v));
        }
    }, {
        key: 'delete',
        value: function _delete(t, id) {
            return Promise.resolve(this._knex(t).where({ id: id }).delete());
        }
    }, {
        key: 'query',
        value: function query(q) {
            return Promise.resolve(this._knex.raw(q.query)).then(function (d) {
                return d.rows;
            });
        }
    }]);

    return SQLStorage;
}();

exports.SQLStorage = SQLStorage;