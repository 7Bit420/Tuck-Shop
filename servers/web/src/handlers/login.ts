import { client } from "../index";
import * as http from 'http'
import * as uuid from 'uuid'

var replaceChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function genBUUID() {
    return "xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxx".replace(/x/g, () =>
        replaceChars[Math.floor(Math.random() * replaceChars.length)])
}

async function handler(
    req: http.IncomingMessage,
    res: http.ServerResponse
) {
    const uid = (await client.send({
        db: 'user',
        methid: 'findEntry'
    }, [
        {
            username: req.headers.username,
            password: req.headers.password
        }
    ], 'database', true)).body.id

    var sessionID = genBUUID()

    client.send({
        db: 'sessions',
        method: 'set'
    }, [sessionID, { id: uid, validTill: Date.now() + 21600000 }], 'database', true)

    res.writeHead(200, {
        'Set-Cookie': `sessionid=${sessionID}`,
        'Content-Type': 'application/json'
    })
    res.write(JSON.stringify((await client.send({
        db: 'user',
        methid: 'getEntry'
    }, [
        uid, true
    ], 'database', true)).body))
    res.end()
}

const path = '/login'
const type = 'webhandle'
const config = {}

export { path, type, config, handler }