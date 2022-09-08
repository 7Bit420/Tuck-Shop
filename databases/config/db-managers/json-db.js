"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
exports.__esModule = true;
exports.handler = void 0;
var uuid = require("uuid");
var fs = require("fs");
var database = /** @class */ (function () {
    function database(path, initliser) {
        var _this = this;
        _database_instances.add(this);
        _database_config.set(this, void 0);
        _database_path.set(this, void 0);
        _database_manifest.set(this, void 0);
        (fs.existsSync(path) ?
            Promise.resolve() :
            __classPrivateFieldGet(this, _database_instances, "m", _database_constructDatabase).call(this, path)).then(function () { return __classPrivateFieldGet(_this, _database_instances, "m", _database_readDatabase).call(_this, path, initliser); });
        __classPrivateFieldSet(this, _database_path, path, "f");
    }
    database.prototype.setID = function (dbID, id) {
        __classPrivateFieldGet(this, _database_manifest, "f").set(id.toString(), dbID);
    };
    database.prototype.getEntry = function (key, raw) {
        if (this.hasEntry(key, raw)) {
            return JSON.parse(fs.readFileSync("".concat(__classPrivateFieldGet(this, _database_path, "f"), "/entrys/").concat(raw ? key : __classPrivateFieldGet(this, _database_manifest, "f").get(key))).toString('ascii'));
        }
        else
            throw new database.ENTNOTFOUND(key);
    };
    database.prototype.hasEntry = function (key, raw) {
        if (raw) {
            return fs.existsSync("".concat(__classPrivateFieldGet(this, _database_path, "f"), "/entrys/").concat(key));
        }
        else {
            return __classPrivateFieldGet(this, _database_manifest, "f").has(key);
        }
    };
    database.prototype.setEntry = function (key, value, raw) {
        var id;
        if (!__classPrivateFieldGet(this, _database_manifest, "f").has(key) || !fs.existsSync("".concat(__classPrivateFieldGet(this, _database_path, "f"), "/entrys/").concat(key))) {
            id = uuid.v4();
            if (raw) {
                __classPrivateFieldGet(this, _database_manifest, "f").set(key, id);
            }
        }
        else {
            id = raw ? key : __classPrivateFieldGet(this, _database_manifest, "f").get(key);
        }
        fs.writeFileSync("".concat(__classPrivateFieldGet(this, _database_path, "f"), "/entrys/").concat(id), JSON.stringify(value));
        return true;
    };
    database.prototype.removeEntry = function (key) {
        fs.unlinkSync("".concat(__classPrivateFieldGet(this, _database_path, "f"), "/entrys/").concat(__classPrivateFieldGet(this, _database_manifest, "f").get(key)));
        __classPrivateFieldGet(this, _database_manifest, "f")["delete"](key);
    };
    var _database_instances, _database_config, _database_path, _database_manifest, _database_constructDatabase, _database_readDatabase;
    _database_config = new WeakMap(), _database_path = new WeakMap(), _database_manifest = new WeakMap(), _database_instances = new WeakSet(), _database_constructDatabase = function _database_constructDatabase(path) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                fs.mkdirSync(path);
                fs.writeFileSync("".concat(path, "/manifest.json"), JSON.stringify({ entrys: [] }));
                fs.mkdirSync("".concat(path, "/entrys"));
                return [2 /*return*/];
            });
        });
    }, _database_readDatabase = function _database_readDatabase(path, initliser) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                __classPrivateFieldSet(this, _database_config, JSON.parse(fs.readFileSync("".concat(path, "/manifest.json")).toString('ascii')), "f");
                __classPrivateFieldSet(this, _database_manifest, new Map(__classPrivateFieldGet(this, _database_config, "f").entrys), "f");
                delete __classPrivateFieldGet(this, _database_config, "f").entrys;
                if (initliser) {
                    fs.readdirSync("".concat(path, "/entrys")).forEach(function (n) { return __classPrivateFieldGet(_this, _database_manifest, "f").set(initliser(n), n); });
                }
                return [2 /*return*/];
            });
        });
    };
    database.ENTNOTFOUND = /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1(id) {
            var _this = _super.call(this, 'Entry Not Found') || this;
            _this.id = id;
            return _this;
        }
        return class_1;
    }(Error));
    return database;
}());
exports.handler = database;
exports["default"] = database;
