import * as http from 'http'
import * as fs from 'fs'
import { client, smartObject } from './client'

const DBPWD = process.env.DBPWD
const PWD = __dirname

import * as db from './database'

const wsClient = new client('database', 5000)

wsClient.on('message', (head, body, res) => {

    if (db.databases.has(head.db)) {
        var handler = db.dbHandlers.get(String(head.db))
        if (typeof handler[String(head.method)] != 'function') return res({ type: 'error' }, { code: 405 })

        try {
            res({ type: 'response' }, handler[String(head.method)](...body))
            return
        } catch (err) {
            res({ type: 'error' }, { code: 500, err })
        }
    } else {
        res({ type: 'error' }, { code: 404 })
    }

})

export { PWD, DBPWD }
