"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var memory_1 = require("./memory");
function potato() {
    var myStore = new memory_1.MemoryStore({ terminal: true });
    return myStore.writeAttributes({ type: 'foo', id: 1 })
        .then(function () { return myStore.logStore(); });
}
potato();
