"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var axios = require("axios");
var storage_1 = require("./storage");
var $axios = Symbol('$axios');
var bluebird_1 = require("bluebird");
var RestStorage = (function (_super) {
    __extends(RestStorage, _super);
    function RestStorage(opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this, opts) || this;
        var options = Object.assign({}, {
            baseURL: 'http://localhost/api',
        }, opts);
        _this[$axios] = options.axios || axios.create(options);
        return _this;
    }
    RestStorage.prototype.rest = function (options) {
        return this[$axios](options);
    };
    RestStorage.prototype.write = function (t, v) {
        var _this = this;
        return bluebird_1.default.resolve()
            .then(function () {
            if (v[t.$id]) {
                return _this[$axios].patch("/" + t.$name + "/" + v[t.$id], v);
            }
            else if (_this.terminal) {
                return _this[$axios].post("/" + t.$name, v);
            }
            else {
                throw new Error('Cannot create new content in a non-terminal store');
            }
        })
            .then(function (d) { return d.data[t.$name][0]; })
            .then(function (result) { return _this.notifyUpdate(t, result[t.$id], result).then(function () { return result; }); });
    };
    RestStorage.prototype.readOne = function (t, id) {
        var _this = this;
        return bluebird_1.default.resolve()
            .then(function () { return _this[$axios].get("/" + t.$name + "/" + id); })
            .then(function (response) {
            return response.data[t.$name][0];
        }).catch(function (err) {
            if (err.response && err.response.status === 404) {
                return null;
            }
            else {
                throw err;
            }
        });
    };
    RestStorage.prototype.readMany = function (t, id, relationship) {
        return this[$axios].get("/" + t.$name + "/" + id + "/" + relationship)
            .then(function (response) { return response.data; })
            .catch(function (err) {
            if (err.response && err.response.status === 404) {
                return [];
            }
            else {
                throw err;
            }
        });
    };
    RestStorage.prototype.add = function (type, id, relationshipTitle, childId, extras) {
        var _this = this;
        var relationshipBlock = type.$fields[relationshipTitle];
        var sideInfo = relationshipBlock.relationship.$sides[relationshipTitle];
        var newField = (_a = {}, _a[sideInfo.self.field] = id, _a[sideInfo.other.field] = childId, _a);
        if (relationshipBlock.relationship.$extras) {
            Object.keys(relationshipBlock.relationship.$extras).forEach(function (extra) {
                newField[extra] = extras[extra];
            });
        }
        return this[$axios].put("/" + type.$name + "/" + id + "/" + relationshipTitle, newField)
            .then(function () { return _this.notifyUpdate(type, id, null, relationshipTitle); });
        var _a;
    };
    RestStorage.prototype.remove = function (t, id, relationshipTitle, childId) {
        var _this = this;
        return this[$axios].delete("/" + t.$name + "/" + id + "/" + relationshipTitle + "/" + childId)
            .then(function () { return _this.notifyUpdate(t, id, null, relationshipTitle); });
    };
    RestStorage.prototype.modifyRelationship = function (t, id, relationshipTitle, childId, extras) {
        var _this = this;
        return this[$axios].patch("/" + t.$name + "/" + id + "/" + relationshipTitle + "/" + childId, extras)
            .then(function () { return _this.notifyUpdate(t, id, null, relationshipTitle); });
    };
    RestStorage.prototype.delete = function (t, id) {
        return this[$axios].delete("/" + t.$name + "/" + id)
            .then(function (response) {
            return response.data;
        });
    };
    RestStorage.prototype.query = function (q) {
        return this[$axios].get("/" + q.type, { params: q.query })
            .then(function (response) {
            return response.data;
        });
    };
    return RestStorage;
}(storage_1.Storage));
exports.RestStorage = RestStorage;
