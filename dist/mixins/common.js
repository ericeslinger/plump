"use strict";

function ensureStorage(proto) {
    if (!proto._storage) {
        proto._storage = { foo: ' bar' };
    }
}
exports.ensureStorage = ensureStorage;