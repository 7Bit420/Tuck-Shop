import * as uuid from 'uuid'
import * as fs from 'fs'

class database {

    #config
    #path: string
    #manifest: Map<string, string>
    setID(dbID: string, id: string | number) {
        this.#manifest.set(id.toString(), dbID)
    }

    static ENTNOTFOUND = class extends Error {

        id: string

        constructor(id: string) {
            super('Entry Not Found')
            this.id = id
        }
    }

    constructor(path: string, initliser?: (dbID: string) => string) {
        (
            fs.existsSync(path) ?
                Promise.resolve() :
                this.#constructDatabase(path)
        ).then(
            () => this.#readDatabase(path, initliser)
        )
        this.#path = path
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

    async#constructDatabase(path: string) {
        fs.mkdirSync(path)
        fs.writeFileSync(`${path}/manifest.json`, JSON.stringify({ entrys: [] }))
        fs.mkdirSync(`${path}/entrys`)
    }
    async#readDatabase(path: string, initliser?: (dbID: string) => string) {
        this.#config = JSON.parse(fs.readFileSync(`${path}/manifest.json`).toString('ascii'))
        this.#manifest = new Map(this.#config.entrys)
        delete this.#config.entrys

        if (initliser) {
            fs.readdirSync(`${path}/entrys`).forEach((n) => this.#manifest.set(initliser(n), n))
        }
    }

    getEntry(key: string, raw?: boolean) {
        if (this.hasEntry(key, raw)) {
            return JSON.parse(fs.readFileSync(`${this.#path}/entrys/${raw ? key : this.#manifest.get(key)}`).toString('ascii'))
        } else throw new database.ENTNOTFOUND(key)
    }
    hasEntry(key: string, raw?: boolean) {
        if (raw) {
            return fs.existsSync(`${this.#path}/entrys/${key}`)
        } else {
            return this.#manifest.has(key)
        }
    }
    setEntry(key: string, value: NodeJS.Dict<any>, raw?: boolean) {
        var id
        if (!this.#manifest.has(key) || !fs.existsSync(`${this.#path}/entrys/${key}`)) {
            id = uuid.v4()
            if (raw) {
                this.#manifest.set(key, id)
            }
        } else {
            id = raw ? key : this.#manifest.get(key)
        }
        fs.writeFileSync(`${this.#path}/entrys/${id}`, JSON.stringify(value))
        return true
    }
    removeEntry(key: string) {
        fs.unlinkSync(`${this.#path}/entrys/${this.#manifest.get(key)}`)
        this.#manifest.delete(key)
    }
}

export default database
export { database as handler }
