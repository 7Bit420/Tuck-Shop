import { readdirRecersive } from './util/readdirRecersive'
import { client as wsClient } from './client'
import * as http from 'http'
import * as fs from 'fs'

const PWD = __dirname
const client = new wsClient('webserver', 5000)

const handlers = readdirRecersive(PWD + '/handlers').filter((t: string) => t.endsWith('.js'))

const webHandlers = []
const wsHandlers = []
var config
const specialHandlers = {
    http: undefined, ws: undefined
}

if (process.argv.includes('--dev')) {
    config = JSON.parse(fs.readFileSync(__dirname + './config.json').toString())
} else {
    config = JSON.parse(fs.readFileSync(process.env.configFile ?? __dirname + '/config.json').toString())
}

handlers.forEach(handlerPath => {
    const handler = require(`${PWD}/handlers/${handlerPath}`)

    switch (handler.type) {
        case 'special':
            switch (handler.config?.type) {
                case 'rootHttp':
                    specialHandlers.http = {
                        handle: handler.handler,
                        path: '/',
                        raw: handler
                    }
                    break;
                case 'rootWs':
                    specialHandlers.ws = {
                        handle: handler.handler,
                        path: '/',
                        raw: handler
                    }
                    break;
            }
            break;
        case 'webhandle':
            webHandlers.push({
                handle: handler.handler,
                path: handler.path,
                raw: handler
            })
            break;
        case 'wshandle':
            wsHandlers.push({
                handle: handler.handler,
                path: handler.path,
                raw: handler
            })
            break;
    }
})

const httpServer = http.createServer()

httpServer.on('request', (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    (
        webHandlers.find(handler => url.pathname.startsWith(handler.path)) ??
        specialHandlers.http
    ).handle(req, res);
})

httpServer.listen(80)

export { PWD, config, client }