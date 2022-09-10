import { PWD, DBPWD } from './index'
import * as yaml from 'yaml'
import * as path from 'path'
import * as fs from 'fs'

const config = yaml.parse(fs.readFileSync(`${DBPWD}/config/dbconfig.yml`).toString('ascii'))
const handlerInfo = new Map()
const handlers = new Map()
const databases = new Map()
const dbHandlers: Map<string, any & database> = new Map()

for (let i = 0; i < config.dbHandlers.length; i++) {
    const handler = config.dbHandlers[i];
    handlerInfo.set(handler.name, handler)

    switch (handler.type) {
        case 'js':
            const handlerClass = require(`${DBPWD}/config/db-managers/${handler.file}`).handler
            handlers.set(handler.name, handlerClass)
            break;
    }
}

for (let i = 0; i < config.databases.length; i++) {
    const db = config.databases[i];
    databases.set(db.name, db)
    switch (handlerInfo.get(db.type).type) {
        case 'js':
            dbHandlers.set(db.name, new (handlers.get(db.type))( path.resolve(DBPWD, db.path), ...(db?.args ?? []) ))
            break;
    }
}

type dbEntry = NodeJS.Dict<string | number | boolean>
type dbTemplate = NodeJS.Dict<[string, number]>

interface database {
    getEntry(id: string): dbEntry;
    setEntry(id: string, value: dbEntry): boolean;
    hasEntry(id: string): boolean;
    deleteEntry(id: string): boolean;
}

export {
    dbEntry, database,
    handlerInfo, handlers,
    databases, dbHandlers
}
