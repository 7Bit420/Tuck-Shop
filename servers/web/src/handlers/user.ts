import { client } from "../index";
import * as http from 'http'
import * as uuid from 'uuid'

async function handler(
    req: http.IncomingMessage,
    res: http.ServerResponse
) {
    var cookies = Object.fromEntries(req.headers.cookie.split(';').map(t => t.trim().split('=')))

    const uid = (await client.send({
        db: 'sessions',
        method: 'get'
    }, [cookies['sessionid']], 'database', true))



    if (uid.body?.validTill < Date.now()) {
        res.writeHead(400, 'invalid session', { 'Content-Type': 'application/json' })
        res.write(`{ "code": 400, "message": "invalid session", "ecode": "INVSES" }`)
        client.send({
            db: 'sessions',
            method: 'delete'
        }, [cookies['sessionid']], 'database')
        return res.end()
    }

    res.writeHead(200, {
        'Content-Type': 'application/json'
    })

    var user = (await client.send({
        db: 'users',
        method: 'getEntry'
    }, [
        uid.body.id, true
    ], 'database', true))

    res.write(JSON.stringify(user.body))
    res.end()
}

const path = '/user'
const type = 'webhandle'
const config = {}

export { path, type, config, handler }