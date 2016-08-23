"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');

var Model = function () {
    function Model() {
        var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Model);

        this._storage = {};
        this.tableName = 'models';
        if (opts.id) {
            this._id = opts.id;
        } else {
            this.set(opts);
        }
    }

    _createClass(Model, [{
        key: 'set',
        value: function set(a, val) {
            var _this = this;

            if (typeof a === 'string') {
                this._storage[a] = val;
            } else {
                Object.keys(a).forEach(function (k) {
                    return _this._storage[k] = a[k];
                });
            }
        }
    }, {
        key: 'getStorageServices',
        value: function getStorageServices() {
            return this.constructor['_storageServices'];
        }
    }, {
        key: 'resolve',
        value: function resolve(key) {
            var _this2 = this;

            if (this._storage[key]) {
                return Promise.resolve(this._storage[key]);
            } else {
                return this.getStorageServices().reduce(function (thenable, service) {
                    return thenable.then(function (v) {
                        if (v === null) {
                            return service.read(_this2.tableName, _this2._id);
                        } else {
                            return v;
                        }
                    });
                }, Promise.resolve(null));
            }
        }
    }], [{
        key: 'addStorageService',
        value: function addStorageService(ds) {
            this._storageServices.push(ds);
        }
    }]);

    return Model;
}();

exports.Model = Model;