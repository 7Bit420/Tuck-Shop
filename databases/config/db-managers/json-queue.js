"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const uuid = require("uuid");
const fs = require("fs");
class jsonQueue {
    #path = '';
    #queue;
    constructor(path) {
        this.#path = path;
        this.#queue = [];
        if (!fs.existsSync(path))
            fs.mkdirSync(path);
    }
    addItem(data) {
        var id = uuid.v4();
        while (fs.existsSync(`${this.#path}/${id}.json`)) {
            id = uuid.v4();
        }
        fs.writeFileSync(`${this.#path}/${id}.json`, JSON.stringify(data));
        this.#queue.push(id);
        return id;
    }
    removeItem(id) {
        this.#queue.slice(this.#queue.findIndex(t => t == id), 1);
        var data = JSON.parse(fs.readFileSync(`${this.#path}/${id}.json`).toString('ascii'));
        fs.unlinkSync(`${this.#path}/${id}.json`);
        return data;
    }
    getItem(at) {
        return this.#queue[at] ?? (() => { throw new Error('Out of bounds'); })();
    }
    getSize() {
        return this.#queue.length;
    }
}
exports.handler = jsonQueue;
