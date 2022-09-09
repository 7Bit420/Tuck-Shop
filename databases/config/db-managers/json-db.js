"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const uuid = require("uuid");
const fs = require("fs");
class database {
    #config;
    #path;
    #manifest;
    #lookUpinfo;
    setID(dbID, id) {
        this.#manifest.set(id.toString(), dbID);
    }
    static ENTNOTFOUND = class extends Error {
        id;
        constructor(id) {
            super('Entry Not Found');
            this.id = id;
        }
    };
    constructor(path, initliser) {
        (fs.existsSync(path) ?
            Promise.resolve() :
            this.#constructDatabase(path)).then(() => this.#readDatabase(path, initliser));
        this.#path = path;
        this.#lookUpinfo = [];
    }
    /*
    BINARY BASED DB
    4 Bytes [ Version, Templates Len, Entrys Len, Flags ]
    2 Bytes [ Version, Values Len ]
        2 Bytes [ Type, Len, Id ]
    2 Bytes [ Version, Type ]
        2 Bytes + Data [ Type, Id, ...Data ]
    
    JSON BASED DB
    JSON Manifest File ( File )
    | JSON Container ( Folder )
        | JSON Default File ( File )
        | JSON Files ( File )
    */
    async #constructDatabase(path) {
        fs.mkdirSync(path);
        fs.writeFileSync(`${path}/manifest.json`, JSON.stringify({ entrys: [] }));
        fs.mkdirSync(`${path}/entrys`);
    }
    async #readDatabase(path, initliser) {
        this.#config = JSON.parse(fs.readFileSync(`${path}/manifest.json`).toString('ascii'));
        this.#manifest = new Map(this.#config.entrys);
        delete this.#config.entrys;
        if (typeof initliser == 'function') {
            fs.readdirSync(`${path}/entrys`).forEach((n) => this.#manifest.set(initliser(n), n));
        }
        else if (Array.isArray(initliser)) {
            fs.readdirSync(`${path}/entrys`).forEach(t => {
                var n = { id: t };
                var file = JSON.parse(fs.readFileSync(`${path}/entrys/${t}`).toString('ascii'));
                for (var p of initliser) {
                    n[p] = file[p];
                }
                this.#lookUpinfo.push(n);
            });
        }
    }
    findEntry(query) {
        this.#lookUpinfo.find(t => {
            for (const p of query) {
                if (t[p] != query[p]) {
                    return false;
                }
            }
            return true;
        });
    }
    getEntry(key, raw) {
        if (this.hasEntry(key, raw)) {
            return JSON.parse(fs.readFileSync(`${this.#path}/entrys/${raw ? key : this.#manifest.get(key)}`).toString('ascii'));
        }
        else
            throw new database.ENTNOTFOUND(key);
    }
    hasEntry(key, raw) {
        if (raw) {
            return fs.existsSync(`${this.#path}/entrys/${key}`);
        }
        else {
            return this.#manifest.has(key);
        }
    }
    getEntrys() {
        return this.#manifest.values();
    }
    makeEntry(value, key) {
        var id = uuid.v4();
        while (fs.existsSync(`${this.#path}/entrys/${id}`)) {
            id = uuid.v4();
        }
        if (typeof key == 'undefined') {
        }
        else if (typeof key != 'undefined' && this.#manifest.has(key)) {
            return false;
        }
        else {
            this.#manifest.set(key ?? '', id);
        }
        ;
        fs.writeFileSync(`${this.#path}/entrys/${id}`, JSON.stringify(value));
        return id;
    }
    setEntry(key, value, raw) {
        var id;
        if (!this.#manifest.has(key) || !fs.existsSync(`${this.#path}/entrys/${key}`)) {
            id = uuid.v4();
            if (raw) {
                this.#manifest.set(key, id);
            }
        }
        else {
            id = raw ? key : this.#manifest.get(key);
        }
        fs.writeFileSync(`${this.#path}/entrys/${id}`, JSON.stringify(value));
        return true;
    }
    removeEntry(key) {
        fs.unlinkSync(`${this.#path}/entrys/${this.#manifest.get(key)}`);
        this.#manifest.delete(key);
    }
}
exports.handler = database;
exports.default = database;
