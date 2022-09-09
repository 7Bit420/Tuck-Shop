"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
class jsonQueue extends Map {
    constructor(path) {
        super();
    }
    getSize() { return this.size; }
}
exports.handler = jsonQueue;
