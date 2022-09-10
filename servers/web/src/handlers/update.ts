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

    switch (req.method) {
        case 'GET':
            var url = new URL(req.url, `http://${req.headers.host}`);

            client.send({
                db: 'users',
                method: 'editEntry'
            }, [uid.body.id, Object.fromEntries(url.searchParams), true], 'database', true)
                .then((data) => {
                    switch (data.head.type) {
                        case 'response':
                            res.writeHead(200, { 'Content-Type': 'application/json' })
                            res.write(`{ "code": 200, "message": "Edited User", "ecode": "VLDEDT" }`)
                            res.end()
                            break;
                        case 'error':
                            res.writeHead(500)
                            res.end()
                            break;
                    }
                })

            break;
        case 'PUT':
        case 'PATCH':
            var data = {}

            switch (req.headers["content-type"]) {
                case 'application/json':
                    var raw = ''
                    req.on('data', (d) => raw += d.toString('ascii'))
                    await new Promise(res => req.on('end', () => { data = JSON.parse(raw); res(undefined) }))
                    break;
                case 'application/x-www-form-urlencoded':
                    var raw = ''
                    req.on('data', (d) => raw += d.toString('ascii'))
                    await new Promise(res => req.on('end', () => {
                        data = Object.fromEntries(raw.split('&').map(t => t.split('=').map(decodeURIComponent)))
                        res(undefined)
                    }))
                    break;
                default:
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.write(`{ "code": 400, "message": "Invalid Content Type", "ecode": "INVTYP" }`)
                    return res.end()
            }

            client.send({
                db: 'users',
                method: 'editEntry'
            }, [uid.body.id, data, true], 'database', true)
                .then((data) => {
                    switch (data.head.type) {
                        case 'response':
                            res.writeHead(200, { 'Content-Type': 'application/json' })
                            res.write(`{ "code": 200, "message": "Edited User", "ecode": "VLDEDT" }`)
                            res.end()
                            break;
                        case 'error':
                            res.writeHead(500)
                            res.end()
                            break;
                    }
                })
            break;
        default:
            res.writeHead(400, 'Invalid Request Method', { 'Content-Type': 'application/json' })
            res.write(`{ "code": 400, "message": "Invalid Request Method", "ecode": "INVREQ" }`)
            res.end()
            break;
    }
}

const path = '/edit'
const type = 'webhandle'
const config = {}

export { path, type, config, handler }