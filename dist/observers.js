'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.observeAttribute = observeAttribute;
exports.observeChild = observeChild;
exports.observeList = observeList;

var _rxjs = require('rxjs');

var _deepEqual = require('deep-equal');

var deepEqual = _interopRequireWildcard(_deepEqual);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function observeAttribute(o, attr) {
    return o.filter(function (v) {
        return !!v;
    }).map(function (v) {
        return v.attributes[attr];
    }).distinctUntilChanged(deepEqual);
}
function observeChild(o, rel, plump) {
    return observeList(o.filter(function (v) {
        return !!v;
    }).map(function (v) {
        return v.relationships[rel];
    }), plump);
}
function observeList(list, plump) {
    var cache = {};
    return list.distinctUntilChanged(deepEqual).map(function (children) {
        return children.map(function (item) {
            if (!cache[item.id]) {
                cache[item.id] = plump.find(item);
            }
            cache[item.id].meta = item.meta;
            return cache[item.id];
        });
    }).map(function (refs) {
        return refs.map(function (ref) {
            return {
                model: ref,
                meta: ref.meta
            };
        });
    }).switchMap(function (coms) {
        if (!coms || coms.length === 0) {
            return _rxjs.Observable.of([]);
        } else {
            return _rxjs.Observable.combineLatest(coms.map(function (ed) {
                return ed.model.asObservable(['attributes']).catch(function () {
                    return _rxjs.Observable.of(ed.model.empty());
                }).map(function (v) {
                    return Object.assign(v, { meta: ed.meta });
                });
            })).map(function (children) {
                return children.filter(function (child) {
                    return !child.empty;
                });
            });
        }
    }).startWith([]).shareReplay(1);
}